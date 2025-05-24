import {
  NodeAccess,
  NodeBinaryOp,
  NodeCall,
  NodeExpr,
  NodeForStatement,
  NodeFunctionDefinition,
  NodeGomTypeComposite,
  NodeGomTypeId,
  NodeGomTypeStruct,
  NodeGomTypeStructField,
  NodeIfStatement,
  NodeImportDeclaration,
  NodeLetStatement,
  NodeMainFunction,
  NodeProgram,
  NodeReturnStatement,
  NodeStructInit,
  NodeTerm,
  NodeTupleLiteral,
  NodeTypeDefinition,
} from "../parser/rd/nodes";
import { ScopeManager, SymbolTableReader } from "./scope";
import { SimpleVisitor } from "../parser/rd/visitor";
import {
  GomFunctionType,
  GomPrimitiveTypeOrAlias,
  GomStructType,
  GomTupleType,
  GomType,
} from "./type";
import { GomErrorManager } from "../util/error";
import { GomToken } from "../lexer/tokens";
import { GomModule } from "../parser/rd/modules";

export class SemanticAnalyzer extends SimpleVisitor<void> {
  scopeManager: ScopeManager;
  private currentFunctionDefinition: NodeFunctionDefinition | null = null;

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
    const module = new GomModule({ name: node.path.value }, this.errorManager);
    const semanticAnalyzer = new SemanticAnalyzer(
      module.parsed,
      this.errorManager
    );
    semanticAnalyzer.analyze();

