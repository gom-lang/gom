import llvm from "llvm-bindings";
import {
  NodeExpr,
  NodeFunctionDefinition,
  NodeGomTypeId,
  NodeTerm,
  NodeTypeDefinition,
} from "../parser/rd/nodes";
import { GomInternalError, SyntaxError } from "../util/error";
import {
  GomPrimitiveTypeOrAlias,
  GomPrimitiveTypeOrAliasValue,
  GomType,
} from "../types";
import { GOM_BUILT_IN_TYPES, GomToken } from "../lexer/tokens";

class SymbolTableNode<T> {
  private children: SymbolTableNode<T>[] = [];

  constructor(
    private name: string,
    private value: T,
    private parent?: SymbolTableNode<T>,
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
  gomType: GomType;

  constructor(name: string, node: NodeTypeDefinition) {
    this.name = name;
    this.node = node;
    this.gomType = this.makeGomType();
  }

  private makeGomType() {
    return this.node.rhs.gomType;
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
  allocaInst?: llvm.AllocaInst;

  constructor(
    name: string,
    node: NodeTerm | NodeFunctionDefinition,
    type: GomType,
    valueExpr?: NodeExpr,
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
      throw new SyntaxError({
        message: `Block-scoped value "${name}" already declared: Name: ${name}, Value: ${existingEntry.getValue()}`,
        loc: [1, node.loc],
      });
    }
    this.entries.types[name] = new TypeEntry(name, node);
  }

  putIdentifier(
    name: string,
    node: NodeTerm | NodeFunctionDefinition,
    type: GomType,
    valueExpr?: NodeExpr,
  ) {
    const existingEntry =
      this.entries.types[name] ?? this.entries.identifiers[name];
    if (existingEntry) {
      throw new SyntaxError({
        message: `Block-scoped value "${name}" already declared: Name: ${name}, Value: ${existingEntry.getValue()}`,
        loc: [1, node.loc],
      });
    }

    this.entries.identifiers[name] = new IdentifierEntry(
      name,
      node,
      type,
      valueExpr,
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
      entry.isFunction(),
    );
  }
}

export class ScopeManager {
  private currentSymbolTableNode: SymbolTableNode<Scope>;
  private primitiveTypes: Record<GomPrimitiveTypeOrAliasValue, TypeEntry> = {};

  constructor() {
    this.currentSymbolTableNode = new SymbolTableNode("root", new Scope());
    this.setPrimitiveTypes();
  }

  private setPrimitiveTypes() {
    GOM_BUILT_IN_TYPES.forEach((type) => {
      const rhs = new NodeGomTypeId({
        id: new NodeTerm({
          value: type,
          start: 0,
          end: 0,
          type: GomToken.BUILT_IN_TYPE,
        }),
        loc: 0,
      });
      rhs.gomType = new GomPrimitiveTypeOrAlias(type);
      const fakeNode = new NodeTypeDefinition({
        name: new NodeTerm({
          value: type,
          start: 0,
          end: 0,
          type: GomToken.BUILT_IN_TYPE,
        }),
        rhs,
        loc: 0,
      });
      this.primitiveTypes[type] = new TypeEntry(type, fakeNode);
    });
  }

  beginScope(name: string) {
    const newSymbolTable = new SymbolTableNode(
      name,
      new Scope(),
      this.currentSymbolTableNode,
    );
    this.currentSymbolTableNode.addChild(newSymbolTable);
    this.currentSymbolTableNode = newSymbolTable;
  }

  endScope() {
    const parent = this.currentSymbolTableNode.getParent();
    if (parent) {
      this.currentSymbolTableNode = parent;
    } else {
      throw new GomInternalError({
        message: "Cannot end root scope",
      });
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
    valueExpr?: NodeExpr,
  ) {
    this.getCurrentScope().putIdentifier(name, node, type, valueExpr);
  }

  getIdentifier(name: string) {
    return this.getCurrentScope().getIdentifier(name);
  }

  getType(name: string) {
    if (this.primitiveTypes[name]) {
      return this.primitiveTypes[name];
    }
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

  getScopeName() {
    return this.currentSymbolTable.getName();
  }

  private lookupInScopeChain<T>(
    lookupFn: (scope: Scope) => T | null | undefined,
  ): T | null {
    let current: SymbolTableNode<Scope> | undefined = this.currentSymbolTable;
    while (current) {
      const entry = lookupFn(current.getValue());
      if (entry) return entry;
      current = current.getParent();
    }
    return null;
  }

  getIdentifier(name: string) {
    return this.lookupInScopeChain((scope) => scope.getIdentifier(name));
  }

  getType(name: string) {
    return this.lookupInScopeChain((scope) => scope.getType(name));
  }

  getFunction(name: string) {
    return this.lookupInScopeChain((scope) => scope.getFunction(name));
  }

  enterScope(name: string) {
    const child = this.currentSymbolTable
      .getChildren()
      .find((child) => child.getName() === name);

    if (child) {
      this.currentSymbolTable = child;
    } else {
      throw new GomInternalError({
        message: `Scope ${name} not found. Available scopes: ${this.currentSymbolTable
          .getChildren()
          .map((child) => child.getName())
          .join(", ")}`,
      });
    }
  }

  exitScope() {
    const parent = this.currentSymbolTable.getParent();
    if (parent) {
      this.currentSymbolTable = parent;
    } else {
      throw new GomInternalError({
        message: `Cannot exit root scope`,
      });
    }
  }

  getAllInScopeChain(
    lookupFn: (scope: Scope) => (IdentifierEntry | TypeEntry)[],
    recursive = false,
  ): (IdentifierEntry | TypeEntry)[] {
    if (!recursive) {
      return lookupFn(this.currentSymbolTable.getValue());
    }
    const entries: (IdentifierEntry | TypeEntry)[] = [],
      seen = new Set<string>();
    let currentSymbolTable = this.currentSymbolTable;
    while (currentSymbolTable) {
      lookupFn(currentSymbolTable.getValue()).forEach((entry) => {
        if (!seen.has(entry.name)) {
          seen.add(entry.name);
          entries.push(entry);
        }
      });
      const parent = currentSymbolTable.getParent();
      if (parent) {
        currentSymbolTable = parent;
      } else {
        break;
      }
    }
    return entries;
  }

  getAllIdentifiers(recursive = false) {
    return this.getAllInScopeChain(
      (scope) => scope.getAllIdentifiers(),
      recursive,
    ) as IdentifierEntry[];
  }

  getAllTypes(recursive = false) {
    return this.getAllInScopeChain(
      (scope): TypeEntry[] => scope.getAllTypes(),
      recursive,
    ) as TypeEntry[];
  }

  getAllFunctions(recursive = false) {
    return this.getAllInScopeChain(
      (scope) => scope.getAllFunctions(),
      recursive,
    ) as IdentifierEntry[];
  }
}
