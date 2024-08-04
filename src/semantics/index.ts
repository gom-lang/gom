import {
  NodeBinaryOp,
  NodeCall,
  NodeExpr,
  NodeFunctionDefinition,
  NodeImportDeclaration,
  NodeLetStatement,
  NodeMainFunction,
  NodeProgram,
  NodeTerm,
  NodeTypeDefinition,
} from "../parser/rd/nodes";
import { Scope, ScopeManager } from "./scope";
import { SimpleVisitor } from "../parser/rd/visitor";
import { GomFunctionType, GomPrimitiveTypeOrAlias, GomType } from "./type";

export class SemanticAnalyzer extends SimpleVisitor<void> {
  scopeManager: ScopeManager;

  constructor(private ast: NodeProgram) {
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

  visitLetStatement(node: NodeLetStatement): void {
    node.decls.forEach((decl) => {
      if (decl.lhs instanceof NodeTerm) {
        const typeResolver = new TypeResolver(
          this.scopeManager.getCurrentScope()
        );
        const inferredType = typeResolver.resolveType(decl.rhs);
        if (!inferredType) {
          throw new TypeError("Could not infer type of expression");
        }
        this.scopeManager.putIdentifier(
          decl.lhs.token.value,
          decl.lhs,
          inferredType,
          decl.rhs
        );
      }
    });
  }

  visitTypeDefinition(node: NodeTypeDefinition): void {
    this.scopeManager.putType(node.name.value, node);
  }
}

class TypeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GomTypeError";
  }
}

class TypeResolver extends SimpleVisitor<void> {
  currentType: GomType | null = null;

  constructor(private scope: Scope) {
    super();
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
        throw new TypeError(
          `Type mismatch: ${lhsType.toStr()} and ${rhsType.toStr()} in binary operation`
        );
      }

      const testI8 = new GomPrimitiveTypeOrAlias("i8"),
        testBool = new GomPrimitiveTypeOrAlias("bool");

      if (
        (lhsType.isEqual(testI8) && !rhsType.isEqual(testI8)) ||
        (!lhsType.isEqual(testI8) && rhsType.isEqual(testI8)) ||
        (lhsType.isEqual(testBool) && !rhsType.isEqual(testBool)) ||
        (!lhsType.isEqual(testBool) && rhsType.isEqual(testBool))
      ) {
        throw new TypeError(
          `Type mismatch: ${lhsType} and ${rhsType} in binary operation`
        );
      }
    }

    this.currentType = lhsType;
  }

  visitCall(node: NodeCall): void {
    const fnName = (node.id as NodeTerm).token.value;
    const fn = this.scope.getFunction(fnName);
    console.log(fnName);
    if (fn && fn.node.gomType instanceof GomFunctionType) {
      const args = node.args.map((arg) => this.resolveType(arg));
      if (args.length !== fn.node.gomType.args.length) {
        throw new TypeError(
          `Argument count mismatch: expected ${
            fn.node.gomType.args.length
          }, got ${
            args.length
          } for function ${fnName} of type ${fn.node.gomType.toStr()}`
        );
      }

      console.log("args length", args.length);

      for (let i = 0; i < args.length; i++) {
        if (!args[i]?.isEqual(fn.node.gomType.args[i])) {
          throw new TypeError(
            `Type mismatch: expected ${fn.node.gomType.args[i]}, got ${
              args[i]
            } for argument ${i} of function ${fnName} of type ${fn.node.gomType.toStr()}`
          );
        }
      }

      console.log("args", args);

      this.currentType = fn.node.gomType.returnType;
    }

    throw new TypeError(`Function ${fnName} not found`);
  }

  visitTerm(node: NodeTerm): void {
    const type = node.gomType;

    if (type.typeString.startsWith("resolve_type@@")) {
      const idName = type.typeString.replace("resolve_type@@", "");
      const id = this.scope.getIdentifier(idName);
      if (id) {
        this.currentType = id.type;
      }

      throw new TypeError(`Identifier ${idName} not found`);
    } else {
      this.currentType = type;
    }
  }
}
