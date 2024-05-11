import { readFile } from "fs/promises";
import { Lexer } from "./lexer";
import { RecursiveDescentParser } from "./parser/rd";

export default async (src: string) => {
  const entry = await readFile(src, "utf-8");
  console.time("Compiled in");
  const lexer = new Lexer(entry);

  const parser = new RecursiveDescentParser(lexer);

  parser.parse();

  console.timeEnd("Compiled in");
};
