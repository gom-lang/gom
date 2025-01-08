import { describe, expect, test } from "vitest";
import { Lexer } from "../index";
import { GomToken } from "../tokens";
import { GomErrorManager } from "../../util/error";

const errorManager = new GomErrorManager("test");

describe("Lexer", () => {
  test("returns correct tokens", () => {
    const lexer = new Lexer("1 + 2", errorManager);

    expect(lexer.nextToken()).toMatchObject({
      type: GomToken.NUMLITERAL,
      value: "1",
      start: 0,
      end: 0,
    });

    expect(lexer.nextToken()).toMatchObject({
      type: GomToken.PLUS,
      value: "+",
      start: 2,
      end: 2,
    });

    expect(lexer.nextToken()).toMatchObject({
      type: GomToken.NUMLITERAL,
      value: "2",
      start: 4,
      end: 4,
    });

    expect(lexer.nextToken()).toMatchObject({
      type: GomToken.EOF,
      value: "eof",
      start: 5,
      end: 5,
    });
  });

  test("ignores whitespace", () => {
    const lexer = new Lexer(" 1 + 2 ", errorManager);

    expect(lexer.nextToken()).toMatchObject({
      type: GomToken.NUMLITERAL,
      value: "1",
      start: 1,
      end: 1,
    });

    expect(lexer.nextToken()).toMatchObject({
      type: GomToken.PLUS,
      value: "+",
      start: 3,
      end: 3,
    });

    expect(lexer.nextToken()).toMatchObject({
      type: GomToken.NUMLITERAL,
      value: "2",
      start: 5,
      end: 5,
    });

    expect(lexer.nextToken()).toMatchObject({
      type: GomToken.EOF,
      value: "eof",
      start: 7,
      end: 7,
    });
  });

  test("returns correct tokens for multiple digits", () => {
    const lexer = new Lexer("123 + 456", errorManager);

    expect(lexer.nextToken()).toMatchObject({
      type: GomToken.NUMLITERAL,
      value: "123",
      start: 0,
      end: 2,
    });

    expect(lexer.nextToken()).toMatchObject({
      type: GomToken.PLUS,
      value: "+",
      start: 4,
      end: 4,
    });

    expect(lexer.nextToken()).toMatchObject({
      type: GomToken.NUMLITERAL,
      value: "456",
      start: 6,
      end: 8,
    });

    expect(lexer.nextToken()).toMatchObject({
      type: GomToken.EOF,
      value: "eof",
      start: 9,
      end: 9,
    });
  });

  test("returns correct tokens for strings", () => {
    const lexer = new Lexer('"hello" , "world"', errorManager);

    expect(lexer.nextToken()).toMatchObject({
      type: GomToken.STRLITERAL,
      value: '"hello"',
      start: 0,
      end: 6,
    });

    expect(lexer.nextToken()).toMatchObject({
      type: ",",
      value: ",",
      start: 8,
      end: 8,
    });

    expect(lexer.nextToken()).toMatchObject({
      type: GomToken.STRLITERAL,
      value: '"world"',
      start: 10,
      end: 16,
    });

    expect(lexer.nextToken()).toMatchObject({
      type: GomToken.EOF,
      value: "eof",
      start: 17,
      end: 17,
    });
  });

  test("returns correct tokens for identifiers", () => {
    const lexer = new Lexer("let x = 1", errorManager);

    expect(lexer.nextToken()).toMatchObject({
      type: GomToken.LET,
      value: "let",
      start: 0,
      end: 2,
    });

    expect(lexer.nextToken()).toMatchObject({
      type: GomToken.IDENTIFIER,
      value: "x",
      start: 4,
      end: 4,
    });

    expect(lexer.nextToken()).toMatchObject({
      type: GomToken.EQ,
      value: "=",
      start: 6,
      end: 6,
    });

    expect(lexer.nextToken()).toMatchObject({
      type: GomToken.NUMLITERAL,
      value: "1",
      start: 8,
      end: 8,
    });

    expect(lexer.nextToken()).toMatchObject({
      type: GomToken.EOF,
      value: "eof",
      start: 9,
      end: 9,
    });
  });

  test("returns correct tokens for keywords", () => {
    const lexer = new Lexer("import main", errorManager);

    expect(lexer.nextToken()).toMatchObject({
      type: GomToken.IMPORT,
      value: "import",
      start: 0,
      end: 5,
    });

    expect(lexer.nextToken()).toMatchObject({
      type: GomToken.MAIN,
      value: "main",
      start: 7,
      end: 10,
    });

    expect(lexer.nextToken()).toMatchObject({
      type: GomToken.EOF,
      value: "eof",
      start: 11,
      end: 11,
    });
  });

  test("returns correct tokens for primitive types", () => {
    const lexer = new Lexer("i8 bool f32 str", errorManager);

    expect(lexer.nextToken()).toMatchObject({
      type: GomToken.BUILT_IN_TYPE,
      value: "i8",
      start: 0,
      end: 1,
    });

    expect(lexer.nextToken()).toMatchObject({
      type: GomToken.BUILT_IN_TYPE,
      value: "bool",
      start: 3,
      end: 6,
    });

    expect(lexer.nextToken()).toMatchObject({
      type: GomToken.BUILT_IN_TYPE,
      value: "f32",
      start: 8,
      end: 10,
    });

    expect(lexer.nextToken()).toMatchObject({
      type: GomToken.BUILT_IN_TYPE,
      value: "str",
      start: 12,
      end: 14,
    });

    expect(lexer.nextToken()).toMatchObject({
      type: GomToken.EOF,
      value: "eof",
      start: 15,
      end: 15,
    });
  });

  test("returns correct tokens for operators", () => {
    const lexer = new Lexer("+-*/", errorManager);

    expect(lexer.nextToken()).toMatchObject({
      type: GomToken.PLUS,
      value: "+",
      start: 0,
      end: 0,
    });

    expect(lexer.nextToken()).toMatchObject({
      type: GomToken.MINUS,
      value: "-",
      start: 1,
      end: 1,
    });

    expect(lexer.nextToken()).toMatchObject({
      type: GomToken.MUL,
      value: "*",
      start: 2,
      end: 2,
    });

    expect(lexer.nextToken()).toMatchObject({
      type: GomToken.DIV,
      value: "/",
      start: 3,
      end: 3,
    });

    expect(lexer.nextToken()).toMatchObject({
      type: GomToken.EOF,
      value: "eof",
      start: 4,
      end: 4,
    });
  });

  test("returns correct tokens for parentheses", () => {
    const lexer = new Lexer("()", errorManager);

    expect(lexer.nextToken()).toMatchObject({
      type: GomToken.LPAREN,
      value: "(",
      start: 0,
      end: 0,
    });

    expect(lexer.nextToken()).toMatchObject({
      type: GomToken.RPAREN,
      value: ")",
      start: 1,
      end: 1,
    });

    expect(lexer.nextToken()).toMatchObject({
      type: GomToken.EOF,
      value: "eof",
      start: 2,
      end: 2,
    });
  });

  test("returns correct tokens for braces", () => {
    const lexer = new Lexer("{}", errorManager);

    expect(lexer.nextToken()).toMatchObject({
      type: GomToken.LBRACE,
      value: "{",
      start: 0,
      end: 0,
    });

    expect(lexer.nextToken()).toMatchObject({
      type: GomToken.RBRACE,
      value: "}",
      start: 1,
      end: 1,
    });

    expect(lexer.nextToken()).toMatchObject({
      type: GomToken.EOF,
      value: "eof",
      start: 2,
      end: 2,
    });
  });

  test("returns correct tokens for comparison operators", () => {
    const lexer = new Lexer("== >= <= > <", errorManager);

    expect(lexer.nextToken()).toMatchObject({
      type: GomToken.EQEQ,
      value: "==",
      start: 0,
      end: 1,
    });

    expect(lexer.nextToken()).toMatchObject({
      type: GomToken.GTE,
      value: ">=",
      start: 3,
      end: 4,
    });

    expect(lexer.nextToken()).toMatchObject({
      type: GomToken.LTE,
      value: "<=",
      start: 6,
      end: 7,
    });

    expect(lexer.nextToken()).toMatchObject({
      type: GomToken.GT,
      value: ">",
      start: 9,
      end: 9,
    });

    expect(lexer.nextToken()).toMatchObject({
      type: GomToken.LT,
      value: "<",
      start: 11,
      end: 11,
    });

    expect(lexer.nextToken()).toMatchObject({
      type: GomToken.EOF,
      value: "eof",
      start: 12,
      end: 12,
    });
  });

  test("returns correct tokens for symbols", () => {
    const lexer = new Lexer(", .", errorManager);

    expect(lexer.nextToken()).toMatchObject({
      type: ",",
      value: ",",
      start: 0,
      end: 0,
    });

    expect(lexer.nextToken()).toMatchObject({
      type: ".",
      value: ".",
      start: 2,
      end: 2,
    });

    expect(lexer.nextToken()).toMatchObject({
      type: GomToken.EOF,
      value: "eof",
      start: 3,
      end: 3,
    });
  });

  test.skip("throws error for invalid tokens", () => {
    const lexer = new Lexer("1 % 2", errorManager);

    expect(() => lexer.nextToken()).toThrowError(
      "Syntax Error at 2: Unidentified character '%'"
    );

    const lexer2 = new Lexer("1abcs", errorManager);

    expect(() => lexer2.nextToken()).toThrowError(
      "Syntax Error at 1: Identifier can only start with a character matching [A-Za-z_]: 1a"
    );
  });
});
