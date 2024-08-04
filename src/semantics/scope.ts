import {
  NodeExpr,
  NodeFunctionDefinition,
  NodeGomTypeStruct,
  NodeTerm,
  NodeTypeDefinition,
} from "../parser/rd/nodes";
import {
  GomArrayType,
  GomPrimitiveTypeOrAlias,
  GomStructType,
  GomType,
} from "./type";

class SymbolTableNode<T> {
  private children: SymbolTableNode<T>[] = [];

  constructor(
    private name: string,
    private value: T,
    private parent?: SymbolTableNode<T>
  ) {}

  addChild(value: SymbolTableNode<T>) {
    this.children.push(value);
  }

  getValue() {
    return this.value;
  }

  getParent() {
    return this.parent;
  }

  getChildren() {
    return this.children;
  }

  getName() {
    return this.name;
  }
}

class TypeEntry {
  name: string;
  node: NodeTypeDefinition;
  gomType: GomPrimitiveTypeOrAlias | GomStructType;

  constructor(name: string, node: NodeTypeDefinition) {
    this.name = name;
    this.node = node;
    this.gomType =
      node.rhs instanceof NodeGomTypeStruct
        ? new GomStructType(
            node.rhs.fields.reduce((acc, field) => {
              const arrSize = field.fieldType.arrSize;
              if (arrSize) {
                acc[field.name.value] = new GomArrayType(
                  new GomPrimitiveTypeOrAlias(field.fieldType.id.value),
                  Number(arrSize.value)
                );
              } else {
                acc[field.name.value] = new GomPrimitiveTypeOrAlias(
                  field.fieldType.id.value
                );
              }
              return acc;
            }, {} as Record<string, GomType>)
          )
        : new GomPrimitiveTypeOrAlias(node.name.value);
  }

  getValue() {
    return this.name;
  }
}

class IdentifierEntry {
  name: string;
  node: NodeTerm | NodeFunctionDefinition;
  type: GomType;
  valueExpr?: NodeExpr;

  constructor(
    name: string,
    node: NodeTerm | NodeFunctionDefinition,
    type: GomType,
    valueExpr?: NodeExpr
  ) {
    this.name = name;
    this.node = node;
    this.type = type;
    this.valueExpr = valueExpr;
  }

  isFunction() {
    return this.node instanceof NodeFunctionDefinition;
  }

  getValue() {
    if (this.node instanceof NodeTerm) {
      return this.node.token.value;
    } else {
      return this.node;
    }
  }
}

interface StackEntries {
  types: Record<string, TypeEntry>;
  identifiers: Record<string, IdentifierEntry>;
}

export class Scope {
  private entries: StackEntries = {
    types: {},
    identifiers: {},
  };

  constructor(parent?: Scope) {
    if (parent) {
      this.entries = structuredClone(parent.entries);
    }
  }

  putType(name: string, node: NodeTypeDefinition) {
    const existingEntry =
      this.entries.types[name] ?? this.entries.identifiers[name];
    if (existingEntry) {
      throw new SyntaxError(
        `Block-scoped value "${name}" already declared: Name: ${name}, Value: ${existingEntry.getValue()}`
      );
    }
    this.entries.types[name] = new TypeEntry(name, node);
  }

  putIdentifier(
    name: string,
    node: NodeTerm | NodeFunctionDefinition,
    type: GomType,
    valueExpr?: NodeExpr
  ) {
    const existingEntry =
      this.entries.types[name] ?? this.entries.identifiers[name];
    if (existingEntry) {
      throw new SyntaxError(
        `Block-scoped value "${name}" already declared: Name: ${name}, Value: ${existingEntry.getValue()}`
      );
    }

    this.entries.identifiers[name] = new IdentifierEntry(
      name,
      node,
      type,
      valueExpr
    );
  }

  getIdentifier(name: string) {
    return this.entries.identifiers[name];
  }

  getAllIdentifiers() {
    return Object.values(this.entries.identifiers);
  }

  hasIdentifier(name: string): boolean {
    return this.entries.identifiers[name] !== undefined;
  }

