import { Token } from "../../../lexer";
import { GomToken } from "../../../lexer/tokens";
import {
  GomFunctionType,
  GomPrimitiveTypeOrAlias,
  GomType,
} from "../../../semantics/type";
import { AbstractNode, Node, NodeType } from "../tree";

function formChildrenArray(...nodes: (Node | Node[] | undefined)[]): Node[] {
  let children: Node[] = [];

  nodes.forEach((item) => {
    if (Array.isArray(item)) {
      children.push(...item);
    } else if (item) {
      children.push(item);
    }
  });

  return children;
}

export class NodeProgram extends AbstractNode {
  type: NodeType;
  children: Node[];
  importDeclarations: NodeImportDeclaration[] = [];
  typeDefinitions: NodeTypeDefinition[] = [];
  globalVariables: NodeLetStatement[] = [];
  functionDeclarations: NodeFunctionDefinition[] = [];
  mainFunction: NodeMainFunction;

  constructor({
    importDeclarations,
    typeDefinitions,
    globalVariables,
    functionDeclarations,
    mainFunction,
  }: {
    importDeclarations: NodeImportDeclaration[];
    typeDefinitions: NodeTypeDefinition[];
    globalVariables: NodeLetStatement[];
    functionDeclarations: NodeFunctionDefinition[];
    mainFunction: NodeMainFunction;
  }) {
    super();
    this.type = NodeType.PROGRAM;
    this.importDeclarations = importDeclarations;
    this.typeDefinitions = typeDefinitions;
    this.globalVariables = globalVariables;
    this.functionDeclarations = functionDeclarations;
    this.mainFunction = mainFunction;
    this.children = formChildrenArray(
      importDeclarations,
      typeDefinitions,
      globalVariables,
      functionDeclarations,
      mainFunction
    );
  }
}

export class NodeImportDeclaration extends AbstractNode {
  type: NodeType;
  children: Node[];
  path: Token;

  constructor(path: Token) {
    super();
    this.type = NodeType.IMPORT_DECLARATION;
    this.path = path;
    this.children = [];
  }
}

export class NodeTypeDefinition extends AbstractNode {
  type: NodeType;
  name: Token;
  rhs: NodeGomType;
  children: Node[];

  constructor({ name, rhs }: { name: Token; rhs: NodeGomType }) {
    super();
    this.type = NodeType.TYPE_DEFINITION;
    this.name = name;
    this.rhs = rhs;
    this.children = [];
  }
}

export class NodeFunctionDefinition extends AbstractNode {
  type: NodeType;
  children: Node[];
  name: Token;
  args: NodeArgumentItem[];
  returnType?: NodeFunctionReturnType;
  body: NodeStatement[];
  gomType: GomFunctionType;

  constructor({
    name,
    args,
    returnType,
    body,
  }: {
    name: Token;
    args: NodeArgumentItem[];
    returnType?: NodeFunctionReturnType;
    body: NodeStatement[];
  }) {
    super();
    this.type = NodeType.FUNCTION_DEFINITION;
    this.name = name;
    this.args = args;
    this.returnType = returnType;
    this.body = body;
    this.children = formChildrenArray(args, returnType, body);
    this.gomType = new GomFunctionType(
      args.map((arg) => arg.gomType),
      returnType
        ? new GomPrimitiveTypeOrAlias(returnType.returnType.value)
        : new GomPrimitiveTypeOrAlias("void")
    );
  }
}

export class NodeMainFunction extends AbstractNode {
  type: NodeType;
  body: NodeStatement[];
  children: Node[];

  constructor(body: NodeStatement[]) {
    super();
    this.type = NodeType.MAIN_FUNCTION;
    this.body = body;
    this.children = formChildrenArray(body);
  }
}

export type NodeStatement =
  | NodeIfStatement
  | NodeForStatement
  | NodeReturnStatement
  | NodeLetStatement
  | NodeExpressionStatement;

export class NodeIfStatement extends AbstractNode {
  type: NodeType;
  conditionExpr: NodeExpr;
  body: NodeStatement[];
  elseBody?: NodeStatement[];
  children: Node[];

