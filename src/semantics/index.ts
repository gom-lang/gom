import {
  NodeImportDeclaration,
  NodeProgram,
  NodeTerm,
  NodeTypeDefinition,
} from "../parser/rd/nodes";
import { ScopeManager } from "./scope";
import { SimpleVisitor } from "../parser/rd/visitor";

export class SemanticAnalyzer extends SimpleVisitor<void> {
  scopeManager: ScopeManager;
  clonedAST: NodeProgram;

  constructor(ast: NodeProgram) {
    super();
    this.scopeManager = new ScopeManager();
    this.clonedAST = structuredClone(ast);
  }

  analyze() {
    this.visit(this.clonedAST);
  }

  visitProgram(node: NodeProgram): void {
    this.scopeManager.beginScope();
    this.visitChildren(node);
    this.scopeManager.endScope();
  }

  visitImportDeclaration(node: NodeImportDeclaration): void {
    // Implement module resolution
  }

  visitTypeDefinition(node: NodeTypeDefinition): void {
    this.scopeManager.putType(node.name.value, node);
  }

  visitTerm(node: NodeTerm): void {
    const type = node.gomType;
    console.log(`Term: ${node.token.value} has type ${type.typeString}`);
  }
}
