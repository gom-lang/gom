import llvm, { LLVMContext } from "llvm-bindings";
import { writeFileSync } from "fs";
import {
  NodeAccess,
  NodeAssignment,
  NodeBinaryOp,
  NodeCall,
  NodeExpr,
  NodeExprBracketed,
  NodeExpressionStatement,
  NodeForStatement,
  NodeFunctionDefinition,
  NodeIfStatement,
  NodeLetStatement,
  NodeMainFunction,
  NodeProgram,
  NodeReturnStatement,
  NodeTerm,
} from "../parser/rd/nodes";
import { ScopeManager } from "../semantics/scope";
import { GomPrimitiveTypeOrAlias, GomType } from "../semantics/type";
import { GomToken } from "../lexer/tokens";
import { GomErrorManager } from "../util/error";
import { Node } from "../parser/rd/tree";
import { BaseCodeGenerator } from "./common";

export enum LLVMType {
  I8 = "i8",
  FLOAT = "float",
  VOID = "void",
}

/**
 * Generates LLVM IR - todo to use llvm bindings
 */
export class CodeGenerator extends BaseCodeGenerator {
  private context: LLVMContext = new llvm.LLVMContext();
  private module: llvm.Module = new llvm.Module("mod", this.context);
  private builder: llvm.IRBuilder = new llvm.IRBuilder(this.context);
  private currentFunction: llvm.Function | null = null;
  private currentFunctionEntry: llvm.BasicBlock | null = null;

  constructor({
    ast,
    scopeManager,
    outputPath = "out.ll",
    errorManager,
  }: {
    ast: NodeProgram;
    scopeManager: ScopeManager;
    errorManager: GomErrorManager;
    outputPath?: string;
  }) {
    super({ ast, scopeManager, outputPath, errorManager });
  }

  private writeGlobalVariables(): void {
    const globalVariables = this.symbolTableReader
      .getAllIdentifiers()
      .filter((id) => !id.isFunction());

    globalVariables.forEach((id) => {
      const type = this.mapGomTypeToLLVMType(
        id.type as GomPrimitiveTypeOrAlias
      );
      const global = new llvm.GlobalVariable(
        this.module,
        type,
        false,
        llvm.Function.LinkageTypes.ExternalLinkage,
        null,
        id.name
      );

      if (id.valueExpr) {
        // const initVal = this.visitExpression(id.valueExpr);
        // global.setInitializer(initVal);
      } else {
        global.setInitializer(llvm.Constant.getNullValue(type));
      }
    });
  }

  private mapGomTypeToLLVMType(type: GomPrimitiveTypeOrAlias) {
    switch (type.typeString) {
      case "i8":
        return llvm.Type.getInt8Ty(this.context);
      case "f32":
        return llvm.Type.getFloatTy(this.context);
      case "void":
        return llvm.Type.getVoidTy(this.context);
      default:
        throw new Error("Unknown type: " + type.toStr());
    }
  }

  private getExpressionLLVMType(node: NodeExpr): llvm.Type {
    let type: GomType | null = null;
    if (
      node instanceof NodeTerm ||
      node instanceof NodeCall ||
      node instanceof NodeBinaryOp ||
      node instanceof NodeAccess
    ) {
      type = node.resultantType;
    } else if (node instanceof NodeExprBracketed) {
      return this.getExpressionLLVMType(node.expr);
    }

    if (type === null) {
      throw new Error("Unknown expression type");
    }

    return this.mapGomTypeToLLVMType(type as GomPrimitiveTypeOrAlias);
  }

  private writeGlobalFunctions(): void {
    const printFnType = llvm.FunctionType.get(
      this.builder.getInt32Ty(),
      [this.builder.getInt8PtrTy()],
      false
    );

    llvm.Function.Create(
      printFnType,
      llvm.Function.LinkageTypes.ExternalLinkage,
      "printf",
      this.module
    );
  }

  override generate(): void {
    console.log("Generating code...");
    this.symbolTableReader.enterScope("global");
    this.writeGlobalFunctions();
    this.writeGlobalVariables();
    this.visit(this.ast);
    this.symbolTableReader.exitScope();
    console.log(this.module.print());
    writeFileSync(this.outputPath, this.module.print());
  }

  visitFunctionDefinition(node: NodeFunctionDefinition): void {
    console.log("Function", node.name.value);

    this.symbolTableReader.enterScope(node.name.value);
    this.irScopeManager.enterScope(node.name.value);
    const returnType = this.mapGomTypeToLLVMType(
      node.gomType.returnType as GomPrimitiveTypeOrAlias
    );
    const argsType = node.gomType.args.map((arg) =>
      this.mapGomTypeToLLVMType(arg as GomPrimitiveTypeOrAlias)
    );

    const funcType = llvm.FunctionType.get(returnType, argsType, false);
    const fn = llvm.Function.Create(
      funcType,
      llvm.Function.LinkageTypes.ExternalLinkage,
      node.name.value,
      this.module
    );

    const entry = llvm.BasicBlock.Create(this.context, "entry", fn);
    this.builder.SetInsertPoint(entry);

    node.args.forEach((arg, i) => {
      const alloca = this.builder.CreateAlloca(argsType[i], null);
      const argId = this.symbolTableReader.getIdentifier(arg.name.token.value);

      this.builder.CreateStore(fn.getArg(i), alloca);

      if (argId) {
        argId.allocaInst = alloca;
      }
    });

    this.currentFunction = fn;
    this.currentFunctionEntry = entry;
    console.log("body", node.body);
    node.body.forEach((stmt) => this.visit(stmt));

    this.irScopeManager.exitScope();
    this.symbolTableReader.exitScope();
  }

