import { Token } from "../../../lexer";
import { Node, NodeType } from "../tree";

export class NodeProgram implements Node {
  type: NodeType;
  importDeclarations: NodeImportDeclaration[] = [];
  typeDefinitions: NodeTypeDefinition[] = [];
  functionDeclarations: NodeFunctionDefinition[] = [];
  mainFunction: NodeMainFunction;

  constructor({
    importDeclarations,
    typeDefinitions,
    functionDeclarations,
    mainFunction,
  }: {
    importDeclarations: NodeImportDeclaration[];
    typeDefinitions: NodeTypeDefinition[];
    functionDeclarations: NodeFunctionDefinition[];
    mainFunction: NodeMainFunction;
  }) {
    this.type = NodeType.PROGRAM;
    this.importDeclarations = importDeclarations;
    this.typeDefinitions = typeDefinitions;
    this.functionDeclarations = functionDeclarations;
    this.mainFunction = mainFunction;
  }
}

export class NodeImportDeclaration implements Node {
  type: NodeType;
  path: Token;

  constructor(path: Token) {
    this.type = NodeType.IMPORT_DECLARATION;
    this.path = path;
  }
}

export class NodeTypeDefinition implements Node {
  type: NodeType;
  name: Token;
  rhs: Token;

  constructor({ name, rhs }: { name: Token; rhs: Token }) {
    this.type = NodeType.TYPE_DEFINITION;
    this.name = name;
    this.rhs = rhs;
  }
}

export class NodeFunctionDefinition implements Node {
  type: NodeType;
  name: Token;
  args: NodeArgumentItem[];
  returnType?: NodeFunctionReturnType;
  body: NodeStatement[];

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
    this.type = NodeType.FUNCTION_DEFINITION;
    this.name = name;
    this.args = args;
    this.returnType = returnType;
    this.body = body;
  }
}

export class NodeMainFunction implements Node {
  type: NodeType;
  body: NodeStatement[];

  constructor(body: NodeStatement[]) {
    this.type = NodeType.MAIN_FUNCTION;
    this.body = body;
  }
}

export type NodeStatement =
  | NodeIfStatement
  | NodeForStatement
  | NodeReturnStatement
  | NodeLetStatement
  | NodeExpressionStatement;

export class NodeIfStatement implements Node {
  type: NodeType;
  conditionExpr: NodeExpr;
  body: NodeStatement[];
  elseBody?: NodeStatement[];

  constructor({
    conditionExpr,
    body,
    elseBody,
  }: {
    conditionExpr: NodeExpr;
    body: NodeStatement[];
    elseBody?: NodeStatement[];
  }) {
    this.type = NodeType.IF_STATEMENT;
    this.conditionExpr = conditionExpr;
    this.body = body;
    this.elseBody = elseBody;
  }
}

export class NodeForStatement implements Node {
  type: NodeType;
  initExpr?: NodeExpr;
  conditionExpr?: NodeExpr;
  updateExpr?: NodeExpr;
  body: NodeStatement[];

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
    this.type = NodeType.FOR_STATEMENT;
    this.initExpr = initExpr;
    this.conditionExpr = conditionExpr;
    this.updateExpr = updateExpr;
    this.body = body;
  }
}

export class NodeReturnStatement implements Node {
  type: NodeType;
  expr: NodeExpr;

  constructor(expr: NodeExpr) {
    this.type = NodeType.RETURN_STATEMENT;
    this.expr = expr;
  }
}

export class NodeLetStatement implements Node {
  type: NodeType;
  name: Token;
  rhs: NodeExpr;

  constructor({ name, rhs }: { name: Token; rhs: NodeExpr }) {
    this.type = NodeType.LET_STATEMENT;
    this.name = name;
    this.rhs = rhs;
  }
}

export class NodeExpressionStatement implements Node {
  type: NodeType;
  expr: NodeExpr;

