import {
  NodeAccess,
  NodeArgumentItem,
  NodeAssignment,
  NodeCall,
  NodeComparison,
  NodeExpo,
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
  NodeQuot,
  NodeReturnStatement,
  NodeSum,
  NodeTerm,
  NodeTypeDefinition,
} from "./nodes";
import { Node, NodeType } from "./tree";

export interface Visitor<StateType> {
  state: StateType;

  visit(node: Node): void;
  visitProgram(node: NodeProgram): void;
  visitImportDeclaration(node: NodeImportDeclaration): void;
  visitTypeDefinition(node: NodeTypeDefinition): void;
  visitFunctionDefinition(node: NodeFunctionDefinition): void;
  visitMainFunction(node: NodeMainFunction): void;
  visitArgumentItem(node: NodeArgumentItem): void;
  visitFunctionReturnType(node: NodeFunctionReturnType): void;
  visitExprBracketed(node: NodeExprBracketed): void;
  visitAccess(node: NodeAccess): void;
  visitCall(node: NodeCall): void;
  visitAssignment(node: NodeAssignment): void;
  visitComparison(node: NodeComparison): void;
  visitSum(node: NodeSum): void;
  visitQuot(node: NodeQuot): void;
  visitExpo(node: NodeExpo): void;
  visitIfStatement(node: NodeIfStatement): void;
  visitForStatement(node: NodeForStatement): void;
  visitReturnStatement(node: NodeReturnStatement): void;
  visitLetStatement(node: NodeLetStatement): void;
  visitExpressionStatement(
    node: NodeExpressionStatement,
    state: StateType
  ): void;
  visitTerm(node: NodeTerm): void;
}

export class SimpleVisitor<T> implements Visitor<T> {
  state: T;

  constructor(state: T) {
    this.state = state;
  }

  visit(node: Node) {
    switch (node.type) {
      case NodeType.PROGRAM:
        this.visitProgram(node as NodeProgram);
        return;
      case NodeType.IMPORT_DECLARATION:
        this.visitImportDeclaration(node as NodeImportDeclaration);
        return;
      case NodeType.TYPE_DEFINITION:
        this.visitTypeDefinition(node as NodeTypeDefinition);
        return;
      case NodeType.FUNCTION_DEFINITION:
        this.visitFunctionDefinition(node as NodeFunctionDefinition);
        return;
      case NodeType.MAIN_FUNCTION:
        this.visitMainFunction(node as NodeMainFunction);
        return;
      case NodeType.ARGUMENT_ITEM:
        this.visitArgumentItem(node as NodeArgumentItem);
        return;
      case NodeType.FUNCTION_RETURN_TYPE:
        this.visitFunctionReturnType(node as NodeFunctionReturnType);
        return;
      case NodeType.EXPR_BRACKETED:
        this.visitExprBracketed(node as NodeExprBracketed);
        return;
      case NodeType.CALL:
        this.visitCall(node as NodeCall);
        return;
      case NodeType.ACCESS:
        this.visitAccess(node as NodeAccess);
        return;
      case NodeType.ASSIGNMENT:
        this.visitAssignment(node as NodeAssignment);
        return;
      case NodeType.COMPARISON:
        this.visitComparison(node as NodeComparison);
        return;
      case NodeType.SUM:
        this.visitSum(node as NodeSum);
        return;
      case NodeType.QUOT:
        this.visitQuot(node as NodeQuot);
        return;
      case NodeType.EXPO:
        this.visitExpo(node as NodeExpo);
        return;
      case NodeType.CALL_TAIL:
      case NodeType.ACCESS_TAIL:
      case NodeType.ASSIGNMENT_TAIL:
      case NodeType.COMPARISON_TAIL:
      case NodeType.SUM_TAIL:
      case NodeType.QUOT_TAIL:
      case NodeType.EXPO_TAIL:
        this.visitChildren(node);
        return;
      case NodeType.IF_STATEMENT:
        this.visitIfStatement(node as NodeIfStatement);
        return;
      case NodeType.FOR_STATEMENT:
        this.visitForStatement(node as NodeForStatement);
        return;
      case NodeType.RETURN_STATEMENT:
        this.visitReturnStatement(node as NodeReturnStatement);
        return;
      case NodeType.LET_STATEMENT:
        this.visitLetStatement(node as NodeLetStatement);
        return;
      case NodeType.EXPRESSION_STATEMENT:
        this.visitExpressionStatement(node as NodeExpressionStatement);
        return;
      case NodeType.TERM:
        this.visitTerm(node as NodeTerm);
        return;
      default:
        return;
    }
  }

  visitChildren(node: Node) {
    node.children.map((child) => this.visit(child));
  }

  visitProgram(node: NodeProgram) {
    this.visitChildren(node);
  }
  visitImportDeclaration(node: NodeImportDeclaration) {
    this.visitChildren(node);
  }
  visitTypeDefinition(node: NodeTypeDefinition) {
    this.visitChildren(node);
  }
  visitFunctionDefinition(node: NodeFunctionDefinition) {
    this.visitChildren(node);
  }
  visitMainFunction(node: NodeMainFunction) {
    this.visitChildren(node);
  }
  visitArgumentItem(node: NodeArgumentItem) {
    this.visitChildren(node);
  }
  visitFunctionReturnType(node: NodeFunctionReturnType) {
    this.visitChildren(node);
  }
  visitExprBracketed(node: NodeExprBracketed) {
    this.visitChildren(node);
  }
  visitCall(node: NodeCall) {
    this.visitChildren(node);
  }
  visitAccess(node: NodeAccess) {
    this.visitChildren(node);
  }
  visitAssignment(node: NodeAssignment) {
    this.visitChildren(node);
  }
  visitComparison(node: NodeComparison) {
    this.visitChildren(node);
  }
  visitSum(node: NodeSum) {
    this.visitChildren(node);
  }
  visitQuot(node: NodeQuot) {
    this.visitChildren(node);
  }
  visitExpo(node: NodeExpo) {
    this.visitChildren(node);
  }
  visitIfStatement(node: NodeIfStatement) {
    this.visitChildren(node);
  }
  visitForStatement(node: NodeForStatement) {
    this.visitChildren(node);
  }
  visitReturnStatement(node: NodeReturnStatement) {
    this.visitChildren(node);
  }
  visitLetStatement(node: NodeLetStatement) {
    this.visitChildren(node);
  }
  visitExpressionStatement(node: NodeExpressionStatement) {
    this.visitChildren(node);
  }
  visitTerm(node: NodeTerm) {
    this.visitChildren(node);
  }
}
