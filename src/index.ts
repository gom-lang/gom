import { readFile, writeFile } from "fs/promises";
import { Lexer } from "./lexer";
import { RecursiveDescentParser } from "./parser/rd";

export default async (src: string) => {
  const entry = await readFile(src, "utf-8");
  console.time("Compiled in");
  const lexer = new Lexer(entry);

  const parser = new RecursiveDescentParser(lexer);

  const program = parser.parse();
  console.timeEnd("Compiled in");

  await writeFile("tree.json", JSON.stringify(program, null, 2), "utf-8");
};