  visitMainFunction(node: NodeMainFunction): void {
    this.symbolTableReader.enterScope("main");
    this.irScopeManager.enterScope("main");

    const funcType = llvm.FunctionType.get(this.builder.getVoidTy(), [], false);
    const mainFunction = llvm.Function.Create(
      funcType,
      llvm.Function.LinkageTypes.ExternalLinkage,
      "main",
      this.module
    );

    const entry = llvm.BasicBlock.Create(this.context, "entry", mainFunction);
    this.builder.SetInsertPoint(entry);

    this.currentFunction = mainFunction;
    this.currentFunctionEntry = entry;

    node.body.forEach((stmt) => this.visit(stmt));

    this.irScopeManager.exitScope();
    this.symbolTableReader.exitScope();

    this.builder.CreateRetVoid();
  }

  visitLetStatement(node: NodeLetStatement): void {
    if (!this.currentFunctionEntry) {
      this.errorManager.throwCodegenError({
        loc: node.loc,
        message: "Let statement outside function",
      });
    }

    this.builder.SetInsertPoint(this.currentFunctionEntry);

    console.log("Let statement");
    for (const decl of node.decls) {
      console.log("Decl", decl);
      const type = this.mapGomTypeToLLVMType(
        decl.lhs.resultantType as GomPrimitiveTypeOrAlias
      );
      console.log("Type", type);
      const alloca = this.builder.CreateAlloca(
        type,
        null,
        decl.lhs.token.value
      );
      console.log("Alloca", alloca);

      const id = this.symbolTableReader.getIdentifier(decl.lhs.token.value);
      if (id) {
        id.allocaInst = alloca;
      }

      const rhsValue = this.visitExpression(decl.rhs);

      const allocaType = alloca.getAllocatedType();
      const rhsType = rhsValue.getType();
      console.log(
        "Type compatibility check:",
        "alloca:",
        allocaType.toString(),
        "rhs:",
        rhsType.toString()
      );

      this.builder.CreateStore(rhsValue, alloca);
    }
  }

  visitExpressionStatement(node: NodeExpressionStatement): void {
    this.visit(node.expr);
  }

  visitReturnStatement(node: NodeReturnStatement): void {
    if (!this.currentFunction) {
      this.errorManager.throwCodegenError({
        loc: node.loc,
        message: "Return statement outside function",
      });
    }

    if (node.expr) {
      const exprValue = this.visitExpression(node.expr);
      this.builder.CreateRet(exprValue);
    } else {
      this.builder.CreateRetVoid();
    }
  }

  visitIfStatement(node: NodeIfStatement): void {
    const condValue = this.visitExpression(node.conditionExpr);
    const currentFunction = this.currentFunction;
    if (!currentFunction) {
      this.errorManager.throwCodegenError({
        loc: node.loc,
        message: "If statement outside function",
      });
    }

    const thenBB = llvm.BasicBlock.Create(
      this.context,
      "then",
      currentFunction
    );
    const elseBB = llvm.BasicBlock.Create(
      this.context,
      "else",
      currentFunction
    );
    const mergeBB = llvm.BasicBlock.Create(
      this.context,
      "merge",
      currentFunction
    );

    this.builder.CreateCondBr(condValue, thenBB, elseBB);

    this.builder.SetInsertPoint(thenBB);
    this.symbolTableReader.enterScope("if");
    this.irScopeManager.enterScope("if");
    node.body.forEach((stmt) => this.visit(stmt));
    this.symbolTableReader.exitScope();
    this.irScopeManager.exitScope();
    this.builder.CreateBr(mergeBB);

    if (node.elseBody) {
      this.builder.SetInsertPoint(elseBB);
      this.symbolTableReader.enterScope("else");
      this.irScopeManager.enterScope("else");
      node.elseBody.forEach((stmt) => this.visit(stmt));
      this.symbolTableReader.exitScope();
      this.irScopeManager.exitScope();
      this.builder.CreateBr(mergeBB);
    }

    this.builder.SetInsertPoint(mergeBB);
  }

