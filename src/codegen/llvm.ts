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
  NodeGomTypeStruct,
  NodeIfStatement,
  NodeLetStatement,
  NodeMainFunction,
  NodeProgram,
  NodeReturnStatement,
  NodeStructInit,
  NodeTerm,
  NodeTupleLiteral,
  NodeTypeDefinition,
} from "../parser/rd/nodes";
import { ScopeManager } from "../semantics/scope";
import {
  GomCompositeType,
  GomFunctionType,
  GomPrimitiveTypeOrAlias,
  GomPrimitiveTypeOrAliasValue,
  GomStructType,
  GomTupleType,
  GomType,
  GomTypeKind,
} from "../semantics/type";
import { GomToken } from "../lexer/tokens";
import { GomErrorManager } from "../util/error";
import { Node } from "../parser/rd/tree";
import { BaseCodeGenerator } from "./common";
import { match } from "ts-pattern";
import { instanceOf } from "ts-pattern/dist/patterns";

export enum LLVMType {
  I8 = "int",
  FLOAT = "float",
  VOID = "void",
}

type ExpressionContext = Partial<{
  declLhs: NodeTerm;
  pointer: llvm.Value;
}>;

/**
 * Generates LLVM IR - todo to use llvm bindings
 */
export class CodeGenerator extends BaseCodeGenerator {
  private context: LLVMContext = new llvm.LLVMContext();
  private module: llvm.Module = new llvm.Module("mod", this.context);
  private builder: llvm.IRBuilder = new llvm.IRBuilder(this.context);
  private currentFunction: llvm.Function | null = null;
  private currentFunctionEntry: llvm.BasicBlock | null = null;

  private formatStrings: Record<GomPrimitiveTypeOrAliasValue, llvm.Value> = {};
  private globalStringPtrs: Record<string, llvm.Value> = {};

  private structTypes: Record<string, llvm.StructType> = {};

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

  private mapGomPrimitiveTypeToLLVMType(type: GomPrimitiveTypeOrAlias) {
    switch (type.typeString) {
      case "int":
        return llvm.Type.getInt32Ty(this.context);
      case "float":
        return llvm.Type.getFloatTy(this.context);
      case "void":
        return llvm.Type.getVoidTy(this.context);
      case "bool":
        return llvm.Type.getInt1Ty(this.context);
      case "str":
        return llvm.Type.getInt8PtrTy(this.context);
      default:
        throw new Error("Unknown type: " + type.toStr());
    }
  }

  private mapGomTupleTypeToLLVMType(type: GomTupleType) {
    const types = Array.from(type.fields).map((t) =>
      this.mapGomTypeToLLVMType(t[1])
    );
    return llvm.StructType.get(this.context, types);
  }

  private mapGomStructTypeToLLVMType(type: GomStructType) {
    const structType = this.structTypes[type.name];
    if (!structType) {
      throw new Error("Unknown type: " + type.name);
    }

    return structType;
  }

  private mapGomTypeToLLVMType(type: GomType): llvm.Type {
    if (type instanceof GomPrimitiveTypeOrAlias) {
      return this.mapGomPrimitiveTypeToLLVMType(type);
    } else if (type instanceof GomStructType) {
      return this.mapGomStructTypeToLLVMType(type);
    } else if (type instanceof GomTupleType) {
      return this.mapGomTupleTypeToLLVMType(type);
    }

    throw new Error("Unknown type: " + type.toStr());
  }

  private transformStringLiteral(value: string): string {
    let transformedValue = value;
    transformedValue = transformedValue.slice(1, -1);

    // escape sequences
    transformedValue = transformedValue.replace(/\\n/g, "\x0A");
    transformedValue = transformedValue.replace(/\\t/g, "\x09");
    transformedValue = transformedValue.replace(/\\r/g, "\x0D");

    return transformedValue;
  }

