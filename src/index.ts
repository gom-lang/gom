import { readFile, writeFile } from "fs/promises";
import { Lexer } from "./lexer";
import { RecursiveDescentParser } from "./parser/rd";
import { SemanticAnalyzer } from "./semantics";
import { CodeGenerator } from "./codegen";

export default async (src: string) => {
  const entry = await readFile(src, "utf-8");
  console.time("Compiled in");
  const lexer = new Lexer(entry);

  const parser = new RecursiveDescentParser(lexer);

  const program = parser.parse();

  const semanticAnalyzer = new SemanticAnalyzer(program);
  semanticAnalyzer.analyze();

  const codeGeneratoe = new CodeGenerator(
    program,
    semanticAnalyzer.scopeManager
  );
  codeGeneratoe.generate();

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
