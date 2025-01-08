import llvm, { LLVMContext } from "llvm-bindings";
import { writeFileSync } from "fs";
import {
  NodeAccess,
  NodeAssignment,
  NodeBinaryOp,
  NodeCall,
  NodeExpr,
  NodeExprBracketed,
  NodeFunctionDefinition,
  NodeLetStatement,
  NodeMainFunction,
  NodeProgram,
  NodeReturnStatement,
  NodeTerm,
} from "../parser/rd/nodes";
import { SimpleVisitor } from "../parser/rd/visitor";
import { ScopeManager, SymbolTableReader } from "../semantics/scope";
import {
  GomFunctionType,
  GomPrimitiveTypeOrAlias,
  GomType,
} from "../semantics/type";
import { GomToken } from "../lexer/tokens";
import { IRScopeManager } from "./scope";

export enum LLVMType {
  I8 = "i8",
  FLOAT = "float",
  VOID = "void",
}

/**
 * Generates LLVM IR - todo to use llvm bindings
 */
export class CodeGenerator extends SimpleVisitor<void> {
  private symbolTableReader: SymbolTableReader;
  private irScopeManager: IRScopeManager = new IRScopeManager();

  private context: LLVMContext = new llvm.LLVMContext();
  private module: llvm.Module = new llvm.Module("entry", this.context);
  private builder: llvm.IRBuilder = new llvm.IRBuilder(this.context);

  constructor(
    private ast: NodeProgram,
    scopeManager: ScopeManager,
    private outputPath: string = "out.ll"
  ) {
    super();
    this.symbolTableReader = new SymbolTableReader(
      scopeManager.getCurrentSymbolTableNode()
    );
  }

  private writeGlobalVariables(): void {
    const globalVariables = this.symbolTableReader
      .getAllIdentifiers()
      .filter((id) => !id.isFunction());

    globalVariables.forEach((id) => {
      const type = id.type;
      if (type instanceof GomPrimitiveTypeOrAlias) {
      }
    });
  }

  private mapGomTypeToLLVMType(type: GomPrimitiveTypeOrAlias): llvm.Type {
    switch (type.typeString) {
      case "i8":
        return this.builder.getInt8Ty();
      case "f32":
        return this.builder.getFloatTy();
      default:
        throw new Error("Unknown type");
    }
  }

  private getExpressionLLVMType(node: NodeExpr): llvm.Type {
    let type: GomType | null = null;
    if (node instanceof NodeTerm) {
      type = node.resultantType;
    } else if (node instanceof NodeCall) {
      type = node.resultantType;
    } else if (node instanceof NodeBinaryOp) {
      type = node.resultantType;
    } else if (node instanceof NodeAccess) {
      type = node.resultantType;
    } else if (node instanceof NodeExprBracketed) {
      return this.getExpressionLLVMType(node.expr);
    }

    if (type === null) {
      throw new Error("Unknown expression type");
    }

    return this.mapGomTypeToLLVMType(type as GomPrimitiveTypeOrAlias);
  }

  generate(): void {
    this.symbolTableReader.enterScope("global");
    this.writeGlobalVariables();
    this.visit(this.ast);
    this.symbolTableReader.exitScope();
    writeFileSync(this.outputPath, this.module.print());
  }

  visitFunctionDefinition(node: NodeFunctionDefinition): void {
    this.symbolTableReader.enterScope(node.name.value);
    this.irScopeManager.enterScope(node.name.value);
    const returnType = this.mapGomTypeToLLVMType(
      node.gomType.returnType as GomPrimitiveTypeOrAlias
    );
    const argsType = node.gomType.args.map((arg) =>
      this.mapGomTypeToLLVMType(arg as GomPrimitiveTypeOrAlias)
    );

    const funcType = llvm.FunctionType.get(returnType, argsType, false);
    llvm.Function.Create(
      funcType,
      llvm.Function.LinkageTypes.ExternalLinkage,
      node.name.value,
      this.module
    );

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

    node.body.forEach((stmt) => this.visit(stmt));

    this.irScopeManager.exitScope();
    this.symbolTableReader.exitScope();
  }

  visitLetStatement(node: NodeLetStatement): void {
    node.decls.forEach((decl) => {
      const type = this.mapGomTypeToLLVMType(
        decl.resultantType as GomPrimitiveTypeOrAlias
      );
      const value = this.getExpressionLLVMType(decl.rhs);
    });
  }
}
