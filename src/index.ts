import { readFile, writeFile } from "fs/promises";
import { Lexer } from "./lexer";
import { RecursiveDescentParser } from "./parser/rd";
import { SemanticAnalyzer } from "./semantics";
import { CodeGenerator as LLVMCodeGenerator } from "./codegen/llvm";
import { CodeGenerator as CCodeGenerator } from "./codegen/c";
import { GomErrorManager } from "./util/error";
import { execSync } from "child_process";

export default async (src: string, target: "llvm" | "c") => {
  const entry = await readFile(src, "utf-8");
  const errorManager = new GomErrorManager(entry);
  console.time("⏰ Compiled in");
  const lexer = new Lexer(entry, errorManager);

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
          outputPath: src.replace(".gom", ".ll"),
        })
      : new CCodeGenerator({
          ast: program,
          scopeManager: semanticAnalyzer.scopeManager,
          errorManager,
          outputPath: src.replace(".gom", ".c"),
        });
  codeGenerator.generate();

  if (target === "c") {
    // Compile the generated C code
    execSync(
      `clang -S -emit-llvm ${src.replace(".gom", ".c")} -o ${src.replace(
        ".gom",
        ".ll"
      )}`,
      { stdio: "inherit" }
    );
    execSync(
      `clang ${src.replace(".gom", ".c")} -o ${src.replace(".gom", "")}`,
      { stdio: "inherit" }
    );
    console.log(`✅ Compiled to out, run with ./${src.replace(".gom", "")}`);
  } else {
    console.log(`✅ Compiled to ${src.replace(".gom", ".ll")}`);
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
