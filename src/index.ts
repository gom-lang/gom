import { readFile } from "fs/promises";
import { Lexer } from "./lexer";
import { GomToken } from "./lexer/tokens";

export default async (src: string) => {
  const entry = await readFile(src, "utf-8");
  console.time("Compiled in");
  const lexer = new Lexer(entry);

  let token = lexer.nextToken();
  while (token.type !== GomToken.EOF) {
    console.log(token);
    token = lexer.nextToken();
  }

  console.timeEnd("Compiled in");
};