  private getStringLiteralPointer(node: NodeTerm): llvm.Value {
    const transformedValue = this.transformStringLiteral(node.token.value);
    return this.builder.CreateGlobalStringPtr(transformedValue, `.strliteral`);
  }

  private getFormatStringLiteralPointer(type: GomPrimitiveTypeOrAliasValue) {
    if (!this.formatStrings[type]) {
      if (!this.currentFunctionEntry) {
        this.errorManager.throwCodegenError({
          loc: 0,
          message: "Printing string literal outside function",
        });
      }

      const typeToFormatString = (t: GomPrimitiveTypeOrAliasValue) =>
        ({
          int: "%d",
          float: "%f",
          str: "%s",
          bool: "%d",
        }[t]);
      this.formatStrings[type] = this.builder.CreateGlobalStringPtr(
        `${typeToFormatString(type) || "%d"}`,
        `fmt.${type}`
      );
    }

    return this.formatStrings[type];
  }

  private writeGlobalFunctions(): void {
    const printFnType = llvm.FunctionType.get(
      this.builder.getInt32Ty(),
      [llvm.Type.getInt8PtrTy(this.context)],
      true
    );

    this.module.getOrInsertFunction("printf", printFnType);
  }

  override generateAndWriteFile(): void {
    const out = this.generate();
    writeFileSync(this.outputPath, out);
  }

  override generate(): string {
    this.symbolTableReader.enterScope("global");
    this.writeGlobalVariables();
    // Somehow this works now
    // Global functions have to be written here as writing format
    // strings in the global scope causes an error
    this.writeGlobalFunctions();
    this.visit(this.ast);
    this.symbolTableReader.exitScope();
    return this.module.print();
  }

  visitTypeDefinition(node: NodeTypeDefinition): void {
    if (node.rhs instanceof NodeGomTypeStruct) {
      const type = this.symbolTableReader.getType(node.name.token.value);
      if (!type) {
        this.errorManager.throwCodegenError({
          loc: node.loc,
          message: "Unknown type: " + node.name.token.value,
        });
      }
      const structType = llvm.StructType.create(
        this.context,
        node.name.token.value
      );
      const gomType = type.gomType as GomStructType;
      const fields = Array.from(gomType.fields).map(([_key, fieldType]) => {
        return this.mapGomTypeToLLVMType(fieldType);
      });
      structType.setBody(fields);

      this.structTypes[type.name] = structType;
    }
  }

