import { Lexer, Token } from "../../lexer";
import { GomToken } from "../../lexer/tokens";
import {
  NodeAccessTail,
  NodeArgumentItem,
  NodeAssignmentTail,
  NodeCallTail,
  NodeComparisonTail,
  NodeExpoTail,
  NodeExpr,
  NodeExprBasic,
  NodeExprBracketed,
  NodeExprTermTail,
  NodeExpressionStatement,
  NodeForStatement,
  NodeFunctionDefinition,
  NodeFunctionReturnType,
  NodeIfStatement,
  NodeImportDeclaration,
  NodeLetStatement,
  NodeMainFunction,
  NodeOpTail,
  NodeProgram,
  NodeQuotTail,
  NodeReturnStatement,
  NodeStatement,
  NodeSumTail,
  NodeTypeDefinition,
} from "./nodes";
import { NodeType } from "./tree";

export class RecursiveDescentParser {
  lexer: Lexer;
  buffer: Token[];

  constructor(lexer: Lexer) {
    this.lexer = lexer;
    this.buffer = [this.lexer.nextToken()];
  }

  get token() {
    return this.buffer[0];
  }

  parse() {
    return this.parseProgram();
  }

  private match(type: GomToken) {
    if (this.token.type === type) {
      const matched = this.token;
      this.nextToken();
      return matched;
    } else {
      throw new Error(`Unexpected token: ${this.token.value}`);
    }
  }

  private matchOneOrNone(type: GomToken) {
    if (this.token.type === type) {
      this.nextToken();
    }
  }

  private matchZeroOrMore(type: GomToken) {
    while (this.token.type === type) {
      this.nextToken();
    }
  }

  private matchOneOrMore(type: GomToken) {
    if (this.token.type === type) {
      this.nextToken();
    } else {
      throw new Error(`Unexpected token: ${this.token.value}`);
    }
    this.matchZeroOrMore(type);
  }

  private peek(type: GomToken) {
    return this.token.type === type;
  }

  private accept(type: GomToken) {
    if (this.token.type === type) {
      this.nextToken();
      return true;
    }
    return false;
  }

  private nextToken() {
    this.buffer.shift();
    if (this.buffer.length === 0) {
      this.buffer.push(this.lexer.nextToken());
    }
  }

  private parseOneOrNone<T>(parseFn: () => T): T | undefined {
    try {
      return parseFn.call(this);
    } catch (e) {
      return;
    }
  }

  private parseZeroOrMore<T>(parseFn: () => T): T[] {
    let nodes: T[] = [];
    while (1) {
      try {
        nodes.push(parseFn.call(this));
      } catch (e) {
        return nodes;
      }
    }

    return nodes;
  }

  private parseOneOrMore<T>(parseFn: () => T): T[] {
    const nodes: T[] = [];
    nodes.push(parseFn.call(this));
    nodes.push(...this.parseZeroOrMore(parseFn));
    return nodes;
  }

  parseProgram() {
    const importDeclarations = this.parseZeroOrMore(
      this.parseImportDeclaration
    );
    const typeOrFunctionDefinitions = this.parseZeroOrMore(
      this.parseTypeOrFunctionDefinition
    );
    const mainFunction = this.parseMainFunction();

    return new NodeProgram({
      importDeclarations,
      typeDefinitions: typeOrFunctionDefinitions.filter(
        (def): def is NodeTypeDefinition =>
          def.type === NodeType.TYPE_DEFINITION
      ),
      functionDeclarations: typeOrFunctionDefinitions.filter(
        (def): def is NodeFunctionDefinition =>
          def.type === NodeType.FUNCTION_DEFINITION
      ),
      mainFunction,
    });
  }

  parseImportDeclaration() {
    this.match(GomToken.IMPORT);
    const id = this.match(GomToken.IDENTIFIER);
    this.match(GomToken.SEMICOLON);
    return new NodeImportDeclaration(id);
  }

  parseTypeOrFunctionDefinition() {
    if (this.peek(GomToken.TYPE)) {
      return this.parseTypeDefinition();
    } else if (this.peek(GomToken.FN)) {
      return this.parseFunctionDefinition();
    } else {
      throw new SyntaxError(`Unexpected token: ${this.token.value}`);
    }
  }

  parseTypeDefinition() {
    this.match(GomToken.TYPE);
    const name = this.match(GomToken.IDENTIFIER);
    this.match(GomToken.EQ);
    const rhs = this.match(GomToken.BUILT_IN_TYPE);
    this.match(GomToken.SEMICOLON);

    return new NodeTypeDefinition({
      name,
      rhs,
    });
  }

  parseFunctionDefinition() {
    this.match(GomToken.FN);
    const name = this.match(GomToken.IDENTIFIER);
    this.match(GomToken.LPAREN);
    const args = this.parseZeroOrMore(this.parseArgumentItem);
    this.match(GomToken.RPAREN);
    const returnType = this.parseOneOrNone(this.parseFunctionReturnType);
    this.match(GomToken.LBRACE);
    const body = this.parseOneOrMore(this.parseStatement);
    this.match(GomToken.RBRACE);

    return new NodeFunctionDefinition({
      name,
      args,
      returnType,
      body,
    });
  }

  parseArgumentItem() {
    const name = this.match(GomToken.IDENTIFIER);
    this.match(GomToken.COLON);
    const expectedType = this.match(GomToken.BUILT_IN_TYPE); // can be custom type
    this.matchOneOrNone(GomToken.COMMA);

    return new NodeArgumentItem({
      name,
      expectedType,
    });
  }

  parseFunctionReturnType() {
    this.match(GomToken.COLON);
    const type = this.match(GomToken.BUILT_IN_TYPE); // can be custom type

    return new NodeFunctionReturnType(type);
  }

