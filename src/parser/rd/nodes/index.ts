import { Token } from "../../../lexer";
import { GomToken } from "../../../lexer/tokens";
import {
  GomCompositeType,
  GomCompositeTypeKind,
  GomListType,
  GomPrimitiveTypeOrAlias,
  GomStructType,
  GomTupleType,
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
  exportStatements: NodeExportStatement[] = [];
  mainFunction: NodeMainFunction;

  constructor({
    importDeclarations,
    typeDefinitions,
    globalVariables,
    functionDeclarations,
    exportStatements,
    mainFunction,
  }: {
    importDeclarations: NodeImportDeclaration[];
    typeDefinitions: NodeTypeDefinition[];
    globalVariables: NodeLetStatement[];
    functionDeclarations: NodeFunctionDefinition[];
    exportStatements: NodeExportStatement[];
    mainFunction: NodeMainFunction;
  }) {
    super();
    this.type = NodeType.PROGRAM;
    this.importDeclarations = importDeclarations;
    this.typeDefinitions = typeDefinitions;
    this.globalVariables = globalVariables;
    this.functionDeclarations = functionDeclarations;
    this.exportStatements = exportStatements;
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

  constructor({ path, loc }: { path: Token; loc: number }) {
    super();
    this.type = NodeType.IMPORT_DECLARATION;
    this.loc = loc;
    this.loc = path.start;
    this.path = path;
    this.children = [];
  }
}

export class NodeTypeDefinition extends AbstractNode {
  type: NodeType;
  name: NodeTerm;
  rhs: NodeGomType;
  children: Node[];

  constructor({
    name,
    rhs,
    loc,
  }: {
    name: NodeTerm;
    rhs: NodeGomType;
    loc: number;
  }) {
    super();
    this.type = NodeType.TYPE_DEFINITION;
    this.loc = loc;
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
  resultantType: GomType;

  constructor({
    loc,
    name,
    args,
    returnType,
    body,
  }: {
    loc: number;
    name: Token;
    args: NodeArgumentItem[];
    returnType?: NodeFunctionReturnType;
    body: NodeStatement[];
  }) {
    super();
    this.type = NodeType.FUNCTION_DEFINITION;
    this.loc = loc;
    this.name = name;
    this.args = args;
    this.returnType = returnType;
    this.body = body;
    this.children = formChildrenArray(args, returnType, body);
    this.resultantType = new GomPrimitiveTypeOrAlias("void");
  }
}

export class NodeMainFunction extends AbstractNode {
  type: NodeType;
  body: NodeStatement[];
  children: Node[];

  constructor({ body, loc }: { body: NodeStatement[]; loc: number }) {
    super();
    this.type = NodeType.MAIN_FUNCTION;
    this.loc = loc;
    this.body = body;
    this.children = formChildrenArray(body);
  }
}

export type NodeStatement =
  | NodeExportStatement
  | NodeIfStatement
  | NodeForStatement
  | NodeReturnStatement
  | NodeLetStatement
  | NodeExpressionStatement
  | NodeBreakStatement
  | NodeContinueStatement;

export type ExportableNode =
  | NodeFunctionDefinition
  | NodeTypeDefinition
  | NodeLetStatement;
export class NodeExportStatement extends AbstractNode {
  type: NodeType;
  children: Node[];
  exportedItem: ExportableNode;

  constructor({
    exportedItem,
    loc,
  }: {
    exportedItem: ExportableNode;
    loc: number;
  }) {
    super();
    this.type = NodeType.EXPORT_STATEMENT;
    this.loc = loc;
    this.exportedItem = exportedItem;
    this.children = formChildrenArray(exportedItem);
  }
}

export class NodeIfStatement extends AbstractNode {
  type: NodeType;
  conditionExpr: NodeExpr;
  body: NodeStatement[];
  elseBody?: NodeStatement[];
  children: Node[];

  constructor({
    loc,
    conditionExpr,
    body,
    elseBody,
  }: {
    loc: number;
    conditionExpr: NodeExpr;
    body: NodeStatement[];
    elseBody?: NodeStatement[];
  }) {
    super();
    this.type = NodeType.IF_STATEMENT;
    this.loc = loc;
    this.conditionExpr = conditionExpr;
    this.body = body;
    this.elseBody = elseBody;
    this.children = formChildrenArray(conditionExpr, body, elseBody);
  }
}

export class NodeForStatement extends AbstractNode {
  type: NodeType;
  initExpr?: NodeExpr | NodeLetStatement;
  conditionExpr?: NodeExpr;
  updateExpr?: NodeExpr;
  body: NodeStatement[];
  children: Node[];

  constructor({
    loc,
    initExpr,
    conditionExpr,
    updateExpr,
    body,
  }: {
    loc: number;
    initExpr?: NodeExpr | NodeLetStatement;
    conditionExpr?: NodeExpr;
    updateExpr?: NodeExpr;
    body: NodeStatement[];
  }) {
    super();
    this.type = NodeType.FOR_STATEMENT;
    this.loc = loc;
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

  constructor({ expr, loc }: { expr: NodeExpr; loc: number }) {
    super();
    this.type = NodeType.RETURN_STATEMENT;
    this.loc = loc;
    this.expr = expr;
    this.children = formChildrenArray(expr);
  }
}

export class NodeLetStatement extends AbstractNode {
  type: NodeType;
  decls: NodeAssignment[];
  children: Node[];

  constructor({ decls, loc }: { decls: NodeAssignment[]; loc: number }) {
    super();
    this.type = NodeType.LET_STATEMENT;
    this.loc = loc;
    this.decls = decls;
    this.children = formChildrenArray(decls);
  }
}

export class NodeConstStatement extends AbstractNode {
  type: NodeType;
  decls: NodeAssignment[];
  children: Node[];

  constructor({ decls, loc }: { decls: NodeAssignment[]; loc: number }) {
    super();
    this.type = NodeType.CONST_STATEMENT;
    this.loc = loc;
    this.decls = decls;
    this.children = formChildrenArray(decls);
  }
}

export class NodeExpressionStatement extends AbstractNode {
  type: NodeType;
  expr: NodeExpr;
  children: Node[];

  constructor({ expr, loc }: { expr: NodeExpr; loc: number }) {
    super();
    this.type = NodeType.EXPRESSION_STATEMENT;
    this.loc = loc;
    this.expr = expr;
    this.children = formChildrenArray(expr);
  }
}

export class NodeBreakStatement extends AbstractNode {
  type: NodeType;
  children: Node[];

  constructor({ loc }: { loc: number }) {
    super();
    this.type = NodeType.BREAK_STATEMENT;
    this.loc = loc;
    this.children = [];
  }
}

export class NodeContinueStatement extends AbstractNode {
  type: NodeType;
  children: Node[];

  constructor({ loc }: { loc: number }) {
    super();
    this.type = NodeType.CONTINUE_STATEMENT;
    this.loc = loc;
    this.children = [];
  }
}

export class NodeArgumentItem extends AbstractNode {
  type: NodeType;
  name: NodeTerm;
  expectedType: NodeTerm;
  children: Node[];
  resultantType: GomType;

  constructor({
    name,
    expectedType,
    loc,
  }: {
    name: NodeTerm;
    expectedType: NodeTerm;
    loc: number;
  }) {
    super();
    this.type = NodeType.ARGUMENT_ITEM;
    this.loc = loc;
    this.name = name;
    this.expectedType = expectedType;
    this.children = [];
    this.resultantType = new GomPrimitiveTypeOrAlias("void");
  }
}

export class NodeFunctionReturnType extends AbstractNode {
  type: NodeType;
  returnType: NodeGomType;
  children: Node[];

  constructor({ returnType, loc }: { returnType: NodeGomType; loc: number }) {
    super();
    this.type = NodeType.FUNCTION_RETURN_TYPE;
    this.loc = loc;
    this.returnType = returnType;
    this.children = [];
  }
}

export type NodeGomType =
  | NodeGomTypeId
  | NodeGomTypeStruct
  | NodeGomTypeList
  | NodeGomTypeComposite
  | NodeGomTypeTuple;
export class NodeGomTypeId extends AbstractNode {
  type: NodeType;
  id: NodeTerm;
  gomType: GomType;
  children: Node[];

  constructor({ id, loc }: { id: NodeTerm; arrSize?: NodeTerm; loc: number }) {
    super();
    this.type = NodeType.GOM_TYPE_ID;
    this.loc = loc;
    this.id = id;
    this.gomType = id.resultantType;
    this.children = [];
  }
}

export class NodeGomTypeTuple extends AbstractNode {
  type: NodeType;
  fields: NodeGomType[];
  gomType: GomType;
  children: Node[];

  constructor({ fields, loc }: { fields: NodeGomType[]; loc: number }) {
    super();
    this.type = NodeType.GOM_TYPE_TUPLE;
    this.loc = loc;
    this.fields = fields;
    this.gomType = new GomTupleType(fields.map((field) => field.gomType));
    this.children = formChildrenArray(fields);
  }
}

export class NodeGomTypeStruct extends AbstractNode {
  type: NodeType;
  fields: NodeGomTypeStructField[];
  gomType: GomStructType;

  constructor({
    name,
    fields,
    loc,
  }: {
    name: NodeTerm;
    fields: NodeGomTypeStructField[];
    loc: number;
  }) {
    super();
    this.type = NodeType.GOM_TYPE_STRUCT;
    this.loc = loc;
    this.fields = fields;
    this.gomType = new GomStructType(
      name.token.value,
      fields.reduce((acc, field) => {
        acc.set(field.name.value, field.fieldType.gomType);
        return acc;
      }, new Map<string, GomType>())
    );
    this.children = formChildrenArray(fields);
  }
}

export class NodeGomTypeList extends AbstractNode {
  type: NodeType;
  elementType: NodeGomType;
  gomType: GomListType;
  children: Node[];

  constructor({
    name,
    elementType,
    loc,
  }: {
    name: NodeTerm;
    elementType: NodeGomType;
    loc: number;
  }) {
    super();
    this.type = NodeType.GOM_TYPE_LIST;
    this.loc = loc;
    this.elementType = elementType;
    this.gomType = new GomListType(name.token.value, elementType.gomType);
    this.children = formChildrenArray(elementType);
  }
}

export class NodeGomTypeComposite extends AbstractNode {
  type: NodeType;
  id: NodeTerm;
  fields: NodeGomType[];
  gomType: GomType;
  children: Node[];

  constructor({
    id,
    fields,
    loc,
  }: {
    id: NodeTerm;
    fields: NodeGomType[];
    loc: number;
  }) {
    super();
    this.type = NodeType.GOM_TYPE_COMPOSITE;
    this.loc = loc;
    this.id = id;
    this.fields = fields;
    this.gomType = new GomCompositeType(
      NodeGomTypeComposite.getGomCompositeTypeKind(id),
      fields.map((field) => field.gomType)
    );
    this.children = [];
  }

  static getGomCompositeTypeKind(id: NodeTerm): GomCompositeTypeKind {
    switch (id.token.value) {
      default:
        return GomCompositeTypeKind._Custom;
    }
  }
}

export class NodeGomTypeStructField extends AbstractNode {
  type: NodeType;
  name: Token;
  fieldType: NodeGomType;
  children: Node[];

  constructor({
    name,
    fieldType,
    loc,
  }: {
    name: Token;
    fieldType: NodeGomType;
    loc: number;
  }) {
    super();
    this.type = NodeType.GOM_TYPE_STRUCT_FIELD;
    this.loc = loc;
    this.name = name;
    this.fieldType = fieldType;
    this.children = formChildrenArray(fieldType);
  }
}

export type NodeExpr = NodeExprBasic | NodeExprBracketed;

export type NodeExprBasic =
  | NodeAssignment
  | NodeStructInit
  | NodeCollectionInit
  | NodeAccess
  | NodeIndexedAccess
  | NodeCall
  | NodeBinaryOp
  | NodeTupleLiteral
  | NodeTerm;

export class NodeAssignment extends AbstractNode {
  type: NodeType;
  lhs: NodeTerm;
  rhs: NodeExpr;
  resultantType: GomType;

  constructor({
    lhs,
    rhs,
    loc,
  }: {
    lhs: NodeTerm;
    rhs: NodeExpr;
    loc: number;
  }) {
    super();
    this.type = NodeType.ASSIGNMENT;
    this.loc = loc;
    this.lhs = lhs;
    this.rhs = rhs;
    this.resultantType = new GomPrimitiveTypeOrAlias("void");
    this.children = formChildrenArray(lhs, rhs);
  }
}

export class NodeStructInit extends AbstractNode {
  type: NodeType;
  structTypeName: NodeTerm;
  fields: [NodeTerm, NodeExpr][];
  resultantType: GomStructType;

  constructor({
    structTypeName,
    fields,
    loc,
  }: {
    structTypeName: NodeTerm;
    fields: [NodeTerm, NodeExpr][];
    loc: number;
  }) {
    super();
    this.type = NodeType.STRUCT_INIT;
    this.loc = loc;
    this.structTypeName = structTypeName;
    this.fields = fields;
    this.resultantType = new GomStructType(
      structTypeName.token.value,
      fields.reduce((acc, [field, expr]) => {
        acc.set(field.token.value, expr.resultantType);
        return acc;
      }, new Map<string, GomType>())
    );
    this.children = formChildrenArray(fields.map(([, expr]) => expr));
  }
}

export class NodeCollectionInit extends AbstractNode {
  type: NodeType;
  collectionTypeName: NodeTerm;
  elements: NodeExpr[];
  resultantType: GomType;

  constructor({
    collectionTypeName,
    elements,
    loc,
  }: {
    collectionTypeName: NodeTerm;
    elements: NodeExpr[];
    loc: number;
  }) {
    super();
    this.type = NodeType.COLLECTION_INIT;
    this.loc = loc;
    this.collectionTypeName = collectionTypeName;
    this.elements = elements;
    this.resultantType = new GomListType(
      collectionTypeName.token.value,
      elements[0].resultantType
    );
    this.children = formChildrenArray(elements);
  }
}

export class NodeBinaryOp extends AbstractNode {
  type: NodeType;
  lhs: NodeExpr;
  op: Token;
  rhs: NodeExpr;
  resultantType: GomPrimitiveTypeOrAlias;

  constructor({
    loc,
    type,
    lhs,
    op,
    rhs,
  }: {
    loc: number;
    type: NodeType;
    lhs: NodeExpr;
    op: Token;
    rhs: NodeExpr;
  }) {
    super();
    this.type = type;
    this.loc = loc;
    this.lhs = lhs;
    this.op = op;
    this.rhs = rhs;
    this.resultantType = new GomPrimitiveTypeOrAlias("void");
    this.children = formChildrenArray(lhs, rhs);
  }
}

export class NodeAccess extends AbstractNode {
  type: NodeType;
  lhs: NodeTerm;
  rhs: NodeExpr;
  resultantType: GomType;
  children: Node[];

  constructor({
    lhs,
    rhs,
    loc,
  }: {
    lhs: NodeTerm;
    rhs: NodeExpr;
    loc: number;
  }) {
    super();
    this.type = NodeType.ACCESS;
    this.loc = loc;
    this.lhs = lhs;
    this.rhs = rhs;
    this.resultantType = new GomPrimitiveTypeOrAlias("void");
    this.children = formChildrenArray(lhs, rhs);
  }
}

export class NodeCall extends AbstractNode {
  type: NodeType;
  id: NodeExpr;
  args: NodeExpr[];
  resultantType: GomType;
  children: Node[];

  constructor({
    id,
    args,
    loc,
  }: {
    id: NodeExpr;
    args: NodeExpr[];
    loc: number;
  }) {
    super();
    this.type = NodeType.CALL;
    this.loc = loc;
    this.id = id;
    this.args = args;
    this.resultantType = new GomPrimitiveTypeOrAlias("void");
    this.children = formChildrenArray(id, args);
  }
}

export class NodeExprBracketed extends AbstractNode {
  type: NodeType;
  expr: NodeExpr;
  children: Node[];
  resultantType: GomType;

  constructor({ expr, loc }: { expr: NodeExpr; loc: number }) {
    super();
    this.type = NodeType.EXPR_BRACKETED;
    this.loc = loc;
    this.expr = expr;
    this.resultantType = new GomPrimitiveTypeOrAlias("void");
    this.children = formChildrenArray(expr);
  }
}

export class NodeIndexedAccess extends AbstractNode {
  type: NodeType;
  lhs: NodeExpr;
  index: NodeExpr;
  children: Node[];
  resultantType: GomType;

  constructor({
    lhs,
    index,
    loc,
  }: {
    lhs: NodeExpr;
    index: NodeExpr;
    loc: number;
  }) {
    super();
    this.type = NodeType.INDEXED_ACCESS;
    this.loc = loc;
    this.lhs = lhs;
    this.index = index;
    this.children = formChildrenArray(lhs, index);
    this.resultantType = new GomPrimitiveTypeOrAlias("void");
  }
}

export class NodeTupleLiteral extends AbstractNode {
  type: NodeType;
  elements: NodeExpr[];
  children: Node[];
  gomType: GomType;
  resultantType: GomType;

  constructor({ elements, loc }: { elements: NodeExpr[]; loc: number }) {
    super();
    this.type = NodeType.TUPLE_LITERAL;
    this.loc = loc;
    this.elements = elements;
    this.children = elements;
    this.gomType = new GomTupleType(
      elements.map((elements) => elements.resultantType)
    );
    this.resultantType = this.gomType;
  }
}

export class NodeTerm extends AbstractNode {
  type: NodeType;
  token: Token;
  children: Node[];
  gomType: GomType;
  resultantType: GomType;

  constructor(token: Token) {
    super();
    this.type = NodeType.TERM;
    this.loc = token.start;
    this.token = token;
    this.children = [];
    this.resultantType = this.gomType = this.getGomType();
  }

  private getGomType() {
    if (this.token.type === GomToken.IDENTIFIER) {
      return new GomPrimitiveTypeOrAlias(`resolve_type@@${this.token.value}`);
    } else if (this.token.type === GomToken.NUMLITERAL) {
      return new GomPrimitiveTypeOrAlias("int");
    } else if (this.token.type === GomToken.STRLITERAL) {
      return new GomPrimitiveTypeOrAlias("str");
    } else if (
      this.token.type === GomToken.TRUE ||
      this.token.type === GomToken.FALSE
    ) {
      return new GomPrimitiveTypeOrAlias("bool");
    } else if (this.token.type === GomToken.BUILT_IN_TYPE) {
      return new GomPrimitiveTypeOrAlias(this.token.value);
    }

    throw new Error(`Cannot determine type for token: ${this.token.type}`);
  }
}