  visitFunctionDefinition(node: NodeFunctionDefinition): void {
    this.symbolTableReader.enterScope(node.name.value);
    this.irScopeManager.enterScope(node.name.value);
    const fnType = node.resultantType as GomFunctionType;
    const returnTypeGom = fnType.returnType;
    const returnType = this.mapGomTypeToLLVMType(returnTypeGom);
    const argsType = (node.resultantType as GomFunctionType).args.map((arg) =>
      this.mapGomTypeToLLVMType(arg as GomPrimitiveTypeOrAlias)
    );

    if (fnType.usesSret()) {
      const sretArgType = llvm.PointerType.getUnqual(returnType);
      argsType.unshift(sretArgType);
    }

    const funcType = llvm.FunctionType.get(
      fnType.usesSret() ? llvm.Type.getVoidTy(this.context) : returnType,
      argsType,
      false
    );
    const fn = llvm.Function.Create(
      funcType,
      llvm.Function.LinkageTypes.ExternalLinkage,
      node.name.value,
      this.module
    );

    if (fnType.usesSret()) {
      fn.addParamAttr(0, llvm.Attribute.get(this.context, "sret"));
      fn.addParamAttr(0, llvm.Attribute.get(this.context, "noalias"));
    }

    const entry = llvm.BasicBlock.Create(this.context, "entry", fn);
    this.builder.SetInsertPoint(entry);

    node.args.forEach((arg, i) => {
      const index = fnType.usesSret() ? i + 1 : i;
      const alloca = this.builder.CreateAlloca(argsType[index], null);
      const argId = this.symbolTableReader.getIdentifier(arg.name.token.value);

      this.builder.CreateStore(fn.getArg(index), alloca);

      if (argId) {
        argId.allocaInst = alloca;
      }
    });

    this.currentFunction = fn;
    this.currentFunctionEntry = entry;
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
    for (const decl of node.decls) {
      if (!this.currentFunctionEntry) {
        // global variable
        if (
          decl.rhs instanceof NodeTerm &&
          decl.rhs.token.type === GomToken.NUMLITERAL
        ) {
          const type = llvm.Type.getInt32Ty(this.context);
          new llvm.GlobalVariable(
            type,
            true,
            llvm.GlobalValue.LinkageTypes.PrivateLinkage,
            llvm.ConstantInt.get(type, Number(decl.rhs.token.value)),
            decl.lhs.token.value
          );
        }
        continue;
      }

      // this.builder.SetInsertPoint(this.currentFunctionEntry);

      const type = this.mapGomTypeToLLVMType(decl.lhs.resultantType);
      const alloca = this.builder.CreateAlloca(
        type,
        null,
        decl.lhs.token.value
      );

      const id = this.symbolTableReader.getIdentifier(decl.lhs.token.value);
      if (id) {
        id.allocaInst = alloca;
      }

      const rhsValue = this.visitExpression(decl.rhs, {
        declLhs: decl.lhs,
        pointer: alloca,
      });

      if (!type.isStructTy()) {
        this.builder.CreateStore(rhsValue, alloca);
      }
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
      console.log("return statement", node.expr);
      if (node.expr.resultantType instanceof GomPrimitiveTypeOrAlias) {
        const exprValue = this.visitExpression(node.expr);
        this.builder.CreateRet(exprValue);
      } else {
        const fn = this.currentFunction;
        const sretPointer = fn.getArg(0);
        this.visitExpression(node.expr, {
          pointer: sretPointer,
        });
        this.builder.CreateRetVoid();
      }
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
    } else {
      this.builder.SetInsertPoint(elseBB);
      this.builder.CreateBr(mergeBB);
    }

    this.builder.SetInsertPoint(mergeBB);
  }

  visitForStatement(node: NodeForStatement): void {
    const currentFunction = this.currentFunction;
    if (!currentFunction) {
      this.errorManager.throwCodegenError({
        loc: node.loc,
        message: "For statement outside function",
      });
    }

    if (node.initExpr && node.conditionExpr && node.updateExpr) {
      // for loop
      const loopBB = llvm.BasicBlock.Create(
        this.context,
        "loop",
        currentFunction
      );
      const bodyBB = llvm.BasicBlock.Create(
        this.context,
        "loopbody",
        currentFunction
      );
      const updateBB = llvm.BasicBlock.Create(
        this.context,
        "loopupdate",
        currentFunction
      );
      const afterBB = llvm.BasicBlock.Create(
        this.context,
        "afterloop",
        currentFunction
      );

      this.visitExpression(node.initExpr);

      this.builder.CreateBr(loopBB);
      this.builder.SetInsertPoint(loopBB);

      const condValue = this.visitExpression(node.conditionExpr);
      this.builder.CreateCondBr(condValue, bodyBB, afterBB);

      this.builder.SetInsertPoint(bodyBB);
      this.symbolTableReader.enterScope("for");
      this.irScopeManager.enterScope("for");
      node.body.forEach((stmt) => this.visit(stmt));
      this.symbolTableReader.exitScope();
      this.irScopeManager.exitScope();
      this.builder.CreateBr(updateBB);

      this.builder.SetInsertPoint(updateBB);
      this.visitExpression(node.updateExpr);
      this.builder.CreateBr(loopBB);

      this.builder.SetInsertPoint(afterBB);
    } else {
      // infinite loop
      const loopBB = llvm.BasicBlock.Create(
        this.context,
        "infloop",
        currentFunction
      );
      const afterBB = llvm.BasicBlock.Create(
        this.context,
        "afterinfloop",
        currentFunction
      );

      this.builder.CreateBr(loopBB);
      this.builder.SetInsertPoint(loopBB);
      this.symbolTableReader.enterScope("for");
      this.irScopeManager.enterScope("for");
      node.body.forEach((stmt) => this.visit(stmt));
      this.symbolTableReader.exitScope();
      this.irScopeManager.exitScope();
      this.builder.CreateBr(loopBB);

      // later for break;
      this.builder.SetInsertPoint(afterBB);
    }
  }

