import { Token } from "../../../lexer";
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
    super();
    this.type = NodeType.PROGRAM;
    this.importDeclarations = importDeclarations;
    this.typeDefinitions = typeDefinitions;
    this.functionDeclarations = functionDeclarations;
    this.mainFunction = mainFunction;
    this.children = formChildrenArray(
      importDeclarations,
      typeDefinitions,
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
  rhs: Token;
  children: Node[];

  constructor({ name, rhs }: { name: Token; rhs: Token }) {
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
  name: Token;
  rhs: NodeExpr;
  children: Node[];

  constructor({ name, rhs }: { name: Token; rhs: NodeExpr }) {
    super();
    this.type = NodeType.LET_STATEMENT;
    this.name = name;
    this.rhs = rhs;
    this.children = formChildrenArray(rhs);
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
  name: Token;
  expectedType: Token;
  children: Node[];

  constructor({ name, expectedType }: { name: Token; expectedType: Token }) {
    super();
    this.type = NodeType.ARGUMENT_ITEM;
    this.name = name;
    this.expectedType = expectedType;
    this.children = [];
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

export class NodeGomType extends AbstractNode {
  type: NodeType;
  name: Token;
  children: Node[];

  constructor(name: Token) {
    super();
    this.type = NodeType.GOM_TYPE;
    this.name = name;
    this.children = [];
  }
}

export type NodeExpr = NodeExprBasic | NodeExprBracketed;

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

export type NodeExprTermTail = NodeAccessTail | NodeCallTail | NodeOpTail;

export class NodeAccessTail extends AbstractNode {
  type: NodeType;
  rhs: NodeExpr;
  tail?: NodeExprTermTail;
  children: Node[];

  constructor({ rhs, tail }: { rhs: NodeExpr; tail?: NodeExprTermTail }) {
    super();
    this.type = NodeType.ACCESS_TAIL;
    this.rhs = rhs;
    this.tail = tail;
    this.children = formChildrenArray(rhs, tail);
  }
}

export type NodeExprBasic = NodeAccess | NodeCall | NodeOp | NodeTerm;

export class NodeAccess extends AbstractNode {
  type: NodeType;
  lhs: NodeTerm;
  rhs: NodeAccessTail;
  children: Node[];

  constructor(lhs: NodeTerm, rhs: NodeAccessTail) {
    super();
    this.type = NodeType.ACCESS;
    this.lhs = lhs;
    this.rhs = rhs;
    this.children = formChildrenArray(lhs, rhs);
  }
}

export class NodeCall extends AbstractNode {
  type: NodeType;
  id: NodeTerm;
  tail: NodeCallTail;
  children: Node[];

  constructor(id: NodeTerm, tail: NodeCallTail) {
    super();
    this.type = NodeType.CALL;
    this.id = id;
    this.tail = tail;
    this.children = formChildrenArray(id, tail);
  }
}

export type NodeOp =
  | NodeAssignment
  | NodeComparison
  | NodeSum
  | NodeQuot
  | NodeExpo;

export class NodeAssignment extends AbstractNode {
  type: NodeType;
  lhs: NodeTerm;
  rhs: NodeAssignmentTail;
  children: Node[];

  constructor(lhs: NodeTerm, rhs: NodeAssignmentTail) {
    super();
    this.type = NodeType.ASSIGNMENT;
    this.lhs = lhs;
    this.rhs = rhs;
    this.children = formChildrenArray(lhs, rhs);
  }
}

export class NodeComparison extends AbstractNode {
  type: NodeType;
  lhs: NodeTerm;
  tail: NodeComparisonTail;
  children: Node[];

  constructor({ lhs, tail }: { lhs: NodeTerm; tail: NodeComparisonTail }) {
    super();
    this.type = NodeType.COMPARISON;
    this.lhs = lhs;
    this.tail = tail;
    this.children = formChildrenArray(lhs, tail);
  }
}

export class NodeSum extends AbstractNode {
  type: NodeType;
  lhs: NodeTerm;
  tail: NodeSumTail;
  children: Node[];

  constructor({ lhs, tail }: { lhs: NodeTerm; tail: NodeSumTail }) {
    super();
    this.type = NodeType.SUM;
    this.lhs = lhs;
    this.tail = tail;
    this.children = formChildrenArray(lhs, tail);
  }
}

export class NodeQuot extends AbstractNode {
  type: NodeType;
  lhs: NodeTerm;
  tail: NodeQuotTail;
  children: Node[];

  constructor({ lhs, tail }: { lhs: NodeTerm; tail: NodeQuotTail }) {
    super();
    this.type = NodeType.QUOT;
    this.lhs = lhs;
    this.tail = tail;
    this.children = formChildrenArray(lhs, tail);
  }
}

export class NodeExpo extends AbstractNode {
  type: NodeType;
  base: NodeTerm;
  tail: NodeExpoTail;
  children: Node[];

  constructor({ base, tail }: { base: NodeTerm; tail: NodeExpoTail }) {
    super();
    this.type = NodeType.EXPO;
    this.base = base;
    this.tail = tail;
    this.children = formChildrenArray(base, tail);
  }
}

export class NodeCallTail extends AbstractNode {
  type: NodeType;
  args: NodeExpr[];
  tail?: NodeExprTermTail;
  children: Node[];

  constructor({ args, tail }: { args: NodeExpr[]; tail?: NodeExprTermTail }) {
    super();
    this.type = NodeType.CALL_TAIL;
    this.args = args;
    this.tail = tail;
    this.children = formChildrenArray(args, tail);
  }
}

export type NodeOpTail =
  | NodeAssignmentTail
  | NodeComparisonTail
  | NodeSumTail
  | NodeQuotTail
  | NodeExpoTail;

export class NodeAssignmentTail extends AbstractNode {
  type: NodeType;
  rhs: NodeExpr;
  children: Node[];

  constructor(rhs: NodeExpr) {
    super();
    this.type = NodeType.ASSIGNMENT_TAIL;
    this.rhs = rhs;
    this.children = formChildrenArray(rhs);
  }
}

export class NodeComparisonTail extends AbstractNode {
  type: NodeType;
  op: Token;
  rhs: NodeExpr;
  children: Node[];

  constructor({ op, rhs }: { op: Token; rhs: NodeExpr }) {
    super();
    this.type = NodeType.COMPARISON_TAIL;
    this.op = op;
    this.rhs = rhs;
    this.children = formChildrenArray(rhs);
  }
}

export class NodeSumTail extends AbstractNode {
  type: NodeType;
  op: Token;
  rhs: NodeExpr;
  children: Node[];

  constructor({ op, rhs }: { op: Token; rhs: NodeExpr }) {
    super();
    this.type = NodeType.SUM_TAIL;
    this.op = op;
    this.rhs = rhs;
    this.children = formChildrenArray(rhs);
  }
}

export class NodeQuotTail extends AbstractNode {
  type: NodeType;
  op: Token;
  rhs: NodeExpr;
  children: Node[];

  constructor({ op, rhs }: { op: Token; rhs: NodeExpr }) {
    super();
    this.type = NodeType.QUOT_TAIL;
    this.op = op;
    this.rhs = rhs;
    this.children = formChildrenArray(rhs);
  }
}

export class NodeExpoTail extends AbstractNode {
  type: NodeType;
  op: Token;
  rhs: NodeExpr;
  children: Node[];

  constructor({ op, rhs }: { op: Token; rhs: NodeExpr }) {
    super();
    this.type = NodeType.EXPO_TAIL;
    this.op = op;
    this.rhs = rhs;
    this.children = formChildrenArray(rhs);
  }
}

export class NodeTerm extends AbstractNode {
  type: NodeType;
  token: Token;
  children: Node[];

  constructor(token: Token) {
    super();
    this.type = NodeType.TERM;
    this.token = token;
    this.children = [];
  }
}
