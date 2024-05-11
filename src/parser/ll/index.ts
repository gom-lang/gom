import { Lexer } from "../../lexer";
import { Node, NodeType } from "./tree";

export class LLParser {
  lexer: Lexer;
  nLookahead: number = 1;
  rootNode: Node;

  constructor(lexer: Lexer) {
    this.lexer = lexer;
    this.rootNode = new Node(NodeType.PROGRAM);
  }
}
