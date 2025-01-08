import {
  NodeBinaryOp,
  NodeCall,
  NodeExpr,
  NodeForStatement,
  NodeFunctionDefinition,
  NodeIfStatement,
  NodeImportDeclaration,
  NodeLetStatement,
  NodeMainFunction,
  NodeProgram,
  NodeTerm,
  NodeTypeDefinition,
} from "../parser/rd/nodes";
import { ScopeManager, SymbolTableReader } from "./scope";
import { SimpleVisitor } from "../parser/rd/visitor";
import { GomFunctionType, GomPrimitiveTypeOrAlias, GomType } from "./type";
import { GomErrorManager } from "../util/error";
import { GomToken } from "../lexer/tokens";

export class SemanticAnalyzer extends SimpleVisitor<void> {
  scopeManager: ScopeManager;

  constructor(private ast: NodeProgram, private errorManager: GomErrorManager) {
    super();
    this.scopeManager = new ScopeManager();
  }

  analyze() {
    this.visit(this.ast);
  }

  visitProgram(node: NodeProgram): void {
    this.scopeManager.beginScope("global");
    this.visitChildren(node);
    this.scopeManager.endScope();
  }

  visitMainFunction(node: NodeMainFunction): void {
    this.scopeManager.beginScope("main");
    node.body.forEach((stmt) => this.visit(stmt));
    this.scopeManager.endScope();
  }

  visitImportDeclaration(node: NodeImportDeclaration): void {
    // Implement module resolution
  }

  visitFunctionDefinition(node: NodeFunctionDefinition): void {
    this.scopeManager.putIdentifier(node.name.value, node, node.gomType);
    this.scopeManager.beginScope(node.name.value);
    node.args.forEach((arg) => {
      this.scopeManager.putIdentifier(
        arg.name.token.value,
        arg.name,
        arg.gomType
      );
    });
    node.body.forEach((stmt) => this.visit(stmt));
    this.scopeManager.endScope();
  }

  visitForStatement(node: NodeForStatement): void {
    if (node.initExpr) this.visit(node.initExpr);
    if (node.conditionExpr) {
      this.visit(node.conditionExpr);
      const typeResolver = new TypeResolver(
        this.scopeManager,
        this.errorManager
      );
      const conditionType = typeResolver.resolveType(node.conditionExpr);
      if (!conditionType?.isEqual(new GomPrimitiveTypeOrAlias("bool"))) {
        this.errorManager.throwTypeError({
          message: `Expected boolean expression in for loop condition, got ${conditionType?.toStr()}`,
          loc: node.conditionExpr.loc,
        });
      }
    }

    if (node.updateExpr) this.visit(node.updateExpr);

    this.scopeManager.beginScope("for");
    node.body.forEach((stmt) => this.visit(stmt));
    this.scopeManager.endScope();
  }

  visitIfStatement(node: NodeIfStatement): void {
    this.visit(node.conditionExpr);
    const typeResolver = new TypeResolver(this.scopeManager, this.errorManager);
    const conditionType = typeResolver.resolveType(node.conditionExpr);
    if (!conditionType?.isEqual(new GomPrimitiveTypeOrAlias("bool"))) {
      this.errorManager.throwTypeError({
        message: `Expected boolean expression in if statement condition, got ${conditionType?.toStr()}`,
        loc: node.conditionExpr.loc,
      });
    }

    this.scopeManager.beginScope("if");
    node.body.forEach((stmt) => this.visit(stmt));
    this.scopeManager.endScope();
  }

  visitLetStatement(node: NodeLetStatement): void {
    node.decls.forEach((decl) => {
      if (decl.lhs instanceof NodeTerm) {
        const typeResolver = new TypeResolver(
          this.scopeManager,
          this.errorManager
        );
        const inferredType = typeResolver.resolveType(decl.rhs);
        if (!inferredType) {
          this.errorManager.throwTypeError({
            message: "Could not infer type of expression",
            loc: decl.rhs.loc,
          });
        }
        decl.lhs.resultantType = inferredType as GomPrimitiveTypeOrAlias;
        this.scopeManager.putIdentifier(
          decl.lhs.token.value,
          decl.lhs,
          inferredType,
          decl.rhs
        );
      }
    });
  }

  visitBinaryOp(node: NodeBinaryOp): void {
    const typeResolver = new TypeResolver(this.scopeManager, this.errorManager);
    typeResolver.resolveType(node);
  }

  visitCall(node: NodeCall): void {
    const typeResolver = new TypeResolver(this.scopeManager, this.errorManager);
    typeResolver.resolveType(node);
  }

