import llvm, { LLVMContext } from "llvm-bindings";
import { writeFileSync } from "node:fs";
import {
  NodeAccess,
  NodeAssignment,
  NodeBinaryOp,
  NodeCall,
  NodeCollectionInit,
  NodeExpr,
  NodeExprBracketed,
  NodeExpressionStatement,
  NodeForStatement,
  NodeFunctionDefinition,
  NodeGomTypeList,
  NodeGomTypeStruct,
  NodeGomTypeTuple,
  NodeIfStatement,
  NodeLetStatement,
  NodeMainFunction,
  NodeProgram,
  NodeReturnStatement,
  NodeStructInit,
  NodeTerm,
  NodeTupleLiteral,
  NodeTypeDefinition,
  NodeBreakStatement,
  NodeContinueStatement,
} from "../parser/rd/nodes";
import { ScopeManager } from "../semantics/scope";
import {
  GomFunctionType,
  GomListType,
  GomPrimitiveTypeOrAlias,
  GomPrimitiveTypeOrAliasValue,
  GomStructType,
  GomTupleType,
  GomType,
} from "../semantics/type";
import { GomToken } from "../lexer/tokens";
import { GomErrorManager } from "../util/error";
import { Node } from "../parser/rd/tree";
import { BaseCodeGenerator } from "./common";

export enum LLVMType {
  I8 = "int",
  FLOAT = "float",
  VOID = "void",
}

type ExpressionContext = Partial<{
  declLhs: NodeTerm;
  pointer: llvm.Value;
}>;

