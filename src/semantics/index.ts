import {
  NodeAccessTail,
  NodeArgumentItem,
  NodeAssignmentTail,
  NodeCallTail,
  NodeComparisonTail,
  NodeExpoTail,
  NodeExprBasic,
  NodeExprBracketed,
  NodeExpressionStatement,
  NodeForStatement,
  NodeFunctionDefinition,
  NodeFunctionReturnType,
  NodeIfStatement,
  NodeImportDeclaration,
  NodeLetStatement,
  NodeMainFunction,
  NodeProgram,
  NodeQuotTail,
  NodeReturnStatement,
  NodeSumTail,
  NodeTerm,
  NodeTypeDefinition,
} from "../parser/rd/nodes";
import { ScopeManager } from "./scope";
import { SimpleVisitor } from "../parser/rd/visitor";

class SemanticAnalyzer extends SimpleVisitor<void> {
  scopeManager: ScopeManager;

  constructor() {
    super();
    this.scopeManager = new ScopeManager();
  }

  visitProgram(node: NodeProgram): void {
    this.scopeManager.beginScope();
    node.importDeclarations.forEach((importDeclaration) =>
      this.visitImportDeclaration(importDeclaration)
    );
    node.typeDefinitions.forEach((typeDefinition) =>
      this.visitTypeDefinition(typeDefinition)
    );
    node.functionDeclarations.forEach((functionDeclaration) =>
      this.visitFunctionDefinition(functionDeclaration)
    );
    this.visitMainFunction(node.mainFunction);
    this.scopeManager.endScope();
  }

  visitImportDeclaration(node: NodeImportDeclaration): void {
    // Implement module resolution
  }

  visitTypeDefinition(node: NodeTypeDefinition): void {
    this.scopeManager.put(node.name.value, node);
  }

  visitFunctionDefinition(node: NodeFunctionDefinition): void {
    this.scopeManager.put(node.name.value, node);
  }

  visitMainFunction(node: NodeMainFunction): void {
    node.body.forEach((statement) => this.visit(statement));
  }

  visitArgumentItem(node: NodeArgumentItem): void {}

  visitFunctionReturnType(node: NodeFunctionReturnType): void {}

  visitExprBasic(node: NodeExprBasic): void {}

  visitExprBracketed(node: NodeExprBracketed): void {
    this.visit(node.expr);
  }

  visitCallTail(node: NodeCallTail): void {}

  visitAccessTail(node: NodeAccessTail): void {}

  visitAssignmentTail(node: NodeAssignmentTail): void {}

  visitComparisonTail(node: NodeComparisonTail): void {}

  visitSumTail(node: NodeSumTail): void {}

  visitQuotTail(node: NodeQuotTail): void {}

  visitExpoTail(node: NodeExpoTail): void {}

  visitIfStatement(node: NodeIfStatement): void {}

  visitForStatement(node: NodeForStatement): void {}

  visitReturnStatement(node: NodeReturnStatement): void {
    this.visit(node.expr);
  }

  visitLetStatement(node: NodeLetStatement): void {}

  visitExpressionStatement(node: NodeExpressionStatement): void {}

  visitTerm(node: NodeTerm): void {}
}
