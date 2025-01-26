import { SimpleVisitor } from "../parser/rd/visitor";
import { ScopeManager, SymbolTableReader } from "../semantics/scope";
import { IRScopeManager } from "./scope";
import { GomErrorManager } from "../util/error";
import { NodeProgram } from "../parser/rd/nodes";

/**
 * Abstract class for code generation
 */
export abstract class BaseCodeGenerator extends SimpleVisitor<void> {
  ast: NodeProgram;
  outputPath: string;
  errorManager: GomErrorManager;

  symbolTableReader: SymbolTableReader;
  irScopeManager: IRScopeManager = new IRScopeManager();

  constructor({
    ast,
    scopeManager,
    outputPath = "out.ll",
    errorManager,
  }: {
    ast: NodeProgram;
    scopeManager: ScopeManager;
    errorManager: GomErrorManager;
    outputPath?: string;
  }) {
    super();
    this.ast = ast;
    this.outputPath = outputPath;
    this.errorManager = errorManager;
    this.symbolTableReader = new SymbolTableReader(
      scopeManager.getCurrentSymbolTableNode()
    );
  }

  generate(): void {}
}
