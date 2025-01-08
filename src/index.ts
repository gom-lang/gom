import { readFile, writeFile } from "fs/promises";
import { Lexer } from "./lexer";
import { RecursiveDescentParser } from "./parser/rd";
import { SemanticAnalyzer } from "./semantics";
import { CodeGenerator } from "./codegen";
import { GomErrorManager } from "./util/error";

export default async (src: string) => {
  const entry = await readFile(src, "utf-8");
  const errorManager = new GomErrorManager(entry);
  console.time("Compiled in");
  const lexer = new Lexer(entry, errorManager);

  const parser = new RecursiveDescentParser(lexer);

  const program = parser.parse();

  console.log("Parsed program", program);

  const semanticAnalyzer = new SemanticAnalyzer(program, errorManager);
  semanticAnalyzer.analyze();

  // const codeGeneratoe = new CodeGenerator(
  //   program,
  //   semanticAnalyzer.scopeManager
  // );
  // codeGeneratoe.generate();

  console.timeEnd("Compiled in");

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