  constructor({
    conditionExpr,
    body,
    elseBody,
  }: {
    conditionExpr: NodeExpr;
    body: NodeStatement[];
    elseBody?: NodeStatement[];
  }) {
    super();
    this.type = NodeType.IF_STATEMENT;
    this.conditionExpr = conditionExpr;
    this.body = body;
    this.elseBody = elseBody;
    this.children = formChildrenArray(conditionExpr, body, elseBody);
  }
}

export class NodeForStatement extends AbstractNode {
  type: NodeType;
  initExpr?: NodeExpr;
  conditionExpr?: NodeExpr;
  updateExpr?: NodeExpr;
  body: NodeStatement[];
  children: Node[];

  constructor({
    initExpr,
    conditionExpr,
    updateExpr,
    body,
  }: {
    initExpr?: NodeExpr;
    conditionExpr?: NodeExpr;
    updateExpr?: NodeExpr;
    body: NodeStatement[];
  }) {
    super();
    this.type = NodeType.FOR_STATEMENT;
    this.initExpr = initExpr;
    this.conditionExpr = conditionExpr;
    this.updateExpr = updateExpr;
    this.body = body;
    this.children = formChildrenArray(
      initExpr,
      conditionExpr,
      updateExpr,
      body
    );
  }
}

export class NodeReturnStatement extends AbstractNode {
  type: NodeType;
  expr: NodeExpr;
  children: Node[];

  constructor(expr: NodeExpr) {
    super();
    this.type = NodeType.RETURN_STATEMENT;
    this.expr = expr;
    this.children = formChildrenArray(expr);
  }
}

export class NodeLetStatement extends AbstractNode {
  type: NodeType;
  decls: NodeAssignment[];
  children: Node[];

  constructor({ decls }: { decls: NodeAssignment[] }) {
    super();
    this.type = NodeType.LET_STATEMENT;
    this.decls = decls;
    this.children = formChildrenArray(decls);
  }
}

export class NodeConstStatement extends AbstractNode {
  type: NodeType;
  decls: NodeAssignment[];
  children: Node[];

  constructor({ decls }: { decls: NodeAssignment[] }) {
    super();
    this.type = NodeType.CONST_STATEMENT;
    this.decls = decls;
    this.children = formChildrenArray(decls);
  }
}

export class NodeExpressionStatement extends AbstractNode {
  type: NodeType;
  expr: NodeExpr;
  children: Node[];

  constructor(expr: NodeExpr) {
    super();
    this.type = NodeType.EXPRESSION_STATEMENT;
    this.expr = expr;
    this.children = formChildrenArray(expr);
  }
}

export class NodeArgumentItem extends AbstractNode {
  type: NodeType;
  name: NodeTerm;
  expectedType: Token;
  children: Node[];
  gomType: GomType;

  constructor({ name, expectedType }: { name: NodeTerm; expectedType: Token }) {
    super();
    this.type = NodeType.ARGUMENT_ITEM;
    this.name = name;
    this.expectedType = expectedType;
    this.children = [];
    this.gomType = new GomPrimitiveTypeOrAlias(expectedType.value);
  }
}

export class NodeFunctionReturnType extends AbstractNode {
  type: NodeType;
  returnType: Token;
  children: Node[];

  constructor(returnType: Token) {
    super();
    this.type = NodeType.FUNCTION_RETURN_TYPE;
    this.returnType = returnType;
    this.children = [];
  }
}

export type NodeGomType = NodeGomTypeIdOrArray | NodeGomTypeStruct;
export class NodeGomTypeIdOrArray extends AbstractNode {
  type: NodeType;
  id: Token;
  arrSize?: Token;
  children: Node[];

  constructor(id: Token, arrSize?: Token) {
    super();
    this.type = NodeType.GOM_TYPE_ID_OR_ARRAY;
    this.id = id;
    this.arrSize = arrSize;
    this.children = [];
  }
}

export class NodeGomTypeStruct extends AbstractNode {
  type: NodeType;
  fields: NodeGomTypeStructField[];