const LIST_INITIAL_CAPACITY = 16;

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

  private complexTypes: Record<string, llvm.StructType> = {};

  private mallocedPointers: Record<string, llvm.Value> = {};

  // Stack to support nested loops
  private loopStack: Array<{
    breakBB: llvm.BasicBlock;
    continueBB: llvm.BasicBlock;
  }> = [];

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
    const structType = this.complexTypes[type.name];
    if (!structType) {
      throw new Error("Unknown type: " + type.name);
    }

    return structType;
  }

  private mapGomListTypeToLLVMType(type: GomListType) {
    const listType = this.complexTypes[type.name];
    if (!listType) {
      throw new Error("Unknown type: " + type.name);
    }

    return listType;
  }

  private mapGomTypeToLLVMType(type: GomType): llvm.Type {
    if (type instanceof GomPrimitiveTypeOrAlias) {
      return this.mapGomPrimitiveTypeToLLVMType(type);
    } else if (type instanceof GomStructType) {
      return this.mapGomStructTypeToLLVMType(type);
    } else if (type instanceof GomTupleType) {
      return this.mapGomTupleTypeToLLVMType(type);
    } else if (type instanceof GomListType) {
      return this.mapGomListTypeToLLVMType(type);
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

    const mallocFnType = llvm.FunctionType.get(
      this.builder.getInt8PtrTy(),
      [this.builder.getInt32Ty()],
      false
    );
    this.module.getOrInsertFunction("malloc", mallocFnType);

    // Ensure realloc is available for growth
    const reallocFnType = llvm.FunctionType.get(
      this.builder.getInt8PtrTy(),
      [this.builder.getInt8PtrTy(), this.builder.getInt32Ty()],
      false
    );
    this.module.getOrInsertFunction("realloc", reallocFnType);
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

      this.complexTypes[type.name] = structType;
    } else if (node.rhs instanceof NodeGomTypeTuple) {
      const type = this.symbolTableReader.getType(node.name.token.value);
      if (!type) {
        this.errorManager.throwCodegenError({
          loc: node.loc,
          message: "Unknown type: " + node.name.token.value,
        });
      }
      const tupleType = llvm.StructType.create(
        this.context,
        node.name.token.value
      );
      const gomType = type.gomType as GomTupleType;
      const fields = Array.from(gomType.fields).map(([_key, fieldType]) => {
        return this.mapGomTypeToLLVMType(fieldType);
      });
      tupleType.setBody(fields);
      this.complexTypes[type.name] = tupleType;
    } else if (node.rhs instanceof NodeGomTypeList) {
      const type = this.symbolTableReader.getType(node.name.token.value);
      if (!type) {
        this.errorManager.throwCodegenError({
          loc: node.loc,
          message: "Unknown type: " + node.name.token.value,
        });
      }
      const listType = llvm.StructType.create(
        this.context,
        node.name.token.value
      );
      const gomType = type.gomType as GomListType;
      const elementType = this.mapGomTypeToLLVMType(gomType.elementType);
      listType.setBody([
        llvm.PointerType.get(elementType, 0), // data
        llvm.Type.getInt32Ty(this.context), // size
        llvm.Type.getInt32Ty(this.context), // capacity
      ]);

      this.complexTypes[type.name] = listType;
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

      console.log("RHS Value:", rhsValue, "Type:", rhsValue.getType());

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
    this.symbolTableReader.enterScope(`for.${node._id}`);
    this.irScopeManager.enterScope(`for.${node._id}`);

    const currentFunction = this.currentFunction;
    if (!currentFunction) {
      this.errorManager.throwCodegenError({
        loc: node.loc,
        message: "For statement outside function",
      });
    }

    if (node.initExpr && node.conditionExpr && node.updateExpr) {
      // for(init; cond; update) { body }
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

      if (node.initExpr instanceof NodeLetStatement) {
        this.visitLetStatement(node.initExpr);
      } else {
        this.visitExpression(node.initExpr as unknown as NodeExpr);
      }

      this.builder.CreateBr(loopBB);
      this.builder.SetInsertPoint(loopBB);

      const condValue = this.visitExpression(node.conditionExpr);
      this.builder.CreateCondBr(condValue, bodyBB, afterBB);

      this.builder.SetInsertPoint(bodyBB);

      // push loop targets
      this.loopStack.push({ breakBB: afterBB, continueBB: updateBB });

      node.body.forEach((stmt) => this.visit(stmt));

      // pop loop targets
      this.loopStack.pop();

      // fallthrough from body goes to update
      this.builder.CreateBr(updateBB);

      this.builder.SetInsertPoint(updateBB);
      this.visitExpression(node.updateExpr);
      this.builder.CreateBr(loopBB);

      this.builder.SetInsertPoint(afterBB);
    } else {
      // infinite loop: for(;;) { body }
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

      // push loop targets (continue goes to loop head)
      this.loopStack.push({ breakBB: afterBB, continueBB: loopBB });

      node.body.forEach((stmt) => this.visit(stmt));

      // pop loop targets
      this.loopStack.pop();

      // loop back if no break/continue changed the IP
      this.builder.CreateBr(loopBB);

      // later for break;
      this.builder.SetInsertPoint(afterBB);
    }

    // NEW: exit loop-wide scope
    this.irScopeManager.exitScope();
    this.symbolTableReader.exitScope();
  }

  // Handle `break;`
  visitBreakStatement(node: NodeBreakStatement): void {
    if (this.loopStack.length === 0) {
      this.errorManager.throwCodegenError({
        loc: node.loc,
        message: "break used outside of a loop",
      });
    }
    const { breakBB } = this.loopStack[this.loopStack.length - 1];
    this.builder.CreateBr(breakBB);

    // Create a fresh block to keep emitting code (it will be unreachable)
    const after = llvm.BasicBlock.Create(
      this.context,
      "after.break",
      this.currentFunction!
    );
    this.builder.SetInsertPoint(after);
  }

  // Handle `continue;`
  visitContinueStatement(node: NodeContinueStatement): void {
    if (this.loopStack.length === 0) {
      this.errorManager.throwCodegenError({
        loc: node.loc,
        message: "continue used outside of a loop",
      });
    }
    const { continueBB } = this.loopStack[this.loopStack.length - 1];
    this.builder.CreateBr(continueBB);

    // Create a fresh block to keep emitting code (it will be unreachable)
    const after = llvm.BasicBlock.Create(
      this.context,
      "after.continue",
      this.currentFunction!
    );
    this.builder.SetInsertPoint(after);
  }

  visitExpression(expr: NodeExpr, context?: ExpressionContext): llvm.Value {
    if (expr instanceof NodeAccess) {
      return this.visitAccess(expr, context);
    } else if (expr instanceof NodeBinaryOp) {
      return this.visitBinaryOp(expr, context);
    } else if (expr instanceof NodeCall) {
      return this.visitCall(expr, context);
    } else if (expr instanceof NodeTerm) {
      return this.visitTerm(expr, context);
    } else if (expr instanceof NodeAssignment) {
      return this.visitAssignment(expr);
    } else if (expr instanceof NodeStructInit) {
      return this.visitStructInit(expr, context);
    } else if (expr instanceof NodeCollectionInit) {
      return this.visitCollectionInit(expr, context);
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
    console.log(id);
    const rhsValue = this.visitExpression(node.rhs);
    this.builder.CreateStore(rhsValue, id.allocaInst!);
    return rhsValue;
  }

  visitStructInit(
    node: NodeStructInit,
    context?: ExpressionContext
  ): llvm.Value {
    if (context?.declLhs) {
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
    } else {
      const structType = this.mapGomTypeToLLVMType(node.resultantType);
      const structAlloca = this.builder.CreateAlloca(
        structType,
        null,
        node.structTypeName.token.value + "_instance"
      );
      node.fields.forEach((field, i) => {
        const fieldVal = this.visitExpression(field[1]);
        const fieldPtr = this.builder.CreateGEP(
          structType,
          structAlloca,
          [this.builder.getInt32(0), this.builder.getInt32(i)],
          "fieldptr"
        );
        this.builder.CreateStore(fieldVal, fieldPtr);
      });
      return structAlloca;
    }
  }

  visitCollectionInit(
    node: NodeCollectionInit,
    context?: ExpressionContext
  ): llvm.Value {
    if (node.resultantType instanceof GomTupleType) {
      const type = this.mapGomTypeToLLVMType(
        node.resultantType as GomTupleType
      );
      const tuple = this.builder.CreateAlloca(type, null, "tuple");
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
    } else if (node.resultantType instanceof GomListType) {
      const gomListType = node.resultantType as GomListType;
      const listType = this.mapGomTypeToLLVMType(gomListType);
      // const listPtr = this.builder.CreateAlloca(listType, null, "list_ptr");
      const listPtr = context?.pointer
        ? context.pointer
        : this.builder.CreateAlloca(listType, null, "list_ptr");

      const dataPtrPtr = this.builder.CreateGEP(
        listType,
        listPtr,
        [this.builder.getInt32(0), this.builder.getInt32(0)],
        "data_ptr_ptr"
      );
      const sizePtr = this.builder.CreateGEP(
        listType,
        listPtr,
        [this.builder.getInt32(0), this.builder.getInt32(1)],
        "size_ptr"
      );
      const capacityPtr = this.builder.CreateGEP(
        listType,
        listPtr,
        [this.builder.getInt32(0), this.builder.getInt32(2)],
        "capacity_ptr"
      );

      const initialCapacity = this.builder.getInt32(
        Math.max(LIST_INITIAL_CAPACITY, node.elements.length)
      );
      this.builder.CreateStore(initialCapacity, capacityPtr);
      this.builder.CreateStore(
        this.builder.getInt32(node.elements.length),
        sizePtr
      );

      const elementType = this.mapGomTypeToLLVMType(gomListType.elementType);
      console.log("Element type:", elementType, gomListType.elementType);
      const arrayElementType = elementType;
      const sizeOfType = llvm.ConstantInt.get(
        llvm.Type.getInt32Ty(this.context),
        this.module.getDataLayout().getTypeAllocSize(elementType)
      );
      console.log("Size of type:", sizeOfType);
      const mallocSize = this.builder.CreateMul(
        initialCapacity,
        sizeOfType,
        "malloc_size"
      );
      const mallocFn = this.module.getFunction("malloc");
      if (!mallocFn) {
        this.errorManager.throwCodegenError({
          loc: node.loc,
          message: "malloc function not added globally",
        });
      }
      const mallocCall = this.builder.CreateCall(
        mallocFn,
        [mallocSize],
        "malloc_call"
      );
      const dataAlloca = this.builder.CreateBitCast(
        mallocCall,
        llvm.PointerType.get(arrayElementType, 0),
        "data_alloca"
      );
      this.builder.CreateStore(dataAlloca, dataPtrPtr);

      // initialize elements
      node.elements.forEach((element, i) => {
        let elementVal = this.visitExpression(element);
        if (elementVal.getType().isPointerTy()) {
          elementVal = this.builder.CreateLoad(
            this.mapGomTypeToLLVMType(gomListType.elementType),
            elementVal,
            "element_load"
          );
        }
        const elementPtr = this.builder.CreateInBoundsGEP(
          arrayElementType,
          dataAlloca,
          [this.builder.getInt32(i)],
          "element_ptr"
        );
        this.builder.CreateStore(elementVal, elementPtr);
      });

      return listPtr;
    }

    this.errorManager.throwCodegenError({
      loc: node.loc,
      message: "Collection init without tuple or list type",
    });
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

  visitAccess(node: NodeAccess, context?: ExpressionContext): llvm.Value {
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
      const load = this.builder.CreateLoad(
        this.mapGomTypeToLLVMType(node.rhs.resultantType),
        ptr,
        "fieldload"
      );
      if (context?.pointer) {
        this.builder.CreateStore(load, context.pointer);
      }
      return load;
    } else if (node.lhs.resultantType instanceof GomListType) {
      const type = node.lhs.resultantType;
      const listType = this.mapGomTypeToLLVMType(type);
      const list = this.symbolTableReader.getIdentifier(idName);
      if (!list) {
        this.errorManager.throwCodegenError({
          loc: node.loc,
          message: "Unknown list: " + idName,
        });
      }
      if (!list.allocaInst) {
        this.errorManager.throwCodegenError({
          loc: node.loc,
          message: "List not allocated: " + idName,
        });
      }

      // built-in property access
      if (
        node.rhs instanceof NodeTerm &&
        GomListType.isBuiltInProperty(node.rhs.token.value)
      ) {
        if (node.rhs.token.value === GomListType.SIZE_PROPERTY) {
          const sizePtr = this.builder.CreateGEP(
            listType,
            list.allocaInst,
            [this.builder.getInt32(0), this.builder.getInt32(1)],
            "size_ptr"
          );
          const sizeValue = this.builder.CreateLoad(
            llvm.Type.getInt32Ty(this.context),
            sizePtr,
            "size_value"
          );
          if (context?.pointer) {
            this.builder.CreateStore(sizeValue, context.pointer);
          }
          return sizeValue;
        }
      } else {
        const indexValue = this.visitExpression(node.rhs);
        const elementType = this.mapGomTypeToLLVMType(type.elementType);
        const dataPtrPtr = this.builder.CreateInBoundsGEP(
          listType,
          list.allocaInst,
          [this.builder.getInt32(0), this.builder.getInt32(0)],
          "data_ptr_ptr"
        );
        const dataPtr = this.builder.CreateLoad(
          llvm.PointerType.get(elementType, 0),
          dataPtrPtr,
          "data_ptr"
        );

        const elementPtr = this.builder.CreateInBoundsGEP(
          elementType,
          dataPtr,
          [indexValue],
          "element_ptr"
        );
        const load = this.builder.CreateLoad(
          elementType,
          elementPtr,
          "element_load"
        );
        if (context?.pointer) {
          this.builder.CreateStore(load, context.pointer);
        }
        return load;
      }
    }

    return this.builder.getInt32(0);
  }

  visitBinaryOp(node: NodeBinaryOp, context?: ExpressionContext): llvm.Value {
    const pointer = context?.pointer;
    const op = node.op;
    const lhs = this.visitExpression(node.lhs);
    const rhs = this.visitExpression(node.rhs);

    let irOperation: llvm.Value | null = null;
    switch (op.type) {
      case GomToken.PLUS:
        irOperation = this.builder.CreateAdd(lhs, rhs, "addtmp");
        break;
      case GomToken.MINUS:
        irOperation = this.builder.CreateSub(lhs, rhs, "subtmp");
        break;
      case GomToken.MUL:
        irOperation = this.builder.CreateMul(lhs, rhs, "multmp");
        break;
      case GomToken.DIV:
        irOperation = this.builder.CreateSDiv(lhs, rhs, "divtmp");
        break;
      case GomToken.EQEQ:
        irOperation = this.builder.CreateICmpEQ(lhs, rhs, "eqtmp");
        break;
      case GomToken.LT:
        irOperation = this.builder.CreateICmpSLT(lhs, rhs, "lttmp");
        break;
      case GomToken.GT:
        irOperation = this.builder.CreateICmpSGT(lhs, rhs, "gttmp");
        break;
      case GomToken.LTE:
        irOperation = this.builder.CreateICmpSLE(lhs, rhs, "ltetmp");
        break;
      case GomToken.GTE:
        irOperation = this.builder.CreateICmpSGE(lhs, rhs, "gtetmp");
        break;
      default:
        throw new Error("Unknown operator: " + op.type);
    }

    if (pointer) {
      return this.builder.CreateStore(irOperation, pointer);
    } else {
      return irOperation;
    }
  }

  /**
   * Returns the size in bytes of the given LLVM type.
   */
  private sizeofBytes(type: llvm.Type): llvm.ConstantInt {
    return this.builder.getInt32(
      this.module.getDataLayout().getTypeAllocSize(type)
    );
  }

  private handleBuiltinFreeFunctions(
    fname: "push" | "pop",
    node: NodeCall,
    context?: ExpressionContext
  ): llvm.Value {
    const listArg = node.args[0];
    const listType = listArg.resultantType;
    if (!(listType instanceof GomListType)) {
      this.errorManager.throwCodegenError({
        loc: node.loc,
        message: `${fname} first argument must be a list`,
      });
    }

    // We require the first arg to be an identifier bound to an alloca
    if (!(listArg instanceof NodeTerm)) {
      this.errorManager.throwCodegenError({
        loc: node.loc,
        message: `${fname} expects the first argument to be a list variable`,
      });
    }
    const listName = listArg.token.value;
    const listSym = this.symbolTableReader.getIdentifier(listName);
    if (!listSym || !listSym.allocaInst) {
      this.errorManager.throwCodegenError({
        loc: node.loc,
        message: `List variable '${listName}' not allocated`,
      });
    }

    const listLLVMType = this.mapGomTypeToLLVMType(listType);
    const elemLLVMType = this.mapGomTypeToLLVMType(listType.elementType);

    // Field pointers: { dataPtr, size, capacity }
    const dataPtrPtr = this.builder.CreateInBoundsGEP(
      listLLVMType,
      listSym.allocaInst,
      [this.builder.getInt32(0), this.builder.getInt32(0)],
      "list.data.ptrptr"
    );
    const sizePtr = this.builder.CreateInBoundsGEP(
      listLLVMType,
      listSym.allocaInst,
      [this.builder.getInt32(0), this.builder.getInt32(1)],
      "list.size.ptr"
    );
    const capPtr = this.builder.CreateInBoundsGEP(
      listLLVMType,
      listSym.allocaInst,
      [this.builder.getInt32(0), this.builder.getInt32(2)],
      "list.cap.ptr"
    );

    if (fname === "push") {
      if (node.args.length !== 2) {
        this.errorManager.throwCodegenError({
          loc: node.loc,
          message: "push(list, value) expects exactly 2 arguments",
        });
      }

      // Load size and capacity
      const sizeVal = this.builder.CreateLoad(
        this.builder.getInt32Ty(),
        sizePtr,
        "list.size"
      );
      const capVal = this.builder.CreateLoad(
        this.builder.getInt32Ty(),
        capPtr,
        "list.cap"
      );

      // If cap == 0, set to initial; if size >= cap, grow cap *= 2
      const currFn = this.currentFunction!;
      const needInitBB = llvm.BasicBlock.Create(
        this.context,
        "list.needinit",
        currFn
      );
      const growthCheckBB = llvm.BasicBlock.Create(
        this.context,
        "list.growthcheck",
        currFn
      );
      const growBB = llvm.BasicBlock.Create(this.context, "list.grow", currFn);
      const contBB = llvm.BasicBlock.Create(this.context, "list.cont", currFn);

      const isZeroCap = this.builder.CreateICmpEQ(
        capVal,
        this.builder.getInt32(0),
        "cap.iszero"
      );
      this.builder.CreateCondBr(isZeroCap, needInitBB, growthCheckBB);

      // Initialize with LIST_INITIAL_CAPACITY
      this.builder.SetInsertPoint(needInitBB);
      const initCap = this.builder.getInt32(LIST_INITIAL_CAPACITY);
      const elemSize = this.sizeofBytes(elemLLVMType);
      const initBytes = this.builder.CreateMul(
        initCap,
        elemSize,
        "list.init.bytes"
      );

      const mallocFn = this.module.getFunction("malloc");
      if (!mallocFn) {
        this.errorManager.throwCodegenError({
          loc: node.loc,
          message: "malloc not available",
        });
      }
      const newDataI8 = this.builder.CreateCall(
        mallocFn,
        [initBytes],
        "list.init.malloc"
      );
      const newDataPtr = this.builder.CreateBitCast(
        newDataI8,
        llvm.PointerType.get(elemLLVMType, 0),
        "list.init.dataptr"
      );
      this.builder.CreateStore(newDataPtr, dataPtrPtr);
      this.builder.CreateStore(initCap, capPtr);
      this.builder.CreateBr(growthCheckBB);

      // Growth check: if size >= cap, grow => cap *= 2
      this.builder.SetInsertPoint(growthCheckBB);
      const sizeReload = this.builder.CreateLoad(
        this.builder.getInt32Ty(),
        sizePtr
      );
      const capReload = this.builder.CreateLoad(
        this.builder.getInt32Ty(),
        capPtr
      );
      const needGrow = this.builder.CreateICmpSGE(
        sizeReload,
        capReload,
        "list.needgrow"
      );
      this.builder.CreateCondBr(needGrow, growBB, contBB);

      // Grow with realloc
      this.builder.SetInsertPoint(growBB);
      const newCap = this.builder.CreateMul(
        capReload,
        this.builder.getInt32(2),
        "list.newcap"
      );
      const elemSize2 = this.sizeofBytes(elemLLVMType);
      const newBytes = this.builder.CreateMul(
        newCap,
        elemSize2,
        "list.newbytes"
      );

      const reallocFn = this.module.getFunction("realloc");
      if (!reallocFn) {
        this.errorManager.throwCodegenError({
          loc: node.loc,
          message: "realloc not available",
        });
      }
      const oldDataPtr = this.builder.CreateLoad(
        llvm.PointerType.get(elemLLVMType, 0),
        dataPtrPtr,
        "list.olddataptr"
      );
      const oldDataI8 = this.builder.CreateBitCast(
        oldDataPtr,
        this.builder.getInt8PtrTy(),
        "list.olddatai8"
      );
      const grownI8 = this.builder.CreateCall(
        reallocFn,
        [oldDataI8, newBytes],
        "list.realloc"
      );
      const grownPtr = this.builder.CreateBitCast(
        grownI8,
        llvm.PointerType.get(elemLLVMType, 0),
        "list.growndataptr"
      );
      this.builder.CreateStore(grownPtr, dataPtrPtr);
      this.builder.CreateStore(newCap, capPtr);
      this.builder.CreateBr(contBB);

      // cont: write value at index size; size++
      this.builder.SetInsertPoint(contBB);
      const dataPtr = this.builder.CreateLoad(
        llvm.PointerType.get(elemLLVMType, 0),
        dataPtrPtr,
        "list.dataptr"
      );

      // Evaluate value (arg1)
      let valueToPush = this.visitExpression(node.args[1]);
      if (valueToPush.getType().isPointerTy()) {
        valueToPush = this.builder.CreateLoad(
          elemLLVMType,
          valueToPush,
          "list.push.load"
        );
      }

      const elemPtr = this.builder.CreateInBoundsGEP(
        elemLLVMType,
        dataPtr,
        [sizeReload],
        "list.elem.ptr"
      );
      this.builder.CreateStore(valueToPush, elemPtr);

      const sizePlusOne = this.builder.CreateAdd(
        sizeReload,
        this.builder.getInt32(1)
      );
      this.builder.CreateStore(sizePlusOne, sizePtr);

      // Return dummy i32 (expressions are discarded in statement context)
      return this.builder.getInt32(0);
    }

    // pop(list) -> returns last element; size--
    if (fname === "pop") {
      if (node.args.length !== 1) {
        this.errorManager.throwCodegenError({
          loc: node.loc,
          message: "pop(list) expects exactly 1 argument",
        });
      }

      const sizeVal = this.builder.CreateLoad(
        this.builder.getInt32Ty(),
        sizePtr,
        "list.size"
      );
      const one = this.builder.getInt32(1);
      const newSize = this.builder.CreateSub(sizeVal, one, "list.newsize");
      this.builder.CreateStore(newSize, sizePtr);

      const dataPtr = this.builder.CreateLoad(
        llvm.PointerType.get(elemLLVMType, 0),
        dataPtrPtr,
        "list.dataptr"
      );
      const elemPtr = this.builder.CreateInBoundsGEP(
        elemLLVMType,
        dataPtr,
        [newSize],
        "list.elem.ptr"
      );
      const value = this.builder.CreateLoad(
        elemLLVMType,
        elemPtr,
        "list.pop.value"
      );
      if (context?.pointer) {
        this.builder.CreateStore(value, context.pointer);
      }
      return value;
    }

    this.errorManager.throwCodegenError({
      loc: node.loc,
      message: "Unknown function: " + fname,
    });
  }

  visitCall(node: NodeCall, context?: ExpressionContext): llvm.Value {
    // Built-in free functions: push(list, x), pop(list)
    if (node.id instanceof NodeTerm) {
      const fname = node.id.token.value;

      if ((fname === "push" || fname === "pop") && node.args.length >= 1) {
        return this.handleBuiltinFreeFunctions(fname, node, context);
      }
    }

    // ...fallback to existing call handling (user-defined functions, io.log, etc.)
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

  visitTerm(node: NodeTerm, context?: ExpressionContext): llvm.Value {
    const pointer = context?.pointer;
    const type = node.token.type;
    if (pointer) {
      if (type === GomToken.NUMLITERAL) {
        const value = parseInt(node.token.value);
        const intValue = this.builder.getInt32(value);
        this.builder.CreateStore(intValue, pointer);
        return intValue;
      } else if (type === GomToken.STRLITERAL) {
        const strPtr = this.getStringLiteralPointer(node);
        this.builder.CreateStore(strPtr, pointer);
        return strPtr;
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

        const loadInst = this.builder.CreateLoad(
          this.mapGomTypeToLLVMType(id.type as GomPrimitiveTypeOrAlias),
          id.allocaInst,
          id.name + ".load"
        );
        this.builder.CreateStore(loadInst, pointer);
        return loadInst;
      } else if (type === GomToken.TRUE) {
        const trueValue = this.builder.getInt1(true);
        this.builder.CreateStore(trueValue, pointer);
        return trueValue;
      } else if (type === GomToken.FALSE) {
        const falseValue = this.builder.getInt1(false);
        this.builder.CreateStore(falseValue, pointer);
        return falseValue;
      } else {
        throw new Error("Unknown term type: " + type);
      }
    } else {
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
}
