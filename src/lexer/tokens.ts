export enum GomToken {
  // Keywords
  IMPORT = "import",
  TYPE = "type",
  FN = "fn",
  LET = "let",
  FOR = "for",
  RETURN = "return",
  IF = "if",
  ELSE = "else",
  MAIN = "main",

  // Primitive types
  I8 = "i8",
  I16 = "i16",
  F16 = "f16",
  STR = "str",

  // Symbols
  LPAREN = "(",
  RPAREN = ")",
  LBRACE = "{",
  RBRACE = "}",
  COLON = ":",
  SEMICOLON = ";",
  COMMA = ",",
  DOT = ".",
  EQ = "=",
  PLUS = "+",
  MINUS = "-",
  MUL = "*",
  DIV = "/",
  EXP = "^",
  GT = ">",
  LT = "<",
  GTE = ">=",
  LTE = "<=",
  EQEQ = "==",

  // Identifiers
  IDENTIFIER = "identifier",
  NUMLITERAL = "numliteral",
  STRLITERAL = "strliteral",

  // End of file
  EOF = "eof",
}

export const GOM_KEYWORDS = new Set([
  "import",
  "type",
  "fn",
  "let",
  "for",
  "return",
  "if",
  "else",
  "main",
]);

export const getKeywordType = (value: string): GomToken => {
  switch (value) {
    case "import":
      return GomToken.IMPORT;
    case "type":
      return GomToken.TYPE;
    case "fn":
      return GomToken.FN;
    case "let":
      return GomToken.LET;
    case "for":
      return GomToken.FOR;
    case "return":
      return GomToken.RETURN;
    case "if":
      return GomToken.IF;
    case "else":
      return GomToken.ELSE;
    case "main":
      return GomToken.MAIN;
    default:
      return GomToken.IDENTIFIER;
  }
};

export const GOM_PRIMITIVE_TYPES = new Set(["i8", "i16", "f16", "str"]);

export const getPrimitiveType = (value: string): GomToken => {
  switch (value) {
    case "i8":
      return GomToken.I8;
    case "i16":
      return GomToken.I16;
    case "f16":
      return GomToken.F16;
    case "str":
      return GomToken.STR;
    default:
      return GomToken.IDENTIFIER;
  }
};
