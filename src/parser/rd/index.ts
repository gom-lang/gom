import { Lexer, Token } from "../../lexer";
import { GomToken } from "../../lexer/tokens";
import { GomErrorManager } from "../../util/error";
import chalk from "chalk";
import {
  NodeAccess,
  NodeArgumentItem,
  NodeAssignment,
  NodeBinaryOp,
  NodeBreakStatement,
  NodeCall,
  NodeCollectionInit,
  NodeConstStatement,
  NodeContinueStatement,
  NodeExpr,
  NodeExprBracketed,
  NodeExpressionStatement,
  NodeForStatement,
  NodeFunctionDefinition,
  NodeFunctionReturnType,
  NodeGomType,
  NodeGomTypeComposite,
  NodeGomTypeId,
  NodeGomTypeList,
  NodeGomTypeStruct,
  NodeGomTypeStructField,
  NodeGomTypeTuple,
  NodeIfStatement,
  NodeImportDeclaration,
  NodeLetStatement,
  NodeMainFunction,
  NodeProgram,
  NodeReturnStatement,
  NodeStatement,
  NodeStructInit,
  NodeTerm,
  NodeTupleLiteral,
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

  match(type: GomToken) {
    if (this.token.type === type) {
      const matched = this.token;
      this.nextToken();
      return matched;
    } else {
      this.errorManager.throwSyntaxError({
        message: `Unexpected token: ${chalk.red(
          this.token.value
        )}, expected ${chalk.green(type)}`,
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

  peek(type: GomToken) {
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

  parseOneOrNone<T>(parseFn: () => T): T | undefined {
    try {
      return parseFn.call(this);
    } catch (e) {
      return;
    }
  }

  parseZeroOrMore<T>(parseFn: () => T): T[] {
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

  parseOneOrMore<T>(parseFn: () => T): T[] {
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
      exportStatements: [],
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
    const name = this.parseTerm();
    this.match(GomToken.EQ);
    const rhs = this.parseGomType(name);
    this.match(GomToken.SEMICOLON);

    return new NodeTypeDefinition({
      loc,
      name,
      rhs,
    });
  }

  parseGomType(typeName?: NodeTerm): NodeGomType {
    if (this.peek(GomToken.FN)) {
      // Function type
    } else if (this.peek(GomToken.LBRACE)) {
      this.buffer.push(this.lexer.nextToken(), this.lexer.nextToken());
      if (
        this.buffer[this.buffer.length - 1].type === GomToken.COLON &&
        typeName
      ) {
        return this.parseStructType(typeName);
      } else {
        return this.parseTupleType();
      }
    } else if (this.peek(GomToken.LBRACKET) && typeName) {
      // List type
      return this.parseListType(typeName);
    } else if (this.peek(GomToken.IDENTIFIER)) {
      this.buffer.push(this.lexer.nextToken());
      if (this.buffer[this.buffer.length - 1].type === GomToken.LT) {
        // composite type
        return this.parseCompositeType();
      } else {
        return this.parseTypeId();
      }
    } else if (this.peek(GomToken.BUILT_IN_TYPE)) {
      return this.parseTypeId();
    }

    throw new Error(`Unexpected token: ${this.token.value}`);
  }

  parseListType(typeName: NodeTerm): NodeGomType {
    const loc = this.token.start;
    this.match(GomToken.LBRACKET);
    const baseType = this.parseGomType();
    this.match(GomToken.RBRACKET);

    return new NodeGomTypeList({
      name: typeName,
      elementType: baseType,
      loc,
    });
  }

  parseCompositeType(): NodeGomTypeComposite {
    const baseType = this.parseTerm();
    this.match(GomToken.LT);
    const fields = this.parseOneOrMore(() => {
      const type = this.parseGomType(baseType);
      if (!this.peek(GomToken.GT)) {
        this.match(GomToken.COMMA);
      }
      return type;
    });
    this.match(GomToken.GT);

    return new NodeGomTypeComposite({
      id: baseType,
      fields,
      loc: baseType.token.start,
    });
  }

  parseTupleType(): NodeGomTypeTuple {
    const loc = this.token.start;
    this.match(GomToken.LBRACE);
    const fields = this.parseZeroOrMore(() => {
      const type = this.parseGomType();
      if (!this.peek(GomToken.RBRACE)) {
        this.match(GomToken.COMMA);
      }
      return type;
    });
    this.match(GomToken.RBRACE);

    return new NodeGomTypeTuple({ fields, loc });
  }

  parseStructType(typeName: NodeTerm) {
    const loc = this.token.start;
    this.match(GomToken.LBRACE);
    const fields = this.parseOneOrMore(this.parseStructTypeField);
    this.match(GomToken.RBRACE);

    return new NodeGomTypeStruct({ name: typeName, fields, loc });
  }

  parseStructTypeField() {
    const loc = this.token.start;
    const name = this.match(GomToken.IDENTIFIER);
    this.match(GomToken.COLON);
    const type = this.parseTypeId();
    if (!this.peek(GomToken.RBRACE)) {
      this.match(GomToken.COMMA);
    }

    return new NodeGomTypeStructField({ name, fieldType: type, loc });
  }

  parseTypeId() {
    const type = this.parseTerm() as NodeTerm;

    return new NodeGomTypeId({
      id: type,
      loc: type.token.start,
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
    const expectedType = this.parseTerm();
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
    const type = this.parseGomType();
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
      const initExpr = this.parseOneOrNone(() => {
        if (this.peek(GomToken.LET)) {
          const statement = this.parseStatement();
          if (statement instanceof NodeLetStatement) {
            return statement;
          } else {
            this.errorManager.throwSyntaxError({
              message: "Expected a let statement as for loop initializer",
              loc: statement.loc,
            });
          }
        } else {
          const expr = this.parseExpression();
          this.match(GomToken.SEMICOLON);
          return expr;
        }
      });
      const conditionExpr = this.parseOneOrNone(() => {
        const expr = this.parseExpression();
        this.match(GomToken.SEMICOLON);
        return expr;
      });
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
        loc,
      });
    } else if (this.accept(GomToken.BREAK)) {
      this.match(GomToken.SEMICOLON);
      return new NodeBreakStatement({ loc });
    } else if (this.accept(GomToken.CONTINUE)) {
      this.match(GomToken.SEMICOLON);
      return new NodeContinueStatement({ loc });
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
   * 6. Tuple/list literal
   * 7. Term
   */

  parseExpression(): NodeExpr {
    const loc = this.token.start;
    if (this.peek(GomToken.LPAREN)) {
      this.match(GomToken.LPAREN);
      const expr = this.parseExpression();
      this.match(GomToken.RPAREN);
      return new NodeExprBracketed({ expr, loc });
    } else if (this.peek(GomToken.LBRACE)) {
      return this.parseTupleLiteral();
    } else if (this.peek(GomToken.IDENTIFIER)) {
      this.buffer.push(this.lexer.nextToken());
      if (this.buffer[1].type === GomToken.EQ) {
        return this.parseAssignment();
      } else {
        return this.parseCollectionInit();
      }
    } else {
      return this.parseComparison();
    }
  }

  parseTupleLiteral(): NodeTupleLiteral {
    const loc = this.token.start;
    this.match(GomToken.LBRACE);
    const elements = this.parseZeroOrMore(() => {
      const expr = this.parseExpression();
      if (!this.peek(GomToken.RBRACE)) {
        this.match(GomToken.COMMA);
      }
      return expr;
    });
    this.match(GomToken.RBRACE);

    return new NodeTupleLiteral({ elements, loc });
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

  parseCollectionInit(): NodeExpr {
    if (this.buffer[1].type === GomToken.LBRACE) {
      const loc = this.token.start;
      const id = this.parseTerm();
      this.match(GomToken.LBRACE);
      // could be struct, tuple or list
      this.buffer.push(this.lexer.nextToken());
      console.log(this.buffer);
      // @ts-ignore
      if (this.buffer[1].type === GomToken.COLON) {
        const fields: [NodeTerm, NodeExpr][] = this.parseOneOrMore(() => {
          const name = this.parseTerm();
          this.match(GomToken.COLON);
          const value = this.parseExpression();
          if (!this.peek(GomToken.RBRACE)) this.match(GomToken.COMMA);
          return [name, value];
        });
        this.match(GomToken.RBRACE);
        return new NodeStructInit({ structTypeName: id, fields, loc });
      } else {
        // tuple or list
        const elements: NodeExpr[] = this.parseZeroOrMore(() => {
          const expr = this.parseExpression();
          if (!this.peek(GomToken.RBRACE)) this.match(GomToken.COMMA);
          return expr;
        });
        this.match(GomToken.RBRACE);
        return new NodeCollectionInit({
          collectionTypeName: id,
          elements,
          loc,
        });
      }
    }

    return this.parseComparison();
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
    while (
      this.peek(GomToken.LPAREN) ||
      this.peek(GomToken.DOT) ||
      this.peek(GomToken.LBRACKET)
    ) {
      if (this.accept(GomToken.DOT)) {
        const rhs = this.parseCall();
        lhs = new NodeAccess({ lhs: lhs as NodeTerm, rhs, loc });
      } else if (this.accept(GomToken.LBRACKET)) {
        const index = this.parseExpression();
        this.match(GomToken.RBRACKET);
        lhs = new NodeAccess({ lhs: lhs as NodeTerm, rhs: index, loc });
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
