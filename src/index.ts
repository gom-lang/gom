const SegfaultHandler = require("segfault-handler");
SegfaultHandler.registerHandler("crash.log");
import { readFile, writeFile } from "node:fs/promises";
import { Lexer } from "./lexer";
import { RecursiveDescentParser } from "./parser/rd";
import { SemanticAnalyzer } from "./semantics";
import { CodeGenerator as LLVMCodeGenerator } from "./codegen/llvm";
import { GomError, GomErrorManager } from "./util/error";
import { TypeAttacher } from "./types/type-attacher";
import { logBlue, logGreen } from "./util/console";
import { NodeProgram } from "./parser/rd/nodes";

export type CodegenTarget = "llvm";

export const compile = async (
  srcPath: string,
  src: string,
  target: CodegenTarget = "llvm",
) => {
  const errorManager = new GomErrorManager(src);
  let program: NodeProgram | null = null;
  const startTime = performance.now();
  try {
    const lexer = new Lexer(src, errorManager);

    const parser = new RecursiveDescentParser(lexer);

    program = parser.parse();

    new TypeAttacher().visit(program);

    const semanticAnalyzer = new SemanticAnalyzer(program, errorManager);
    semanticAnalyzer.analyze();

    const codeGenerator = new LLVMCodeGenerator({
      ast: program,
      scopeManager: semanticAnalyzer.scopeManager,
      errorManager,
      outputPath: srcPath.replace(".gom", ".ll"),
    });

    codeGenerator.generateAndWriteFile();
  } catch (e) {
    if (e instanceof GomError) {
      e.print();
      process.exit(1);
    }

    console.error("Unexpected error during compilation:", e);
    process.exit(1);
  }

  logGreen(`Compiled to ${srcPath.replace(".gom", ".ll")}`);

  const endTime = performance.now();
  logBlue(`Compilation took ${(endTime - startTime).toFixed(2)} ms`);

  await writeFile(
    "tree.json",
    JSON.stringify(
      program,
      (key, val) => {
        if (key === "children") {
          return undefined;
        }
        return val;
      },
      2,
    ),
    "utf-8",
  );
};

export const compileAndReturn = async (
  src: string,
  target: CodegenTarget = "llvm",
) => {
  const errorManager = new GomErrorManager(src);
  const lexer = new Lexer(src, errorManager);

  const parser = new RecursiveDescentParser(lexer);

  const program = parser.parse();

  const semanticAnalyzer = new SemanticAnalyzer(program, errorManager);
  semanticAnalyzer.analyze();

  const codeGenerator = new LLVMCodeGenerator({
    ast: program,
    scopeManager: semanticAnalyzer.scopeManager,
    errorManager,
    outputPath: "out.ll",
  });
  return codeGenerator.generate();
};

export const runCompile = async (
  srcPath: string,
  target: CodegenTarget = "llvm",
) => {
  const src = await readFile(srcPath, "utf-8");
  await compile(srcPath, src, target);
};
