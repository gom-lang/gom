import { Lexer, Token } from "../../lexer";
import { GomToken } from "../../lexer/tokens";
import { GomErrorManager } from "../../util/error";
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
  NodeGomTypeIdOrArray,
  NodeGomTypeStruct,
  NodeGomTypeStructField,
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
  errorManager: GomErrorManager;

  constructor(lexer: Lexer) {
    this.lexer = lexer;
    this.buffer = [this.lexer.nextToken()];
    this.errorManager = this.lexer.errorManager;
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
      this.errorManager.throwSyntaxError({
        message: `Unexpected token: ${this.token.value}`,
        loc: this.token.start,
      });
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
    const typeGlobalOrFunctionDefinitions = this.parseZeroOrMore(
      this.parseTypeGlobalOrFunctionDefinition
    );
    const mainFunction = this.parseMainFunction();

    return new NodeProgram({
      importDeclarations,
      typeDefinitions: typeGlobalOrFunctionDefinitions.filter(
        (def): def is NodeTypeDefinition =>
          def.type === NodeType.TYPE_DEFINITION
      ),
      globalVariables: typeGlobalOrFunctionDefinitions.filter(
        (def): def is NodeLetStatement => def.type === NodeType.LET_STATEMENT
      ),
      functionDeclarations: typeGlobalOrFunctionDefinitions.filter(
        (def): def is NodeFunctionDefinition =>
          def.type === NodeType.FUNCTION_DEFINITION
      ),
      mainFunction,
    });
  }

  parseImportDeclaration() {
    const loc = this.token.start;
    this.match(GomToken.IMPORT);
    const id = this.match(GomToken.IDENTIFIER);
    this.match(GomToken.SEMICOLON);
    return new NodeImportDeclaration({ path: id, loc });
  }

  parseTypeGlobalOrFunctionDefinition() {
    if (this.peek(GomToken.TYPE)) {
      return this.parseTypeDefinition();
    } else if (this.peek(GomToken.FN)) {
      return this.parseFunctionDefinition();
    } else if (this.peek(GomToken.LET)) {
      return this.parseStatement();
    } else {
      this.errorManager.throwSyntaxError({
        message: `Unexpected token: ${this.token.value}`,
        loc: this.token.start,
      });
    }
  }

  parseTypeDefinition() {
    const loc = this.token.start;
    this.match(GomToken.TYPE);
    const name = this.match(GomToken.IDENTIFIER);
    this.match(GomToken.EQ);
    const rhs = this.parseGomType();
    this.match(GomToken.SEMICOLON);

    return new NodeTypeDefinition({
      loc,
      name,
      rhs,
    });
  }

  parseGomType() {
    if (this.peek(GomToken.STRUCT)) {
      return this.parseStructType();
    } else if (
      this.peek(GomToken.IDENTIFIER) ||
      this.peek(GomToken.BUILT_IN_TYPE)
    ) {
      return this.parseTypeIdOrArray();
    }

    throw new Error(`Unexpected token: ${this.token.value}`);
  }

  parseStructType() {
    const loc = this.token.start;
    this.match(GomToken.STRUCT);
    this.match(GomToken.LBRACE);
    const fields = this.parseOneOrMore(this.parseStructTypeField);
    this.match(GomToken.RBRACE);

    return new NodeGomTypeStruct({ fields, loc });
  }

  parseStructTypeField() {
    const loc = this.token.start;
    const name = this.match(GomToken.IDENTIFIER);
    this.match(GomToken.COLON);
    const type = this.parseTypeIdOrArray();
    if (!this.peek(GomToken.RBRACE)) {
      this.match(GomToken.COMMA);
    }

    return new NodeGomTypeStructField({ name, fieldType: type, loc });
  }

  parseTypeIdOrArray() {
    const baseType = this.parseTerm() as NodeTerm;

    if (this.accept(GomToken.LBRACKET)) {
      const size = this.match(GomToken.NUMLITERAL);
      this.match(GomToken.RBRACKET);
      return new NodeGomTypeIdOrArray({
        id: baseType.token,
        arrSize: size,
        loc: baseType.token.start,
      });
    }

    return new NodeGomTypeIdOrArray({
      id: baseType.token,
      loc: baseType.token.start,
    });
  }

  parseFunctionDefinition() {
    const loc = this.token.start;
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
      loc,
    });
  }

  parseArgumentItem() {
    const loc = this.token.start;
    const name = this.parseTerm() as NodeTerm;
    this.match(GomToken.COLON);
    const expectedType = this.match(GomToken.BUILT_IN_TYPE); // can be custom type
    this.matchOneOrNone(GomToken.COMMA);

    return new NodeArgumentItem({
      name,
      expectedType,
      loc,
    });
  }

  parseFunctionReturnType() {
    const loc = this.token.start;
    this.match(GomToken.COLON);
    const type = this.match(GomToken.BUILT_IN_TYPE); // can be custom type

    return new NodeFunctionReturnType({ returnType: type, loc });
  }

  parseMainFunction() {
    const loc = this.token.start;
    this.match(GomToken.MAIN);
    this.match(GomToken.LPAREN);
    this.parseZeroOrMore(this.parseArgumentItem);
    this.match(GomToken.RPAREN);
    this.match(GomToken.LBRACE);
    const body = this.parseOneOrMore(this.parseStatement);
    this.match(GomToken.RBRACE);

    return new NodeMainFunction({ body, loc });
  }

  parseStatement(): NodeStatement {
    const loc = this.token.start;
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
        loc,
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
        loc,
      });
    } else if (this.accept(GomToken.RETURN)) {
      const expr = this.parseExpression();
      this.match(GomToken.SEMICOLON);

      return new NodeReturnStatement({ expr, loc });
    } else if (this.accept(GomToken.IF)) {
      const conditionExpr = this.parseExpression();
      this.match(GomToken.LBRACE);
      const body = this.parseOneOrMore(this.parseStatement);
      this.match(GomToken.RBRACE);
      let elseBody;
      if (this.accept(GomToken.ELSE)) {
        this.match(GomToken.LBRACE);
        elseBody = this.parseOneOrMore(this.parseStatement);
        this.match(GomToken.RBRACE);
      }

      return new NodeIfStatement({
        conditionExpr,
        body,
        elseBody,
        loc,
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
        loc,
      });
    }
    if (this.accept(GomToken.IF)) {
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
        loc,
      });
    } else {
      const expr = this.parseExpression();
      this.match(GomToken.SEMICOLON);

      return new NodeExpressionStatement({ expr, loc });
    }
  }

  /**
   * Expression precedence (reverse order):
   * 0. Bracketed expression, Assignment (same as expression)
   * 1. Comparison operators
   * 2. Sum
   * 3. Quot
   * 4. Expo
   * 5. Call
   * 6. Term
   */

  parseExpression(): NodeExpr {
    const loc = this.token.start;
    if (this.peek(GomToken.LPAREN)) {
      this.match(GomToken.LPAREN);
      const expr = this.parseExpression();
      this.match(GomToken.RPAREN);
      return new NodeExprBracketed({ expr, loc });
    } else if (this.peek(GomToken.IDENTIFIER)) {
      this.buffer.push(this.lexer.nextToken());
      if (this.buffer[1].type === GomToken.EQ) {
        return this.parseAssignment();
      } else {
        return this.parseComparison();
      }
    } else {
      return this.parseComparison();
    }
  }

  parseAssignment(): NodeAssignment {
    const loc = this.token.start;
    const lhs = this.parseTerm() as NodeTerm;
    this.match(GomToken.EQ);
    const rhs = this.parseExpression();

    return new NodeAssignment({ lhs, rhs, loc });
  }

  parseAccess(): NodeAccess {
    const loc = this.token.start;
    const lhs = this.parseTerm() as NodeTerm;
    this.match(GomToken.DOT);
    const rhs = this.parseComparison();

    return new NodeAccess({ lhs, rhs, loc });
  }

  parseComparison(): NodeExpr {
    const loc = this.token.start;
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
        loc,
      });
    }

    return lhs;
  }

  parseSum(): NodeExpr {
    const loc = this.token.start;
    let lhs = this.parseQuot();
    while (this.peek(GomToken.PLUS) || this.peek(GomToken.MINUS)) {
      const op = this.match(this.token.type);
      const rhs = this.parseQuot();
      lhs = new NodeBinaryOp({
        type: NodeType.SUM,
        op,
        lhs,
        rhs,
        loc,
      });
    }

    return lhs;
  }

  parseQuot(): NodeExpr {
    const loc = this.token.start;
    let lhs = this.parseExpo();
    while (this.peek(GomToken.MUL) || this.peek(GomToken.DIV)) {
      const op = this.match(this.token.type);
      const rhs = this.parseExpo();
      lhs = new NodeBinaryOp({
        type: NodeType.QUOT,
        op,
        lhs,
        rhs,
        loc,
      });
    }

    return lhs;
  }

  parseExpo(): NodeExpr {
    const loc = this.token.start;
    let lhs = this.parseCall();
    if (this.peek(GomToken.EXPO)) {
      const op = this.match(GomToken.EXPO);
      const rhs = this.parseCall();
      lhs = new NodeBinaryOp({
        type: NodeType.EXPO,
        op,
        lhs,
        rhs,
        loc,
      });
    }

    return lhs;
  }

  parseCall(): NodeExpr {
    const loc = this.token.start;
    let lhs: NodeExpr = this.parseTerm();
    while (this.peek(GomToken.LPAREN) || this.peek(GomToken.DOT)) {
      if (this.accept(GomToken.DOT)) {
        const rhs = this.parseCall();
        lhs = new NodeAccess({ lhs: lhs as NodeTerm, rhs, loc });
      } else if (this.accept(GomToken.LPAREN)) {
        const args = this.parseZeroOrMore(() => {
          const arg = this.parseExpression();
          this.matchOneOrNone(GomToken.COMMA);
          return arg;
        });
        this.match(GomToken.RPAREN);
        lhs = new NodeCall({ id: lhs, args, loc });
      }
    }

    return lhs;
  }

  parseTerm(): NodeTerm {
    if (this.peek(GomToken.TRUE) || this.peek(GomToken.FALSE)) {
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
    } else if (this.peek(GomToken.BUILT_IN_TYPE)) {
      const token = this.match(GomToken.BUILT_IN_TYPE);
      return new NodeTerm(token);
    } else {
      this.errorManager.throwSyntaxError({
        message: `Unexpected token: ${this.token.value}`,
        loc: this.token.start,
      });
    }
  }
}
