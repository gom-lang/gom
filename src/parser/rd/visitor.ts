import {
  NodeAccess,
  NodeArgumentItem,
  NodeAssignment,
  NodeBinaryOp,
  NodeCall,
  NodeExprBracketed,
  NodeExpressionStatement,
  NodeForStatement,
  NodeFunctionDefinition,
  NodeFunctionReturnType,
  NodeGomTypeStructField,
  NodeIfStatement,
  NodeImportDeclaration,
  NodeLetStatement,
  NodeMainFunction,
  NodeProgram,
  NodeReturnStatement,
  NodeStructInit,
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
  visitBinaryOp(node: NodeBinaryOp): void;
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
      case NodeType.STRUCT_INIT:
        this.visitStructInit(node as NodeStructInit);
        return;
      case NodeType.GOM_TYPE_STRUCT_FIELD:
        this.visitStructField(node as NodeGomTypeStructField);
        return;
      case NodeType.COMPARISON:
      case NodeType.SUM:
      case NodeType.QUOT:
      case NodeType.EXPO:
        this.visitBinaryOp(node as NodeBinaryOp);
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
  visitStructInit(node: NodeStructInit) {
    this.visitChildren(node);
  }
  visitStructField(node: NodeGomTypeStructField) {
    this.visitChildren(node);
  }
  visitBinaryOp(node: NodeBinaryOp) {
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
