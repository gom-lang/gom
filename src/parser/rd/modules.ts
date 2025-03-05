import { existsSync, readFileSync } from "fs";
import { RecursiveDescentParser } from ".";
import { Lexer } from "../../lexer";
import { GomErrorManager } from "../../util/error";
import {
  ExportableNode,
  NodeExportStatement,
  NodeFunctionDefinition,
  NodeLetStatement,
  NodeMainFunction,
  NodeProgram,
  NodeTypeDefinition,
} from "./nodes";
import { Node, NodeType } from "./tree";
import path from "path";
import { GomToken } from "../../lexer/tokens";

const GOM_MODULES_PATH = path.resolve(__dirname, "../../../gom_modules");

interface ModuleKey {
  name: string;
}

export class GomModule {
  key: ModuleKey;
  src: string;
  absolutePath: string;
  parsed: NodeProgram;
  errorManager: GomErrorManager;
  exports: Node[] = [];

  constructor(key: ModuleKey, errorManager: GomErrorManager) {
    this.key = key;
    this.errorManager = errorManager;
    this.absolutePath = this.getModulePath();
    this.src = this.getModuleSource();
    this.parsed = this.parseModule();
  }

  private static isPath(str: string) {
    return existsSync(str);
  }

  private getModulePath(): string {
    return !GomModule.isPath(this.key.name)
      ? `${GOM_MODULES_PATH}/${this.key.name}/index.gom`
      : path.isAbsolute(this.key.name)
      ? this.key.name
      : path.resolve(this.key.name);
  }

  private getModuleSource(): string {
    return readFileSync(this.absolutePath, "utf-8");
  }

  private parseModule(): NodeProgram {
    const lexer = new Lexer(this.src, this.errorManager);
    const parser = new ModuleParser(lexer);

    const program = parser.parse();

    return program;
  }

  getAllExports() {
    return this.parsed.exportStatements;
  }
}

export class ModuleParser extends RecursiveDescentParser {
  private exports: NodeExportStatement[] = [];

  override parseProgram() {
    const importDeclarations = this.parseZeroOrMore(
      this.parseImportDeclaration
    );
    const typeGlobalOrFunctionDefinitions = this.parseZeroOrMore(
      this.parseTypeGlobalOrFunctionDefinition
    );

    const exportStatements = this.parseZeroOrMore(this.parseExportStatement);

    return new NodeProgram({
      importDeclarations,
      typeDefinitions: typeGlobalOrFunctionDefinitions.filter(
        (def): def is NodeTypeDefinition =>
          def.type === NodeType.TYPE_DEFINITION
      ),
      globalVariables: typeGlobalOrFunctionDefinitions.filter(
        (def): def is NodeLetStatement => def.type === NodeType.LET_STATEMENT
      ),
      functionDeclarations: typeGlobalOrFunctionDefinitions.filter(
        (def): def is NodeFunctionDefinition =>
          def.type === NodeType.FUNCTION_DEFINITION
      ),
      exportStatements,
      mainFunction: new NodeMainFunction({ body: [], loc: 0 }),
    });
  }

  parseExportStatement() {
    const loc = this.token.start;
    this.match(GomToken.EXPORT);
    let exportNode: ExportableNode;
    if (this.peek(GomToken.FN)) {
      exportNode = this.parseFunctionDefinition();
    } else if (this.peek(GomToken.TYPE)) {
      exportNode = this.parseTypeDefinition();
    } else {
      exportNode = this.parseStatement() as NodeLetStatement;
    }

    const node = new NodeExportStatement({ exportedItem: exportNode, loc });
    this.exports.push(node);
    return node;
  }

  getExports() {
    return this.exports;
  }
}