  parseMainFunction() {
    this.match(GomToken.MAIN);
    this.match(GomToken.LPAREN);
    this.parseZeroOrMore(this.parseArgumentItem);
    this.match(GomToken.RPAREN);
    this.match(GomToken.LBRACE);
    const body = this.parseOneOrMore(this.parseStatement);
    this.match(GomToken.RBRACE);

    return new NodeMainFunction(body);
  }

  parseStatement(): NodeStatement {
    if (this.accept(GomToken.LET)) {
      const name = this.match(GomToken.IDENTIFIER);
      this.match(GomToken.EQ);
      const expr = this.parseExpression();
      this.match(GomToken.SEMICOLON);

      return new NodeLetStatement({
        name,
        rhs: expr,
      });
    } else if (this.accept(GomToken.RETURN)) {
      const expr = this.parseExpression();
      this.match(GomToken.SEMICOLON);

      return new NodeReturnStatement(expr);
    } else if (this.accept(GomToken.IF)) {
      const conditionExpr = this.parseExpression();
      const body = this.parseOneOrMore(this.parseStatement);
      let elseBody;
      if (this.accept(GomToken.ELSE)) {
        elseBody = this.parseOneOrMore(this.parseStatement);
      }

      return new NodeIfStatement({
        conditionExpr,
        body,
        elseBody,
      });
    } else if (this.accept(GomToken.FOR)) {
      this.match(GomToken.LPAREN);
      const initExpr = this.parseOneOrNone(this.parseExpression);
      this.match(GomToken.SEMICOLON);
      const conditionExpr = this.parseOneOrNone(this.parseExpression);
      this.match(GomToken.SEMICOLON);
      const updateExpr = this.parseOneOrNone(this.parseExpression);
      this.match(GomToken.RPAREN);
      this.match(GomToken.LBRACE);
      const body = this.parseOneOrMore(this.parseStatement);
      this.match(GomToken.RBRACE);

      return new NodeForStatement({
        initExpr,
        conditionExpr,
        updateExpr,
        body,
      });
    } else {
      const expr = this.parseExpression();
      this.match(GomToken.SEMICOLON);

      return new NodeExpressionStatement(expr);
    }
  }

  parseExpression(): NodeExpr {
    if (
      this.peek(GomToken.IDENTIFIER) ||
      this.peek(GomToken.NUMLITERAL) ||
      this.peek(GomToken.STRLITERAL)
    ) {
      const term = this.parseTerm();
      const exprTermTail = this.parseOneOrNone(this.parseExprTermTail);

      return new NodeExprBasic({
        term,
        exprTermTail,
      });
    } else if (this.accept(GomToken.LPAREN)) {
      const expr = this.parseExpression();
      this.match(GomToken.RPAREN);

      return new NodeExprBracketed(expr);
    } else {
      throw new SyntaxError(`Unexpected token: ${this.token.value}`);
    }
  }

  parseExprTermTail(): NodeExprTermTail {
    if (this.peek(GomToken.DOT)) {
      return this.parseAccessTail();
    } else if (this.peek(GomToken.LPAREN)) {
      return this.parseCallTail();
    } else {
      return this.parseOpTail();
    }
  }

  parseAccessTail() {
    this.match(GomToken.DOT);
    const id = this.match(GomToken.IDENTIFIER);
    const exprTermTail = this.parseOneOrNone(this.parseExprTermTail);

    return new NodeAccessTail({
      id,
      tail: exprTermTail,
    });
  }

  parseCallTail() {
    const args: NodeExpr[] = [];
    this.match(GomToken.LPAREN);
    if (!this.peek(GomToken.RPAREN)) {
      args.push(this.parseExpression());
      this.parseZeroOrMore(() => {
        this.match(GomToken.COMMA);
        args.push(this.parseExpression());
      });
    }
    this.match(GomToken.RPAREN);
    const tail = this.parseOneOrNone(this.parseExprTermTail);

    return new NodeCallTail({
      args,
      tail,
    });
  }

  parseOpTail(): NodeOpTail {
    if (this.accept(GomToken.EQ)) {
      const expr = this.parseExpression();
      return new NodeAssignmentTail(expr);
    } else if (
      this.accept(GomToken.LT) ||
      this.accept(GomToken.GT) ||
      this.accept(GomToken.LTE) ||
      this.accept(GomToken.GTE) ||
      this.accept(GomToken.EQEQ)
    ) {
      const op = this.token;
      const expr = this.parseExpression();
      return new NodeComparisonTail({
        op,
        rhs: expr,
      });
    } else if (this.accept(GomToken.PLUS) || this.accept(GomToken.MINUS)) {
      const op = this.token;
      const expr = this.parseExpression();
      return new NodeSumTail({
        op,
        rhs: expr,
      });
    } else if (this.accept(GomToken.MUL) || this.accept(GomToken.DIV)) {
      const op = this.token;
      const expr = this.parseExpression();
      return new NodeQuotTail({
        op,
        rhs: expr,
      });
    } else if (this.accept(GomToken.EXPO)) {
      const op = this.token;
      const expr = this.parseExpression();
      return new NodeExpoTail({
        op,
        rhs: expr,
      });
    } else {
      throw new SyntaxError(`Unexpected token: ${this.token.value}`);
    }
  }

  parseTerm() {
    if (this.peek(GomToken.IDENTIFIER)) {
      return this.match(GomToken.IDENTIFIER);
    } else if (this.peek(GomToken.NUMLITERAL)) {
      return this.match(GomToken.NUMLITERAL);
    } else if (this.peek(GomToken.STRLITERAL)) {
      return this.match(GomToken.STRLITERAL);
    } else {
      throw new SyntaxError(`Unexpected token: ${this.token.value}`);
    }
  }
}
