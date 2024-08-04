import { writeFileSync } from "fs";
import {
  NodeBinaryOp,
  NodeFunctionDefinition,
  NodeLetStatement,
  NodeMainFunction,
  NodeProgram,
} from "../parser/rd/nodes";
import { SimpleVisitor } from "../parser/rd/visitor";
import { ScopeManager, SymbolTableReader } from "../semantics/scope";
import { GomPrimitiveTypeOrAlias } from "../semantics/type";

/**
 * Generates LLVM IR
 */
export class CodeGenerator extends SimpleVisitor<void> {
  private programText: string = "";
  private symbolTableReader: SymbolTableReader;

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

  private writeLine(line: string): void {
    this.programText += line + "\n";
  }

  private writeGlobalVariables(): void {
    const globalVariables = this.symbolTableReader
      .getAllIdentifiers()
      .filter((id) => !id.isFunction());

    globalVariables.forEach((id) => {
      const type = id.type;
      if (type instanceof GomPrimitiveTypeOrAlias) {
        switch (type.typeString) {
          case "i8":
            this.writeLine(`@${id.name} = global i8 0`);
            break;
        }
      }
    });
  }

  generate(): void {
    this.symbolTableReader.enterScope("global");
    this.writeGlobalVariables();
    this.visit(this.ast);
    this.symbolTableReader.exitScope();
    writeFileSync(this.outputPath, this.programText);
  }

  visitFunctionDefinition(node: NodeFunctionDefinition): void {
    this.symbolTableReader.enterScope(node.name.value);
    const returnType = node.gomType.returnType;
    const llvmReturnType =
      returnType instanceof GomPrimitiveTypeOrAlias
        ? returnType.typeString
        : "void";
    const args = node.gomType.args.map((arg) => {
      return arg instanceof GomPrimitiveTypeOrAlias ? arg.typeString : "";
    });
    this.writeLine(
      `define ${llvmReturnType} @${node.name.value}(${args
        .map((arg, i) => `${arg} %${node.args[i].name.token.value}`)
        .join(", ")}) {`
    );
    this.visitChildren(node);
    this.writeLine("}");
    this.symbolTableReader.exitScope();
  }

  visitMainFunction(node: NodeMainFunction): void {
    this.symbolTableReader.enterScope("main");
    this.writeLine("define void @main() {");
    this.visitChildren(node);
    this.writeLine("}");
    this.symbolTableReader.exitScope();
  }

  visitLetStatement(node: NodeLetStatement): void {
    node.decls.forEach((decl) => {});
  }

  visitBinaryOp(node: NodeBinaryOp): void {}
}