  visitForStatement(node: NodeForStatement): void {
    this.symbolTableReader.enterScope("for");
    this.irScopeManager.enterScope("for");
    const currentFunction = this.currentFunction;
    if (!currentFunction) {
      this.errorManager.throwCodegenError({
        loc: node.loc,
        message: "For statement outside function",
      });
    }

    if (node.conditionExpr) {
      // for loop
      const loopBB = llvm.BasicBlock.Create(
        this.context,
        "loop",
        currentFunction
      );
      const afterBB = llvm.BasicBlock.Create(
        this.context,
        "afterloop",
        currentFunction
      );

      this.builder.CreateBr(loopBB);

      this.builder.SetInsertPoint(loopBB);
      if (node.initExpr) {
        this.visitExpression(node.initExpr);
        // todo
      }

      const condValue = this.visitExpression(node.conditionExpr);
      this.builder.CreateCondBr(condValue, loopBB, afterBB);

      this.builder.SetInsertPoint(afterBB);
    } else {
      // infinite loop
      const loopBB = llvm.BasicBlock.Create(
        this.context,
        "loop",
        currentFunction
      );

      this.builder.CreateBr(loopBB);
      this.builder.SetInsertPoint(loopBB);
    }

    node.body.forEach((stmt) => this.visit(stmt));

    this.irScopeManager.exitScope();
    this.symbolTableReader.exitScope();
  }

  visitExpression(expr: NodeExpr): llvm.Value {
    if (expr instanceof NodeAccess) {
      return this.visitAccess(expr);
    } else if (expr instanceof NodeBinaryOp) {
      return this.visitBinaryOp(expr);
    } else if (expr instanceof NodeCall) {
      return this.visitCall(expr);
    } else if (expr instanceof NodeTerm) {
      return this.visitTerm(expr);
    } else if (expr instanceof NodeAssignment) {
      return this.visitAssignment(expr);
    } else if (expr instanceof NodeExprBracketed) {
      return this.visitExpression(expr.expr);
    }

    throw new Error("Unknown expression type: " + (expr as Node).type);
  }

  visitAssignment(node: NodeAssignment): llvm.Value {
    const id = this.symbolTableReader.getIdentifier(node.lhs.token.value);
    if (!id) {
      this.errorManager.throwCodegenError({
        loc: node.loc,
        message: "Unknown identifier: " + node.lhs.token.value,
      });
    }

    const rhsValue = this.visitExpression(node.rhs);
    this.builder.CreateStore(rhsValue, id.allocaInst!);
    return rhsValue;
  }

  visitAccess(node: NodeAccess): llvm.Value {
    throw new Error("Method not implemented.");
  }

  visitBinaryOp(node: NodeBinaryOp): llvm.Value {
    const op = node.op;
    const lhs = this.visitExpression(node.lhs);
    const rhs = this.visitExpression(node.rhs);

    switch (op.type) {
      case GomToken.PLUS:
        return this.builder.CreateAdd(lhs, rhs, "addtmp");
      case GomToken.MINUS:
        return this.builder.CreateSub(lhs, rhs, "subtmp");
      case GomToken.MUL:
        return this.builder.CreateMul(lhs, rhs, "multmp");
      case GomToken.DIV:
        return this.builder.CreateSDiv(lhs, rhs, "divtmp");
      case GomToken.EQEQ:
        return this.builder.CreateICmpEQ(lhs, rhs, "eqtmp");
      case GomToken.LT:
        return this.builder.CreateICmpSLT(lhs, rhs, "lttmp");
      case GomToken.GT:
        return this.builder.CreateICmpSGT(lhs, rhs, "gttmp");
      case GomToken.LTE:
        return this.builder.CreateICmpSLE(lhs, rhs, "ltetmp");
      case GomToken.GTE:
        return this.builder.CreateICmpSGE(lhs, rhs, "gtetmp");
      default:
        throw new Error("Unknown operator: " + op.type);
    }
  }

  visitCall(node: NodeCall): llvm.Value {
    const fn = this.module.getFunction(node.id.token!.value);
    if (!fn) {
      throw new Error("Unknown function: " + node.id.token!.value);
    }

    const args = node.args.map((arg) => this.visitExpression(arg));
    return this.builder.CreateCall(fn, args, "calltmp");
  }

  visitTerm(node: NodeTerm): llvm.Value {
    const type = node.token.type;
    if (type === GomToken.NUMLITERAL) {
      return this.builder.getInt8(parseInt(node.token.value));
    } else if (type === GomToken.STRLITERAL) {
      // todo
      throw new Error("Not implemented");
    } else if (type === GomToken.IDENTIFIER) {
      const id = this.symbolTableReader.getIdentifier(node.token.value);
      console.log("ID", id);
      if (!id) {
        // throw new Error("Unknown identifier: " + node.token.value);
        this.errorManager.throwCodegenError({
          loc: node.loc,
          message: "Unknown identifier: " + node.token.value,
        });
      }
      console.log("ID", id);
      if (!id.allocaInst) {
        // throw new Error("Identifier not allocated: " + node.token.value);
        this.errorManager.throwCodegenError({
          loc: node.loc,
          message: "Identifier not allocated: " + node.token.value,
        });
      }

      return this.builder.CreateLoad(
        this.mapGomTypeToLLVMType(id.type as GomPrimitiveTypeOrAlias),
        id.allocaInst,
        id.name + ".load"
      );
    } else if (type === GomToken.TRUE) {
      return this.builder.getInt8(1);
    } else if (type === GomToken.FALSE) {
      return this.builder.getInt8(0);
    } else {
      throw new Error("Unknown term type: " + type);
    }
  }
}
