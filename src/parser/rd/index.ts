import { Lexer, Token } from "../../lexer";
import { GomToken } from "../../lexer/tokens";
import {
  NodeAccess,
  NodeArgumentItem,
  NodeAssignment,
  NodeBinaryOp,
  NodeCall,
  NodeConstStatement,
  NodeExpr,
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
  NodeReturnStatement,
  NodeStatement,
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
      const decls = this.parseOneOrMore(() => {
        const assignment = this.parseAssignment();
        if (!this.peek(GomToken.SEMICOLON)) {
          this.match(GomToken.COMMA);
        }
        return assignment;
      }) as NodeAssignment[];
      this.match(GomToken.SEMICOLON);

      return new NodeLetStatement({
        decls,
      });
    } else if (this.accept(GomToken.CONST)) {
      const decls = this.parseOneOrMore(() => {
        const assignment = this.parseAssignment();
        if (!this.peek(GomToken.SEMICOLON)) {
          this.match(GomToken.COMMA);
        }
        return assignment;
      }) as NodeAssignment[];
      this.match(GomToken.SEMICOLON);

      return new NodeConstStatement({
        decls,
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
    return this.parseAssignment();
  }

  parseAssignment(): NodeExpr {
    const lhs = this.parseComparison();
    if (this.accept(GomToken.EQ)) {
      const rhs = this.parseAssignment();
      return new NodeAssignment(lhs, rhs);
    }

    return lhs;
  }

  parseComparison(): NodeExpr {
    let lhs = this.parseSum();
    while (
      this.peek(GomToken.GT) ||
      this.peek(GomToken.LT) ||
      this.peek(GomToken.GTE) ||
      this.peek(GomToken.LTE) ||
      this.peek(GomToken.EQEQ)
    ) {
      const op = this.match(this.token.type);
      const rhs = this.parseSum();
      lhs = new NodeBinaryOp({
        type: NodeType.COMPARISON,
        op,
        lhs,
        rhs,
      });
    }

    return lhs;
  }

  parseSum(): NodeExpr {
    let lhs = this.parseQuot();
    while (this.peek(GomToken.PLUS) || this.peek(GomToken.MINUS)) {
      const op = this.match(this.token.type);
      const rhs = this.parseQuot();
      lhs = new NodeBinaryOp({
        type: NodeType.SUM,
        op,
        lhs,
        rhs,
      });
    }

    return lhs;
  }

  parseQuot(): NodeExpr {
    let lhs = this.parseExpo();
    while (this.peek(GomToken.MUL) || this.peek(GomToken.DIV)) {
      const op = this.match(this.token.type);
      const rhs = this.parseExpo();
      lhs = new NodeBinaryOp({
        type: NodeType.QUOT,
        op,
        lhs,
        rhs,
      });
    }

    return lhs;
  }

  parseExpo(): NodeExpr {
    let lhs = this.parseCall();
    if (this.peek(GomToken.EXPO)) {
      const op = this.match(GomToken.EXPO);
      const rhs = this.parseCall();
      lhs = new NodeBinaryOp({
        type: NodeType.EXPO,
        op,
        lhs,
        rhs,
      });
    }

    return lhs;
  }

  parseCall(): NodeExpr {
    let lhs = this.parseTerm();
    while (this.peek(GomToken.LPAREN) || this.peek(GomToken.DOT)) {
      if (this.accept(GomToken.DOT)) {
        const rhs = this.parseCall();
        lhs = new NodeAccess(lhs, rhs);
      } else if (this.accept(GomToken.LPAREN)) {
        const args = this.parseZeroOrMore(() => {
          const arg = this.parseExpression();
          this.matchOneOrNone(GomToken.COMMA);
          return arg;
        });
        this.match(GomToken.RPAREN);
        lhs = new NodeCall(lhs, args);
      }
    }

    return lhs;
  }

  parseTerm(): NodeExpr {
    if (this.peek(GomToken.LPAREN)) {
      this.match(GomToken.LPAREN);
      const expr = this.parseExpression();
      this.match(GomToken.RPAREN);
      return new NodeExprBracketed(expr);
    } else if (this.peek(GomToken.TRUE) || this.peek(GomToken.FALSE)) {
      const token = this.match(this.token.type);
      return new NodeTerm(token);
    } else if (this.peek(GomToken.IDENTIFIER)) {
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
