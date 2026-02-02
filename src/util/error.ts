import chalk from "chalk";

export abstract class GomError {
  name: string = "GomError";
  message: string = "";

  print() {
    console.error(this.message);
  }
}

export class SyntaxError extends GomError {
  constructor({ loc, message }: { loc: [number, number]; message: string }) {
    super();
    this.message =
      chalk.bold(chalk.red(`SyntaxError at ${loc.join(":")}`)) + `: ${message}`;
    this.name = "GomSyntaxError";
  }
}

export class TypeError extends GomError {
  constructor({ message, loc }: { message: string; loc: [number, number] }) {
    super();
    this.message =
      chalk.bold(chalk.red(`TypeError at ${loc.join(":")}`)) + `: ${message}`;
    this.name = "GomTypeError";
  }
}

export class GomInternalError extends GomError {
  constructor({ message }: { message: string }) {
    super();
    this.message = chalk.bold(chalk.red(`GomInternalError`)) + `: ${message}`;
    this.name = "GomInternalError";
  }
}

export class GomErrorManager {
  src: string;
  constructor(src: string) {
    this.src = src;
  }

  private getLineAndColumn(loc: number): { line: number; column: number } {
    let line = 1;
    let column = 1;
    for (let i = 0; i < loc; i++) {
      if (this.src[i] === "\n") {
        line++;
        column = 1;
      } else {
        column++;
      }
    }
    return { line, column };
  }

  private getErrorSrcMessage(loc: number): string {
    const { line, column } = this.getLineAndColumn(loc);
    const lines = this.src.split("\n");
    const errorLine = lines[line - 1];
    const lineNum = line.toString().padStart(4, " ");
    const caretPadding = " ".repeat(lineNum.length + 2 + column - 1);
    return `\n${lineNum} | ${errorLine.trim()}\n${caretPadding}↑`;
  }

  throwSyntaxError({ loc, message }: { loc: number; message: string }): never {
    const { line, column } = this.getLineAndColumn(loc);
    throw new SyntaxError({
      loc: [line, column],
      message: `${message}\n${this.getErrorSrcMessage(loc)}`,
    });
  }

  throwTypeError({ loc, message }: { loc: number; message: string }): never {
    const { line, column } = this.getLineAndColumn(loc);
    throw new TypeError({
      loc: [line, column],
      message: `${message}\n${this.getErrorSrcMessage(loc)}`,
    });
  }

  throwInternalError(message: string): never {
    throw new GomInternalError({ message });
  }

  throwCodegenError({ loc, message }: { loc: number; message: string }): never {
    const { line, column } = this.getLineAndColumn(loc);
    throw new Error(`CodegenError at ${line}:${column}: ${message}`);
  }
}
