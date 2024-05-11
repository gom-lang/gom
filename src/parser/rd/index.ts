import { Lexer, Token } from "../../lexer";
import { GomToken } from "../../lexer/tokens";

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
    this.parseProgram();
  }

  private match(type: GomToken) {
    console.log("Matching: ", type, this.token.value);
    if (this.token.type === type) {
      console.log("Matched: ", type);
      this.nextToken();
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
      console.log("Accepted: ", type, this.token.value);
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

  private parseOneOrNone<T>(parseFn: () => T) {
    try {
      parseFn.call(this);
    } catch (e) {
      return;
    }
  }

  private parseZeroOrMore<T>(parseFn: () => T) {
    while (1) {
      try {
        parseFn.call(this);
      } catch (e) {
        return;
      }
    }
  }

  private parseOneOrMore<T>(parseFn: () => T) {
    parseFn.call(this);
    this.parseZeroOrMore(parseFn);
  }

  parseProgram() {
    this.parseZeroOrMore(this.parseImportDeclaration);
    this.parseZeroOrMore(this.parseTypeOrFunctionDefinition);
    this.parseMainFunction();
  }

  parseImportDeclaration() {
    this.match(GomToken.IMPORT);
    this.match(GomToken.IDENTIFIER);
    this.match(GomToken.SEMICOLON);
  }

  parseTypeOrFunctionDefinition() {
    if (this.peek(GomToken.TYPE)) {
      this.parseTypeDefinition();
    } else if (this.peek(GomToken.FN)) {
      this.parseFunctionDefinition();
    } else {
      throw new SyntaxError(`Unexpected token: ${this.token.value}`);
    }
  }

  parseTypeDefinition() {
    this.match(GomToken.TYPE);
    this.match(GomToken.IDENTIFIER);
    this.match(GomToken.EQ);
    this.match(GomToken.BUILT_IN_TYPE);
    this.match(GomToken.SEMICOLON);
  }

  parseFunctionDefinition() {
    this.match(GomToken.FN);
    this.match(GomToken.IDENTIFIER);
    this.match(GomToken.LPAREN);
    this.parseZeroOrMore(this.parseArgumentItem);
    this.match(GomToken.RPAREN);
    this.parseOneOrNone(this.parseFunctionReturnType);
    this.match(GomToken.LBRACE);
    this.parseOneOrMore(this.parseStatement);
    this.match(GomToken.RBRACE);
  }

  parseArgumentItem() {
    this.match(GomToken.IDENTIFIER);
    this.match(GomToken.COLON);
    this.match(GomToken.BUILT_IN_TYPE); // can be custom type
    this.matchOneOrNone(GomToken.COMMA);
  }

  parseFunctionReturnType() {
    this.match(GomToken.COLON);
    this.match(GomToken.BUILT_IN_TYPE); // can be custom type
  }

  parseMainFunction() {
    this.match(GomToken.MAIN);
    this.match(GomToken.LPAREN);
    this.parseZeroOrMore(this.parseArgumentItem);
    this.match(GomToken.RPAREN);
    this.match(GomToken.LBRACE);
    this.parseOneOrMore(this.parseStatement);
    this.match(GomToken.RBRACE);
  }

  parseStatement() {
    if (this.accept(GomToken.LET)) {
      this.match(GomToken.IDENTIFIER);
      this.match(GomToken.EQ);
      this.parseExpression();
      this.match(GomToken.SEMICOLON);
    } else if (this.accept(GomToken.RETURN)) {
      this.parseExpression();
      this.match(GomToken.SEMICOLON);
    } else if (this.accept(GomToken.IF)) {
      this.parseExpression();
      this.parseStatement();
      if (this.accept(GomToken.ELSE)) {
        this.parseStatement();
      }
    } else if (this.accept(GomToken.FOR)) {
      this.match(GomToken.IDENTIFIER);
      this.match(GomToken.COLON);
      this.parseExpression();
      this.match(GomToken.LBRACE);
      this.parseOneOrMore(this.parseStatement);
      this.match(GomToken.RBRACE);
    } else {
      this.parseExpression();
      this.match(GomToken.SEMICOLON);
    }
  }

  parseExpression() {
    if (
      this.accept(GomToken.IDENTIFIER) ||
      this.accept(GomToken.NUMLITERAL) ||
      this.accept(GomToken.STRLITERAL)
    ) {
      this.parseOneOrNone(this.parseExprTermTail);
    } else if (this.accept(GomToken.LPAREN)) {
      this.parseExpression();
      this.match(GomToken.RPAREN);
    } else {
      throw new SyntaxError(`Unexpected token: ${this.token.value}`);
    }
  }

  parseExprTermTail() {
    if (this.peek(GomToken.DOT)) {
      this.parseAccessTail();
    } else if (this.peek(GomToken.LPAREN)) {
      this.parseCallTail();
    } else {
      this.parseOpTail();
    }
  }

  parseAccessTail() {
    this.match(GomToken.DOT);
    this.match(GomToken.IDENTIFIER);
    this.parseOneOrNone(this.parseExprTermTail);
  }

  parseCallTail() {
    this.match(GomToken.LPAREN);
    if (!this.peek(GomToken.RPAREN)) {
      this.parseExpression();
      this.parseZeroOrMore(() => {
        this.match(GomToken.COMMA);
        this.parseExpression();
      });
    }
    this.match(GomToken.RPAREN);
  }

  parseOpTail() {
    if (
      this.accept(GomToken.LT) ||
      this.accept(GomToken.GT) ||
      this.accept(GomToken.LTE) ||
      this.accept(GomToken.GTE) ||
      this.accept(GomToken.EQEQ) ||
      this.accept(GomToken.PLUS) ||
      this.accept(GomToken.MINUS) ||
      this.accept(GomToken.MUL) ||
      this.accept(GomToken.DIV) ||
      this.accept(GomToken.EXP)
    ) {
      this.parseExpression();
    }
  }

  parseTerm() {
    if (
      this.accept(GomToken.IDENTIFIER) ||
      this.accept(GomToken.NUMLITERAL) ||
      this.accept(GomToken.STRLITERAL)
    ) {
      return;
    } else {
      throw new SyntaxError(`Unexpected token: ${this.token.value}`);
    }
  }
}