    module.getAllExports().forEach((exp) => {
      if (exp instanceof NodeFunctionDefinition) {
        this.scopeManager.putIdentifier(exp.name.value, exp, exp.resultantType);
      } else if (exp instanceof NodeTypeDefinition) {
        this.scopeManager.putType(exp.name.token.value, exp);
      } else if (exp instanceof NodeLetStatement) {
        exp.decls.forEach((decl) => {
          this.scopeManager.putIdentifier(
            decl.lhs.token.value,
            decl.lhs,
            decl.lhs.resultantType,
            decl.rhs
          );
        });
      }
    });
  }

  visitFunctionDefinition(node: NodeFunctionDefinition): void {
    this.currentFunctionDefinition = node;
    let returnType: GomType;
    const nodeReturnType = node.returnType;
    if (nodeReturnType) {
      const returnTypeType = nodeReturnType.returnType;

      if (
        returnTypeType instanceof NodeGomTypeId &&
        returnTypeType.id.token.type !== GomToken.BUILT_IN_TYPE
      ) {
        const type = this.scopeManager.getType(returnTypeType.id.token.value);
        if (!type) {
          this.errorManager.throwTypeError({
            message: `Return type ${nodeReturnType.returnType.token?.value} not found`,
            loc: nodeReturnType?.loc || node.loc,
          });
        }
        returnType = type.gomType;
      } else if (returnTypeType instanceof NodeGomTypeId) {
        returnType = new GomPrimitiveTypeOrAlias(returnTypeType.id.token.value);
      } else if (returnTypeType instanceof NodeGomTypeStruct) {
        const fields = new Map<string, GomType>();
        returnTypeType.fields.forEach((field) => {
          return field.fieldType;
        });
        returnType = new GomStructType(node.name.value + "_return", fields);
      } else {
        returnType = returnTypeType.gomType;
      }
    } else {
      returnType = new GomPrimitiveTypeOrAlias("void");
    }

    let argTypes: GomType[] = [];
    node.args.forEach((arg) => {
      const argType = this.scopeManager.getType(arg.expectedType.token.value);
      if (!argType) {
        this.errorManager.throwTypeError({
          message: `Type ${arg.expectedType.token.value} not found`,
          loc: arg.expectedType.loc,
        });
      }
      arg.resultantType = argType.gomType;
      argTypes.push(argType.gomType);
    });

    const fnType = new GomFunctionType(argTypes, returnType);
    node.resultantType = fnType;
    this.scopeManager.putIdentifier(node.name.value, node, fnType);
    this.scopeManager.beginScope(node.name.value);
    node.args.forEach((arg) => {
      this.scopeManager.putIdentifier(
        arg.name.token.value,
        arg.name,
        arg.resultantType
      );
    });
    node.body.forEach((stmt) => this.visit(stmt));
    this.scopeManager.endScope();
    this.currentFunctionDefinition = null;
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

    if (node.elseBody) {
      this.scopeManager.beginScope("else");
      node.elseBody.forEach((stmt) => this.visit(stmt));
      this.scopeManager.endScope();
    }
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
        console.log(
          "let",
          decl.lhs.token.value,
          this.scopeManager.getCurrentSymbolTableNode().getName()
        );
      }
    });
  }

  visitReturnStatement(node: NodeReturnStatement): void {
    let returnType: GomType | null = null;
    if (node.expr) {
      this.visit(node.expr);
      const typeResolver = new TypeResolver(
        this.scopeManager,
        this.errorManager
      );
      returnType = typeResolver.resolveType(node.expr);
    }
    if (this.currentFunctionDefinition) {
      const fnType = this.currentFunctionDefinition.resultantType;
      if (
        fnType instanceof GomFunctionType &&
        returnType &&
        !returnType.isEqual(fnType.returnType) &&
        !(
          returnType instanceof GomPrimitiveTypeOrAlias &&
          returnType.typeString === "void"
        )
      ) {
        this.errorManager.throwTypeError({
          message: `Return type mismatch: expected ${fnType.returnType.toStr()}, got ${returnType.toStr()}`,
          loc: node.loc,
        });
      }
    }
  }

  visitAccess(node: NodeAccess): void {
    const typeResolver = new TypeResolver(this.scopeManager, this.errorManager);
    typeResolver.resolveType(node);
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
    this.scopeManager.putType(node.name.token.value, node);
    const typeResolver = new TypeResolver(this.scopeManager, this.errorManager);
    node.accept(typeResolver);
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

  visitStructInit(node: NodeStructInit): void {
    const structType = this.symbolTableReader.getType(
      node.structTypeName.token.value
    );
    if (!structType) {
      this.errorManager.throwTypeError({
        message: `Type ${node.structTypeName.token.value} not found`,
        loc: node.loc,
      });
    }
    const gomType = structType.gomType;
    if (!(gomType instanceof GomStructType)) {
      this.errorManager.throwTypeError({
        message: `Type ${node.structTypeName.token.value} cannot be initialized as a struct`,
        loc: node.loc,
      });
    }

    if (node.fields.length !== gomType.fields.size) {
      this.errorManager.throwTypeError({
        message: `Field count mismatch: expected ${gomType.fields.size}, got ${node.fields.length}`,
        loc: node.loc,
      });
    }

    for (let i = 0; i < node.fields.length; i++) {
      const field = node.fields[i];
      const fieldName = field[0],
        fieldExpr = field[1];
      if (!gomType.fields.has(fieldName.token.value)) {
        this.errorManager.throwTypeError({
          message: `Field ${fieldName.token.value} not found in struct ${node.structTypeName.token.value}`,
          loc: fieldName.loc,
        });
      }

      this.visit(fieldExpr);
      const fieldType = this.currentType;
      if (!fieldType?.isEqual(gomType.fields.get(fieldName.token.value)!)) {
        this.errorManager.throwTypeError({
          message: `Type mismatch: expected ${gomType.fields
            .get(fieldName.token.value)!
            .toStr()}, got ${fieldType?.toStr()}`,
          loc: fieldExpr.loc,
        });
      }

      gomType.fields.set(fieldName.token.value, fieldType);
    }

    node.resultantType = gomType;

    this.currentType = gomType;
  }

  visitTypeDefinition(node: NodeTypeDefinition): void {
    const type = this.symbolTableReader.getType(node.name.token.value);
    if (!type) {
      this.errorManager.throwTypeError({
        message: `Type ${node.name.token.value} not found`,
        loc: node.loc,
      });
    }

    const gomType = type.gomType;
    if (gomType instanceof GomStructType || gomType instanceof GomTupleType) {
      Array.from(gomType.fields.entries()).forEach(([key, field]) => {
        const _field = field as GomPrimitiveTypeOrAlias;
        if (_field.typeString.startsWith("resolve_type@@")) {
          const idName = _field.toStr().replace("resolve_type@@", "");
          const id = this.symbolTableReader.getType(idName);
          if (id) {
            gomType.fields.set(key, id.gomType);
          } else {
            this.errorManager.throwTypeError({
              message: `Type ${idName} not found`,
              loc: node.loc,
            });
          }
        }
      });
    } else if (gomType instanceof GomPrimitiveTypeOrAlias) {
      if (gomType.typeString.startsWith("resolve_type@@")) {
        const idName = gomType.typeString.replace("resolve_type@@", "");
        const id = this.symbolTableReader.getType(idName);
        if (id) {
          node.rhs.gomType = id.gomType;
        } else {
          this.errorManager.throwTypeError({
            message: `Type ${idName} not found`,
            loc: node.loc,
          });
        }
      }
    }
  }

  visitAccess(node: NodeAccess): void {
    const idName = node.lhs.token.value;
    const id = this.symbolTableReader.getIdentifier(idName);
    if (id && !id.isFunction()) {
      // ensure that node.lhs is a struct
      // only support member access for structs for now
      if (id.type instanceof GomStructType || id.type instanceof GomTupleType) {
        node.lhs.resultantType = id.type;
        if (node.rhs instanceof NodeTerm) {
          const structType = id.type;
          const field = structType.fields.get(node.rhs.token.value);
          if (field) {
            node.rhs.resultantType = field;
            node.resultantType = field;
            this.currentType = field;
          } else {
            this.errorManager.throwTypeError({
              message: `Field ${node.rhs.token.value} not found in struct ${idName}`,
              loc: node.rhs.loc,
            });
          }
        }
      } else {
        this.visit(node.rhs);
      }
    } else {
      if (idName === "io") {
        // skip for now until modules are implemented
        this.visit(node.rhs);

        return;
      }
      this.errorManager.throwTypeError({
        message: `Identifier ${idName} not found`,
        loc: node.loc,
      });
    }
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

      const testInt = new GomPrimitiveTypeOrAlias("int"),
        testBool = new GomPrimitiveTypeOrAlias("bool");

      if (
        (lhsType.isEqual(testInt) && !rhsType.isEqual(testInt)) ||
        (!lhsType.isEqual(testInt) && rhsType.isEqual(testInt)) ||
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
    if (fn && fn.node.resultantType instanceof GomFunctionType) {
      const args = node.args.map((arg) => this.resolveType(arg));
      if (args.length !== fn.node.resultantType.args.length) {
        this.errorManager.throwTypeError({
          message: `Argument count mismatch: expected ${
            fn.node.resultantType.args.length
          }, got ${
            args.length
          } for function ${fnName} of type ${fn.node.resultantType.toStr()}`,
          loc: node.loc,
        });
      }

      for (let i = 0; i < args.length; i++) {
        if (!args[i]?.isEqual(fn.node.resultantType.args[i])) {
          this.errorManager.throwTypeError({
            message: `Type mismatch: expected ${
              fn.node.resultantType.args[i]
            }, got ${
              args[i]
            } for argument ${i} of function ${fnName} of type ${fn.node.resultantType.toStr()}`,
            loc: node.loc,
          });
        }
      }

      node.resultantType = fn.node.resultantType.returnType;
      this.currentType = fn.node.resultantType.returnType;
    } else {
      if (fnName === "log") {
        // skip for now until modules are implemented
        node.args.map((arg) => this.resolveType(arg));
        node.resultantType = new GomPrimitiveTypeOrAlias("void");
        this.currentType = node.resultantType;
        return;
      }
      this.errorManager.throwTypeError({
        message: `Function ${fnName} not found`,
        loc: node.loc,
      });
    }
  }

  visitTupleLiteral(node: NodeTupleLiteral): void {
    const elements = node.elements.map((element) => {
      this.visit(element);
      return this.currentType!;
    });

    node.resultantType = new GomTupleType(elements);
    this.currentType = node.resultantType;
  }

  visitTerm(node: NodeTerm): void {
    const type = node.gomType;

    if (type instanceof GomPrimitiveTypeOrAlias) {
      if (type.typeString.startsWith("resolve_type@@")) {
        const idName = type.typeString.replace("resolve_type@@", "");
        const id = this.symbolTableReader.getIdentifier(idName);
        if (id && !id.isFunction()) {
          node.resultantType = id.type;
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
}
