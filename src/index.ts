const SegfaultHandler = require("segfault-handler");
SegfaultHandler.registerHandler("crash.log");
import { readFile, writeFile } from "fs/promises";
import { Lexer } from "./lexer";
import { RecursiveDescentParser } from "./parser/rd";
import { SemanticAnalyzer } from "./semantics";
import { CodeGenerator as LLVMCodeGenerator } from "./codegen/llvm";
import { CodeGenerator as CCodeGenerator } from "./codegen/c";
import { GomErrorManager } from "./util/error";
import { execSync } from "child_process";

export const compile = async (
  srcPath: string,
  src: string,
  target: "llvm" | "c"
) => {
  const errorManager = new GomErrorManager(src);
  console.time("⏰ Compiled in");
  const lexer = new Lexer(src, errorManager);

  const parser = new RecursiveDescentParser(lexer);

  const program = parser.parse();

  // console.log("Parsed program", program);

  const semanticAnalyzer = new SemanticAnalyzer(program, errorManager);
  semanticAnalyzer.analyze();

  const codeGenerator =
    target === "llvm"
      ? new LLVMCodeGenerator({
          ast: program,
          scopeManager: semanticAnalyzer.scopeManager,
          errorManager,
          outputPath: srcPath.replace(".gom", ".ll"),
        })
      : new CCodeGenerator({
          ast: program,
          scopeManager: semanticAnalyzer.scopeManager,
          errorManager,
          outputPath: srcPath.replace(".gom", ".c"),
        });
  codeGenerator.generateAndWriteFile();

  if (target === "c") {
    // Compile the generated C code
    execSync(
      `clang -S -emit-llvm ${srcPath.replace(
        ".gom",
        ".c"
      )} -o ${srcPath.replace(".gom", ".ll")}`,
      { stdio: "inherit" }
    );
    execSync(
      `clang ${srcPath.replace(".gom", ".c")} -o ${srcPath.replace(
        ".gom",
        ""
      )}`,
      { stdio: "inherit" }
    );
    console.log(
      `✅ Compiled to out, run with ./${srcPath.replace(".gom", "")}`
    );
  } else {
    console.log(`✅ Compiled to ${srcPath.replace(".gom", ".ll")}`);
  }

  console.timeEnd("⏰ Compiled in");

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
      2
    ),
    "utf-8"
  );
};

export const compileAndReturn = async (
  src: string,
  target: "llvm" | "c" = "llvm"
) => {
  const errorManager = new GomErrorManager(src);
  const lexer = new Lexer(src, errorManager);

  const parser = new RecursiveDescentParser(lexer);

  const program = parser.parse();

  const semanticAnalyzer = new SemanticAnalyzer(program, errorManager);
  semanticAnalyzer.analyze();

  const codeGenerator =
    target === "llvm"
      ? new LLVMCodeGenerator({
          ast: program,
          scopeManager: semanticAnalyzer.scopeManager,
          errorManager,
          outputPath: "out.ll",
        })
      : new CCodeGenerator({
          ast: program,
          scopeManager: semanticAnalyzer.scopeManager,
          errorManager,
          outputPath: "out.c",
        });
  return codeGenerator.generate();
};

export const runCompile = async (srcPath: string, target: "llvm" | "c") => {
  const src = await readFile(srcPath, "utf-8");
  await compile(srcPath, src, target);
};