  visitExpression(expr: NodeExpr, context?: ExpressionContext): llvm.Value {
    if (expr instanceof NodeAccess) {
      return this.visitAccess(expr);
    } else if (expr instanceof NodeBinaryOp) {
      return this.visitBinaryOp(expr);
    } else if (expr instanceof NodeCall) {
      return this.visitCall(expr, context);
    } else if (expr instanceof NodeTerm) {
      return this.visitTerm(expr);
    } else if (expr instanceof NodeAssignment) {
      return this.visitAssignment(expr);
    } else if (expr instanceof NodeStructInit) {
      return this.visitStructInit(expr, context);
    } else if (expr instanceof NodeTupleLiteral) {
      return this.visitTupleLiteral(expr, context);
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

  visitStructInit(
    node: NodeStructInit,
    context?: ExpressionContext
  ): llvm.Value {
    if (!context?.declLhs) {
      this.errorManager.throwCodegenError({
        loc: node.loc,
        message: "Struct init without declaration",
      });
    }
    const structId = this.symbolTableReader.getIdentifier(
      context.declLhs.token.value
    );
    if (!structId) {
      this.errorManager.throwCodegenError({
        loc: node.loc,
        message: "Unknown struct: " + node.structTypeName.token.value,
      });
    }

    if (!structId.allocaInst) {
      this.errorManager.throwCodegenError({
        loc: node.loc,
        message: "Struct not allocated: " + node.structTypeName.token.value,
      });
    }
    const structAlloca = structId.allocaInst;
    const structType = this.mapGomTypeToLLVMType(node.resultantType);
    const index0 = this.builder.getInt32(0);
    node.fields.forEach((field, i) => {
      const fieldVal = this.visitExpression(field[1]);
      const fieldPtr = this.builder.CreateGEP(
        structType,
        structAlloca,
        [index0, this.builder.getInt32(i)],
        "fieldptr"
      );
      this.builder.CreateStore(fieldVal, fieldPtr);
    });
    return structAlloca;
  }

  visitTupleLiteral(
    node: NodeTupleLiteral,
    context?: ExpressionContext
  ): llvm.Value {
    const type = this.mapGomTypeToLLVMType(node.resultantType as GomTupleType);
    const tuple =
      context?.pointer ?? this.builder.CreateAlloca(type, null, "tuple");
    node.elements.forEach((element, i) => {
      const fieldVal = this.visitExpression(element);
      const fieldPtr = this.builder.CreateGEP(
        type,
        tuple,
        [this.builder.getInt32(0), this.builder.getInt32(i)],
        "fieldptr"
      );
      this.builder.CreateStore(fieldVal, fieldPtr);
    });
    return tuple;
  }

  visitAccess(node: NodeAccess): llvm.Value {
    const idName = node.lhs.token.value;
    if (idName === "io" && node.rhs instanceof NodeCall) {
      const fn = this.module.getFunction("printf");
      if (!fn) {
        this.errorManager.throwCodegenError({
          message: "printf function not added globally",
          loc: node.loc,
        });
      }

      const args = node.rhs.args.map((arg) => this.visitExpression(arg));
      // print each argument
      let i = 0;
      const key = "calltmp";
      for (const arg of args) {
        const currentArg = node.rhs.args[i];
        if (
          currentArg instanceof NodeTerm &&
          currentArg.token.type === GomToken.STRLITERAL
        ) {
          this.builder.CreateCall(fn, [arg], key + i);
        } else {
          const formatString = this.getFormatStringLiteralPointer(
            (currentArg.resultantType as GomPrimitiveTypeOrAlias).typeString
          );
          this.builder.CreateCall(fn, [formatString, arg], key + i);
        }
        i++;
      }

      if (!this.globalStringPtrs["newline"]) {
        this.globalStringPtrs["newline"] = this.builder.CreateGlobalStringPtr(
          "\n",
          "newline"
        );
      }
      const newline = this.globalStringPtrs["newline"];
      this.builder.CreateCall(fn, [newline], "newline");
      return this.builder.getInt32(0);
    } else if (
      (node.lhs.resultantType instanceof GomStructType ||
        node.lhs.resultantType instanceof GomTupleType) &&
      node.rhs instanceof NodeTerm
    ) {
      const type = node.lhs.resultantType;
      const structType = this.mapGomTypeToLLVMType(node.lhs.resultantType);
      const struct = this.symbolTableReader.getIdentifier(idName);
      if (!struct) {
        this.errorManager.throwCodegenError({
          loc: node.loc,
          message: "Unknown struct: " + idName,
        });
      }

      if (!struct.allocaInst) {
        this.errorManager.throwCodegenError({
          loc: node.loc,
          message: "Struct not allocated: " + idName,
        });
      }

      const index =
        type instanceof GomStructType
          ? this.builder.getInt32(
              Array.from(type.fields.keys()).indexOf(node.rhs.token.value)
            )
          : this.builder.getInt32(Number(node.rhs.token.value));

      const ptr = this.builder.CreateGEP(
        structType,
        struct.allocaInst,
        [this.builder.getInt32(0), index],
        "fieldptr"
      );
      return this.builder.CreateLoad(
        this.mapGomTypeToLLVMType(node.rhs.resultantType),
        ptr,
        "fieldload"
      );
    }

    return this.builder.getInt32(0);
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

  visitCall(node: NodeCall, context?: ExpressionContext): llvm.Value {
    const fn = this.module.getFunction(node.id.token!.value);
    const gomFn = this.symbolTableReader.getIdentifier(node.id.token!.value);
    if (!fn || !gomFn) {
      throw new Error("Unknown function: " + node.id.token!.value);
    }

    /**
     * Check if the function uses sret (for any function returning a non-primitive type)
     */
    if (gomFn.type instanceof GomFunctionType && gomFn.type.usesSret()) {
      const sretPointer =
        context?.pointer ??
        this.builder.CreateAlloca(
          this.mapGomTypeToLLVMType(gomFn.type.returnType),
          null,
          "sret"
        );
      const args = node.args.map((arg) => this.visitExpression(arg));
      this.builder.CreateCall(fn, [sretPointer, ...args]);
      return sretPointer;
    } else {
      const args = node.args.map((arg) =>
        this.visitExpression(arg, { pointer: context?.pointer })
      );
      return this.builder.CreateCall(fn, args, "calltmp");
    }
  }

  visitTerm(node: NodeTerm): llvm.Value {
    const type = node.token.type;
    if (type === GomToken.NUMLITERAL) {
      return this.builder.getInt32(parseInt(node.token.value));
    } else if (type === GomToken.STRLITERAL) {
      return this.getStringLiteralPointer(node);
    } else if (type === GomToken.IDENTIFIER) {
      const id = this.symbolTableReader.getIdentifier(node.token.value);
      if (!id) {
        // throw new Error("Unknown identifier: " + node.token.value);
        this.errorManager.throwCodegenError({
          loc: node.loc,
          message: "Unknown identifier: " + node.token.value,
        });
      }
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
      return this.builder.getInt1(true);
    } else if (type === GomToken.FALSE) {
      return this.builder.getInt1(false);
    } else {
      throw new Error("Unknown term type: " + type);
    }
  }
}