  visitTypeDefinition(node: NodeTypeDefinition): void {
    this.scopeManager.putType(node.name.value, node);
  }
}

class TypeResolver extends SimpleVisitor<void> {
  currentType: GomType | null = null;
  symbolTableReader: SymbolTableReader;

  constructor(
    scopeManager: ScopeManager,
    private errorManager: GomErrorManager
  ) {
    super();
    this.symbolTableReader = new SymbolTableReader(
      scopeManager.getCurrentSymbolTableNode()
    );
  }

  resolveType(expr: NodeExpr): GomType | null {
    this.visit(expr);
    return this.currentType;
  }

  visitBinaryOp(node: NodeBinaryOp): void {
    this.visit(node.lhs);
    const lhsType = this.currentType;
    this.visit(node.rhs);
    const rhsType = this.currentType;

    if (lhsType && rhsType) {
      if (!lhsType.isEqual(rhsType)) {
        this.errorManager.throwTypeError({
          message: `Type mismatch: ${lhsType.toStr()} and ${rhsType.toStr()} in binary operation`,
          loc: node.loc,
        });
      }

      const testI8 = new GomPrimitiveTypeOrAlias("i8"),
        testBool = new GomPrimitiveTypeOrAlias("bool");

      if (
        (lhsType.isEqual(testI8) && !rhsType.isEqual(testI8)) ||
        (!lhsType.isEqual(testI8) && rhsType.isEqual(testI8)) ||
        (lhsType.isEqual(testBool) && !rhsType.isEqual(testBool)) ||
        (!lhsType.isEqual(testBool) && rhsType.isEqual(testBool))
      ) {
        this.errorManager.throwTypeError({
          message: `Type mismatch: ${lhsType} and ${rhsType} in binary operation`,
          loc: node.loc,
        });
      }
    }

    if (
      [GomToken.PLUS, GomToken.MINUS, GomToken.DIV, GomToken.MUL].includes(
        node.op.type
      )
    ) {
      this.currentType = lhsType;
      if (lhsType) {
        node.resultantType = this.currentType as GomPrimitiveTypeOrAlias;
      }
    } else if (
      [
        GomToken.EQEQ,
        // GomToken.NEQ,
        GomToken.LT,
        GomToken.LTE,
        GomToken.GT,
        GomToken.GTE,
      ].includes(
        node.op.type
        // || [GomToken.AND, GomToken.OR].includes(node.op.type)
      )
    ) {
      this.currentType = new GomPrimitiveTypeOrAlias("bool");
      node.resultantType = this.currentType as GomPrimitiveTypeOrAlias;
    }
  }

  visitCall(node: NodeCall): void {
    const fnName = (node.id as NodeTerm).token.value;
    const fn = this.symbolTableReader.getFunction(fnName);
    if (fn && fn.node.gomType instanceof GomFunctionType) {
      const args = node.args.map((arg) => this.resolveType(arg));
      if (args.length !== fn.node.gomType.args.length) {
        this.errorManager.throwTypeError({
          message: `Argument count mismatch: expected ${
            fn.node.gomType.args.length
          }, got ${
            args.length
          } for function ${fnName} of type ${fn.node.gomType.toStr()}`,
          loc: node.loc,
        });
      }

      for (let i = 0; i < args.length; i++) {
        if (!args[i]?.isEqual(fn.node.gomType.args[i])) {
          this.errorManager.throwTypeError({
            message: `Type mismatch: expected ${fn.node.gomType.args[i]}, got ${
              args[i]
            } for argument ${i} of function ${fnName} of type ${fn.node.gomType.toStr()}`,
            loc: node.loc,
          });
        }
      }

      node.resultantType = fn.node.gomType.returnType;
      this.currentType = fn.node.gomType.returnType;
    } else
      this.errorManager.throwTypeError({
        message: `Function ${fnName} not found`,
        loc: node.loc,
      });
  }

  visitTerm(node: NodeTerm): void {
    const type = node.gomType;

    if (type.typeString.startsWith("resolve_type@@")) {
      const idName = type.typeString.replace("resolve_type@@", "");
      const id = this.symbolTableReader.getIdentifier(idName);
      if (id && !id.isFunction()) {
        node.resultantType = id.type as GomPrimitiveTypeOrAlias;
        this.currentType = id.type;
      } else {
        this.errorManager.throwTypeError({
          message: `Identifier ${idName} not found`,
          loc: node.loc,
        });
      }
    } else {
      node.resultantType = type;
      this.currentType = type;
    }
  }
}