  constructor(expr: NodeExpr) {
    this.type = NodeType.EXPRESSION_STATEMENT;
    this.expr = expr;
  }
}

export class NodeArgumentItem implements Node {
  type: NodeType;
  name: Token;
  expectedType: Token;

  constructor({ name, expectedType }: { name: Token; expectedType: Token }) {
    this.type = NodeType.ARGUMENT_ITEM;
    this.name = name;
    this.expectedType = expectedType;
  }
}

export class NodeFunctionReturnType implements Node {
  type: NodeType;
  returnType: Token;

  constructor(returnType: Token) {
    this.type = NodeType.FUNCTION_RETURN_TYPE;
    this.returnType = returnType;
  }
}

export class NodeGomType implements Node {
  type: NodeType;
  name: Token;

  constructor(name: Token) {
    this.type = NodeType.GOM_TYPE;
    this.name = name;
  }
}

export type NodeExpr = NodeExprBasic | NodeExprBracketed;

export class NodeExprBasic implements Node {
  type: NodeType;
  term: Token;
  exprTermTail?: NodeExprTermTail;

  constructor({
    term,
    exprTermTail,
  }: {
    term: Token;
    exprTermTail?: NodeExprTermTail;
  }) {
    this.type = NodeType.EXPR_BASIC;
    this.term = term;
    this.exprTermTail = exprTermTail;
  }
}

export class NodeExprBracketed implements Node {
  type: NodeType;
  expr: NodeExpr;

  constructor(expr: NodeExpr) {
    this.type = NodeType.EXPR_BRACKETED;
    this.expr = expr;
  }
}

export type NodeExprTermTail = NodeAccessTail | NodeCallTail | NodeOpTail;

export class NodeAccessTail implements Node {
  type: NodeType;
  id: Token;
  tail?: NodeExprTermTail;

  constructor({ id, tail }: { id: Token; tail?: NodeExprTermTail }) {
    this.type = NodeType.ACCESS;
    this.id = id;
    this.tail = tail;
  }
}

export class NodeCallTail implements Node {
  type: NodeType;
  args: NodeExpr[];
  tail?: NodeExprTermTail;

  constructor({ args, tail }: { args: NodeExpr[]; tail?: NodeExprTermTail }) {
    this.type = NodeType.CALL;
    this.args = args;
    this.tail = tail;
  }
}

export type NodeOpTail =
  | NodeAssignmentTail
  | NodeComparisonTail
  | NodeSumTail
  | NodeQuotTail
  | NodeExpoTail;

export class NodeAssignmentTail implements Node {
  type: NodeType;
  rhs: NodeExpr;

  constructor(rhs: NodeExpr) {
    this.type = NodeType.ASSIGNMENT;
    this.rhs = rhs;
  }
}

export class NodeComparisonTail implements Node {
  type: NodeType;
  op: Token;
  rhs: NodeExpr;

  constructor({ op, rhs }: { op: Token; rhs: NodeExpr }) {
    this.type = NodeType.COMPARISON;
    this.op = op;
    this.rhs = rhs;
  }
}

export class NodeSumTail implements Node {
  type: NodeType;
  op: Token;
  rhs: NodeExpr;

  constructor({ op, rhs }: { op: Token; rhs: NodeExpr }) {
    this.type = NodeType.SUM;
    this.op = op;
    this.rhs = rhs;
  }
}

export class NodeQuotTail implements Node {
  type: NodeType;
  op: Token;
  rhs: NodeExpr;

  constructor({ op, rhs }: { op: Token; rhs: NodeExpr }) {
    this.type = NodeType.QUOT;
    this.op = op;
    this.rhs = rhs;
  }
}

export class NodeExpoTail implements Node {
  type: NodeType;
  op: Token;
  rhs: NodeExpr;

  constructor({ op, rhs }: { op: Token; rhs: NodeExpr }) {
    this.type = NodeType.EXPO;
    this.op = op;
    this.rhs = rhs;
  }
}
