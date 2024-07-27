import {
  NodeFunctionDefinition,
  NodeTerm,
  NodeTypeDefinition,
} from "../parser/rd/nodes";
import { GomPrimitiveTypeOrAlias, GomType } from "./type";

class Stack<T> {
  private stack: T[] = [];
  push(value: T) {
    this.stack.push(value);
  }
  pop() {
    return this.stack.pop();
  }
  peek() {
    return this.stack[this.stack.length - 1];
  }
}

type AllowedNodeTypes = NodeFunctionDefinition | NodeTerm | NodeTypeDefinition;

class TypeEntry {
  name: string;
  node: NodeTypeDefinition;
  gomType: GomPrimitiveTypeOrAlias;

  constructor(name: string, node: NodeTypeDefinition) {
    this.name = name;
    this.node = node;
    this.gomType = new GomPrimitiveTypeOrAlias(node.rhs.value);
  }

  getValue() {
    return this.name;
  }
}

class IdentifierEntry {
  name: string;
  node: NodeTerm | NodeFunctionDefinition;
  type: GomType;

  constructor(
    name: string,
    node: NodeTerm | NodeFunctionDefinition,
    type: GomType
  ) {
    this.name = name;
    this.node = node;
    this.type = type;
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
    type: GomType
  ) {
    const existingEntry =
      this.entries.types[name] ?? this.entries.identifiers[name];
    if (existingEntry) {
      throw new SyntaxError(
        `Block-scoped value "${name}" already declared: Name: ${name}, Value: ${existingEntry.getValue()}`
      );
    }
    this.entries.identifiers[name] = new IdentifierEntry(name, node, type);
  }

  getIdentifier(name: string) {
    return this.entries.identifiers[name];
  }

  hasIdentifier(name: string): boolean {
    return this.entries.identifiers[name] !== undefined;
  }

  getType(name: string) {
    return this.entries.types[name];
  }
}

export class ScopeManager {
  private stack: Stack<Scope> = new Stack();

  constructor() {
    this.stack.push(new Scope());
  }

  beginScope() {
    this.stack.push(new Scope(this.stack.peek()));
  }

  endScope() {
    this.stack.pop();
  }

  putType(name: string, node: NodeTypeDefinition) {
    this.stack.peek().putType(name, node);
  }

  putIdentifier(
    name: string,
    node: NodeTerm | NodeFunctionDefinition,
    type: GomType
  ) {
    this.stack.peek().putIdentifier(name, node, type);
  }

  getIdentifier(name: string) {
    return this.stack.peek().getIdentifier(name);
  }

  getType(name: string) {
    return this.stack.peek().getType(name);
  }
}