  getType(name: string) {
    return this.entries.types[name];
  }

  getAllTypes() {
    return Object.values(this.entries.types);
  }

  getFunction(name: string) {
    const entry = this.getIdentifier(name);
    if (entry && entry.isFunction()) {
      return entry;
    }
    return null;
  }

  getAllFunctions() {
    return Object.values(this.entries.identifiers).filter((entry) =>
      entry.isFunction()
    );
  }
}

export class ScopeManager {
  private currentSymbolTableNode: SymbolTableNode<Scope>;

  constructor() {
    this.currentSymbolTableNode = new SymbolTableNode("root", new Scope());
  }

  beginScope(name: string) {
    const newSymbolTable = new SymbolTableNode(
      name,
      new Scope(),
      this.currentSymbolTableNode
    );
    this.currentSymbolTableNode.addChild(newSymbolTable);
    this.currentSymbolTableNode = newSymbolTable;
  }

  endScope() {
    const parent = this.currentSymbolTableNode.getParent();
    if (parent) {
      this.currentSymbolTableNode = parent;
    } else {
      throw new Error("SemanticError: Cannot end root scope");
    }
  }

  getCurrentScope() {
    return this.currentSymbolTableNode.getValue();
  }

  getCurrentSymbolTableNode() {
    return this.currentSymbolTableNode;
  }

  putType(name: string, node: NodeTypeDefinition) {
    this.getCurrentScope().putType(name, node);
  }

  putIdentifier(
    name: string,
    node: NodeTerm | NodeFunctionDefinition,
    type: GomType,
    valueExpr?: NodeExpr
  ) {
    this.getCurrentScope().putIdentifier(name, node, type, valueExpr);
  }

  getIdentifier(name: string) {
    return this.getCurrentScope().getIdentifier(name);
  }

  getType(name: string) {
    return this.getCurrentScope().getType(name);
  }

  getFunction(name: string) {
    return this.getCurrentScope().getFunction(name);
  }
}

export class SymbolTableReader {
  private currentSymbolTable: SymbolTableNode<Scope>;

  constructor(rootSymbolTable: SymbolTableNode<Scope>) {
    this.currentSymbolTable = rootSymbolTable;
  }

  getIdentifier(name: string) {
    let currentSymbolTable = this.currentSymbolTable;
    while (currentSymbolTable) {
      const entry = currentSymbolTable.getValue().getIdentifier(name);
      if (entry) {
        return entry;
      }
      currentSymbolTable = currentSymbolTable.getChildren()[0];
    }
    return null;
  }

  getType(name: string) {
    let currentSymbolTable = this.currentSymbolTable;
    while (currentSymbolTable) {
      const entry = currentSymbolTable.getValue().getType(name);
      if (entry) {
        return entry;
      }
      currentSymbolTable = currentSymbolTable.getChildren()[0];
    }
    return null;
  }

  getFunction(name: string) {
    let currentSymbolTable = this.currentSymbolTable;
    while (currentSymbolTable) {
      const entry = currentSymbolTable.getValue().getFunction(name);
      if (entry) {
        return entry;
      }
      currentSymbolTable = currentSymbolTable.getChildren()[0];
    }
    return null;
  }

  enterScope(name: string) {
    const child = this.currentSymbolTable
      .getChildren()
      .find((child) => child.getName() === name);

    if (child) {
      this.currentSymbolTable = child;
    } else {
      throw new Error(`CodeGen: Scope "${name}" not found`);
    }
  }

  exitScope() {
    const parent = this.currentSymbolTable.getParent();
    if (parent) {
      this.currentSymbolTable = parent;
    } else {
      throw new Error("CodeGen: Cannot exit root scope");
    }
  }

  getAllIdentifiers() {
    return this.currentSymbolTable.getValue().getAllIdentifiers();
  }

  getAllTypes() {
    return this.currentSymbolTable.getValue().getAllTypes();
  }

  getAllFunctions() {
    return this.currentSymbolTable.getValue().getAllFunctions();
  }
}
