export class SyntaxError extends Error {
  constructor({ loc, message }: { loc: [number, number]; message: string }) {
    super(`SyntaxError at ${loc.join(":")}: ${message}`);
  }
}

export class TypeError extends Error {
  constructor({ message, loc }: { message: string; loc: [number, number] }) {
    super(`TypeError at ${loc.join(":")}: ${message}`);
    this.name = "GomTypeError";
  }
}

export class GomInternalError extends Error {
  constructor({ message }: { message: string }) {
    super(`GomInternalError: ${message}`);
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
    return `${line} | ${errorLine}\n${" ".repeat(column)}^`;
  }

  throwSyntaxError({ loc, message }: { loc: number; message: string }): never {
    const { line, column } = this.getLineAndColumn(loc);
    throw new SyntaxError({ loc: [line, column], message });
  }

  throwTypeError({ loc, message }: { loc: number; message: string }): never {
    const { line, column } = this.getLineAndColumn(loc);
    throw new TypeError({ loc: [line, column], message });
  }

  throwInternalError(message: string): never {
    throw new GomInternalError({ message });
  }

  throwCodegenError({ loc, message }: { loc: number; message: string }): never {
    const { line, column } = this.getLineAndColumn(loc);
    throw new Error(`CodegenError at ${line}:${column}: ${message}`);
  }
}
