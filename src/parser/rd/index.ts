import { Lexer, Token } from "../../lexer";
import { GomToken } from "../../lexer/tokens";
import {
  NodeAccess,
  NodeAccessTail,
  NodeArgumentItem,
  NodeAssignment,
  NodeAssignmentTail,
  NodeCall,
  NodeCallTail,
  NodeComparison,
  NodeComparisonTail,
  NodeExpo,
  NodeExpoTail,
  NodeExpr,
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
  NodeQuot,
  NodeQuotTail,
  NodeReturnStatement,
  NodeStatement,
  NodeSum,
  NodeSumTail,
  NodeTerm,
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
      if (!exprTermTail) {
        return term;
      }

      if (exprTermTail instanceof NodeAccessTail) {
        return new NodeAccess(term, exprTermTail);
      } else if (exprTermTail instanceof NodeCallTail) {
        return new NodeCall(term, exprTermTail);
      } else if (exprTermTail instanceof NodeAssignmentTail) {
        return new NodeAssignment(term, exprTermTail);
      } else if (exprTermTail instanceof NodeComparisonTail) {
        return new NodeComparison({
          lhs: term,
          tail: exprTermTail,
        });
      } else if (exprTermTail instanceof NodeSumTail) {
        return new NodeSum({
          lhs: term,
          tail: exprTermTail,
        });
      } else if (exprTermTail instanceof NodeQuotTail) {
        return new NodeQuot({
          lhs: term,
          tail: exprTermTail,
        });
      } else if (exprTermTail instanceof NodeExpoTail) {
        return new NodeExpo({
          base: term,
          tail: exprTermTail,
        });
      } else {
        throw new SyntaxError(`Unexpected token: ${this.token.value}`);
      }
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
    const expr = this.parseExpression();
    const exprTermTail = this.parseOneOrNone(this.parseExprTermTail);

    return new NodeAccessTail({
      rhs: expr,
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
      this.peek(GomToken.LT) ||
      this.peek(GomToken.GT) ||
      this.peek(GomToken.LTE) ||
      this.peek(GomToken.GTE) ||
      this.peek(GomToken.EQEQ)
    ) {
      let op: Token;
      if (this.peek(GomToken.LT)) {
        op = this.match(GomToken.LT);
      } else if (this.peek(GomToken.GT)) {
        op = this.match(GomToken.GT);
      } else if (this.peek(GomToken.LTE)) {
        op = this.match(GomToken.LTE);
      } else if (this.peek(GomToken.GTE)) {
        op = this.match(GomToken.GTE);
      } else {
        op = this.match(GomToken.EQEQ);
      }
      const expr = this.parseExpression();
      return new NodeComparisonTail({
        op,
        rhs: expr,
      });
    } else if (this.peek(GomToken.PLUS) || this.peek(GomToken.MINUS)) {
      const op = this.peek(GomToken.PLUS)
        ? this.match(GomToken.PLUS)
        : this.match(GomToken.MINUS);
      const expr = this.parseExpression();
      return new NodeSumTail({
        op,
        rhs: expr,
      });
    } else if (this.peek(GomToken.MUL) || this.peek(GomToken.DIV)) {
      const op = this.peek(GomToken.MUL)
        ? this.match(GomToken.MUL)
        : this.match(GomToken.DIV);
      const expr = this.parseExpression();
      return new NodeQuotTail({
        op,
        rhs: expr,
      });
    } else if (this.peek(GomToken.EXPO)) {
      const op = this.match(GomToken.EXPO);
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
      const token = this.match(GomToken.IDENTIFIER);
      return new NodeTerm(token);
    } else if (this.peek(GomToken.NUMLITERAL)) {
      const token = this.match(GomToken.NUMLITERAL);
      return new NodeTerm(token);
    } else if (this.peek(GomToken.STRLITERAL)) {
      const token = this.match(GomToken.STRLITERAL);
      return new NodeTerm(token);
    } else {
      throw new SyntaxError(`Unexpected token: ${this.token.value}`);
    }
  }
}
