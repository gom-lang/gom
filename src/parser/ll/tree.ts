import { Token } from "../../lexer";

export enum NodeType {
  PROGRAM,
  IMPORT_DECLARATION,
  TYPE_DEFINITION,
  FUNCTION_DECLARATION,
  MAIN_FUNCTION,
  STATEMENT,
  FOR_STATEMENT,
  RETURN_STATEMENT,
  LET_STATEMENT,
  EXPRESSION_STATEMENT,
  GOM_TYPE,
  ARGUMENT_ITEM,
  FUNCTION_RETURN_TYPE,
  EXPR,
  ACCESS,
  CALL,
  COMPARISON,
  SUM,
  QUOT,
  TERM,
  TERMINAL,
}

export class Node {
  type: NodeType;
  children: Node[];
  token?: Token;

  constructor(type: NodeType, children: Node[] = [], token?: Token) {
    this.type = type;
    this.children = children;
    this.token = token;
  }
}
