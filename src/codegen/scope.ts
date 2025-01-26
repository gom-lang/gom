import { LLVMType } from "./llvm";
import { NodeTerm } from "../parser/rd/nodes";

class Scope {
  name: string;
  parent: Scope | null = null;
  children: Scope[] = [];
  symbolTable: Record<
    string,
    {
      term: NodeTerm;
      varName: string;
      llvmType: LLVMType;
    }
  > = {};

  constructor(name: string, parent: Scope | null = null) {
    this.name = name;
    this.parent = parent;
  }

  putVar(term: NodeTerm, varName: string, llvmType: LLVMType) {
    this.symbolTable[term.token.value] = { term, varName, llvmType };
  }

  getVar(term: NodeTerm): string | null {
    const variable = this.symbolTable[term.token.value];
    if (variable) {
      return variable.varName;
    }

    if (this.parent) {
      return this.parent.getVar(term);
    }

    return null;
  }
}

export class IRScopeManager {
  private currentScope: Scope;

  constructor() {
    this.currentScope = new Scope("global");
  }

  enterScope(name: string) {
    const newScope = new Scope(name, this.currentScope);
    this.currentScope.children.push(newScope);
    this.currentScope = newScope;
  }

  exitScope() {
    if (this.currentScope.parent) {
      this.currentScope = this.currentScope.parent;
    }
  }

  putVar(term: NodeTerm, varName: string, llvmType: LLVMType) {
    this.currentScope.putVar(term, varName, llvmType);
  }

  getVar(term: NodeTerm): string | null {
    return this.currentScope.getVar(term);
  }
}