  constructor(fields: NodeGomTypeStructField[]) {
    super();
    this.type = NodeType.GOM_TYPE_STRUCT;
    this.fields = fields;
    this.children = formChildrenArray(fields);
  }
}

export class NodeGomTypeStructField extends AbstractNode {
  type: NodeType;
  name: Token;
  fieldType: NodeGomTypeIdOrArray;
  children: Node[];

  constructor(name: Token, fieldType: NodeGomTypeIdOrArray) {
    super();
    this.type = NodeType.GOM_TYPE_STRUCT_FIELD;
    this.name = name;
    this.fieldType = fieldType;
    this.children = formChildrenArray(fieldType);
  }
}

export type NodeExpr = NodeExprBasic | NodeExprBracketed;

export type NodeExprBasic = NodeAccess | NodeCall | NodeTerm;

export class NodeAssignment extends AbstractNode {
  type: NodeType;
  lhs: NodeExpr;
  rhs: NodeExpr;

  constructor(lhs: NodeExpr, rhs: NodeExpr) {
    super();
    this.type = NodeType.ASSIGNMENT;
    this.lhs = lhs;
    this.rhs = rhs;
    this.children = formChildrenArray(lhs, rhs);
  }
}

export class NodeBinaryOp extends AbstractNode {
  type: NodeType;
  lhs: NodeExpr;
  op: Token;
  rhs: NodeExpr;

  constructor({
    type,
    lhs,
    op,
    rhs,
  }: {
    type: NodeType;
    lhs: NodeExpr;
    op: Token;
    rhs: NodeExpr;
  }) {
    super();
    this.type = type;
    this.lhs = lhs;
    this.op = op;
    this.rhs = rhs;
    this.children = formChildrenArray(lhs, rhs);
  }
}

export class NodeAccess extends AbstractNode {
  type: NodeType;
  lhs: NodeExpr;
  rhs: NodeExpr;
  children: Node[];

  constructor(lhs: NodeExpr, rhs: NodeExpr) {
    super();
    this.type = NodeType.ACCESS;
    this.lhs = lhs;
    this.rhs = rhs;
    this.children = formChildrenArray(lhs, rhs);
  }
}

export class NodeCall extends AbstractNode {
  type: NodeType;
  id: NodeExpr;
  args: NodeExpr[];

  constructor(id: NodeExpr, args: NodeExpr[]) {
    super();
    this.type = NodeType.CALL;
    this.id = id;
    this.args = args;
    this.children = formChildrenArray(id, args);
  }
}

export class NodeExprBracketed extends AbstractNode {
  type: NodeType;
  expr: NodeExpr;
  children: Node[];

  constructor(expr: NodeExpr) {
    super();
    this.type = NodeType.EXPR_BRACKETED;
    this.expr = expr;
    this.children = formChildrenArray(expr);
  }
}

export class NodeTerm extends AbstractNode {
  type: NodeType;
  token: Token;
  children: Node[];
  gomType: GomPrimitiveTypeOrAlias;

  constructor(token: Token) {
    super();
    this.type = NodeType.TERM;
    this.token = token;
    this.children = [];
    this.gomType = this.getGomType();
  }

  private getGomType() {
    if (this.token.type === GomToken.IDENTIFIER) {
      return new GomPrimitiveTypeOrAlias(`resolve_type@@${this.token.value}`);
    } else if (this.token.type === GomToken.NUMLITERAL) {
      return new GomPrimitiveTypeOrAlias("i8");
    } else if (this.token.type === GomToken.STRLITERAL) {
      return new GomPrimitiveTypeOrAlias("str");
    } else if (
      this.token.type === GomToken.TRUE ||
      this.token.type === GomToken.FALSE
    ) {
      return new GomPrimitiveTypeOrAlias("bool");
    } else if (this.token.type === GomToken.BUILT_IN_TYPE) {
      return new GomPrimitiveTypeOrAlias(`primitive_type@@${this.token.value}`);
    }

    throw new Error(`Cannot determine type for token: ${this.token.type}`);
  }
}
