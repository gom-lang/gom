import { Token } from "../../lexer";
import { Visitor } from "./visitor";

export interface Node {
  type: NodeType;
  loc: number;
  parent?: Node;
  children: Node[];
  token?: Token;
}

let globalNodeIdCounter = 0;

export abstract class AbstractNode implements Node {
  readonly _id: number;
  type: NodeType;
  loc: number;
  parent?: Node;
  children: Node[];
  token?: Token;

  constructor() {
    this._id = globalNodeIdCounter++;
    this.type = NodeType.PROGRAM;
    this.loc = 0;
    this.children = [];
  }

  accept<T>(visitor: Visitor<T>): void {
    visitor.visit(this);
  }
}

export enum NodeType {
  PROGRAM = "PROGRAM",
  IMPORT_DECLARATION = "IMPORT_DECLARATION",
  TYPE_DEFINITION = "TYPE_DEFINITION",
  FUNCTION_DEFINITION = "FUNCTION_DEFINITION",
  MAIN_FUNCTION = "MAIN_FUNCTION",
  EXPORT_STATEMENT = "EXPORT_STATEMENT",
  IF_STATEMENT = "IF_STATEMENT",
  FOR_STATEMENT = "FOR_STATEMENT",
  RETURN_STATEMENT = "RETURN_STATEMENT",
  LET_STATEMENT = "LET_STATEMENT",
  CONST_STATEMENT = "CONST_STATEMENT",
  EXPRESSION_STATEMENT = "EXPRESSION_STATEMENT",
  GOM_TYPE_ID = "GOM_TYPE_ID",
  GOM_TYPE_TUPLE = "GOM_TYPE_TUPLE",
  GOM_TYPE_STRUCT = "GOM_TYPE_STRUCT",
  GOM_TYPE_STRUCT_FIELD = "GOM_TYPE_STRUCT_FIELD",
  GOM_TYPE_LIST = "GOM_TYPE_LIST",
  GOM_TYPE_COMPOSITE = "GOM_TYPE_COMPOSITE",
  ARGUMENT_ITEM = "ARGUMENT_ITEM",
  FUNCTION_RETURN_TYPE = "FUNCTION_RETURN_TYPE",
  EXPR_BASIC = "EXPR_BASIC",
  EXPR_BRACKETED = "EXPR_BRACKETED",
  ASSIGNMENT = "ASSIGNMENT",
  STRUCT_INIT = "STRUCT_INIT",
  COLLECTION_INIT = "COLLECTION_INIT",
  ACCESS = "ACCESS",
  CALL = "CALL",
  COMPARISON = "COMPARISON",
  SUM = "SUM",
  QUOT = "QUOT",
  EXPO = "EXPO",
  TUPLE_LITERAL = "TUPLE_LITERAL",
  INDEXED_ACCESS = "INDEXED_ACCESS",
  LIST_LITERAL = "LIST_LITERAL",
  TERM = "TERM",
  TERMINAL = "TERMINAL",
}
