export class SyntaxError extends Error {
  constructor({ start, message }: { start: number; message: string }) {
    super(`Syntax Error at ${start}: ${message}`);
  }
}
