import { Token } from "../../lexer";
import { Visitor } from "./visitor";

export interface Node {
  type: NodeType;
  parent?: Node;
  children: Node[];
  token?: Token;
}

export abstract class AbstractNode implements Node {
  type: NodeType;
  parent?: Node;
  children: Node[];
  token?: Token;

  constructor() {
    this.type = NodeType.PROGRAM;
    this.children = [];
  }

  accept<T>(visitor: Visitor<T>): void {
    visitor.visit(this);
  }
}

export enum NodeType {
  PROGRAM,
  IMPORT_DECLARATION,
  TYPE_DEFINITION,
  FUNCTION_DEFINITION,
  MAIN_FUNCTION,
  IF_STATEMENT,
  FOR_STATEMENT,
  RETURN_STATEMENT,
  LET_STATEMENT,
  CONST_STATEMENT,
  EXPRESSION_STATEMENT,
  GOM_TYPE,
  ARGUMENT_ITEM,
  FUNCTION_RETURN_TYPE,
  EXPR_BASIC,
  EXPR_BRACKETED,
  ASSIGNMENT,
  ACCESS,
  CALL,
  COMPARISON,
  SUM,
  QUOT,
  EXPO,
  TERM,
  TERMINAL,
}
