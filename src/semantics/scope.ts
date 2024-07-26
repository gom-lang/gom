import {
  NodeFunctionDefinition,
  NodeTerm,
  NodeTypeDefinition,
} from "../parser/rd/nodes";
import { Node } from "../parser/rd/tree";

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
type ScopeBaseEntry = TypeEntry | IdentifierEntry;

class TypeEntry {
  name: string;
  node: NodeTypeDefinition;

  constructor(name: string, node: NodeTypeDefinition) {
    this.name = name;
    this.node = node;
  }

  getValue() {}
}

class IdentifierEntry {
  name: string;
  node: NodeTerm | NodeFunctionDefinition;

  constructor(name: string, node: NodeTerm | NodeFunctionDefinition) {
    this.name = name;
    this.node = node;
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

export class Scope {
  private entries: Map<string, Stack<AllowedNodeTypes>> = new Map();

  constructor(parent?: Scope) {
    if (parent) {
      this.entries = new Map(parent.entries);
    }
  }

  put(name: string, value: AllowedNodeTypes) {
    if (!this.entries.has(name)) {
      this.entries.set(name, new Stack());
    }

    this.entries.get(name)!.push(value);
  }

  get(name: string) {
    return this.entries.get(name)?.peek();
  }

  has(name: string): boolean {
    return this.entries.has(name);
  }
}

export class ScopeManager {
  private stack: Stack<Scope> = new Stack();
  private baseEntries: Map<string, ScopeBaseEntry> = new Map();

  constructor() {
    this.stack.push(new Scope());
  }

  beginScope() {
    this.stack.push(new Scope(this.stack.peek()));
  }

  endScope() {
    this.stack.pop();
  }

  put(name: string, value: AllowedNodeTypes) {
    if (!this.stack.peek().has(name)) {
      this.baseEntries.set(
        name,
        value instanceof NodeTypeDefinition
          ? new TypeEntry(name, value)
          : new IdentifierEntry(name, value)
      );
    }
    this.stack.peek().put(name, value);
  }

  get(name: string) {
    return this.stack.peek().get(name);
  }
}
