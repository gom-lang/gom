export enum GomToken {
  // Keywords
  IMPORT = "import",
  TYPE = "type",
  FN = "fn",
  LET = "let",
  CONST = "const",
  FOR = "for",
  RETURN = "return",
  IF = "if",
  ELSE = "else",
  MAIN = "main",
  TRUE = "true",
  FALSE = "false",

  // Primitive type
  BUILT_IN_TYPE = "built_in_type",

  // Complex types
  STRUCT = "struct",

  // Symbols
  LPAREN = "(",
  RPAREN = ")",
  LBRACE = "{",
  RBRACE = "}",
  LBRACKET = "[",
  RBRACKET = "]",
  COLON = ":",
  SEMICOLON = ";",
  COMMA = ",",
  DOT = ".",
  EQ = "=",
  PLUS = "+",
  MINUS = "-",
  MUL = "*",
  DIV = "/",
  EXPO = "^",
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

  // Virtual tokens - used for parsing
  _CALL_LPAREN = "_call_lparen",
  _ACCESS_DOT = "_access_dot",
}

export const GOM_KEYWORDS = new Set([
  "import",
  "type",
  "fn",
  "let",
  "const",
  "for",
  "return",
  "if",
  "else",
  "main",
  "true",
  "false",
  "struct",
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
    case "const":
      return GomToken.CONST;
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
    case "true":
      return GomToken.TRUE;
    case "false":
      return GomToken.FALSE;
    case "struct":
      return GomToken.STRUCT;
    default:
      return GomToken.IDENTIFIER;
  }
};

export const GOM_BUILT_IN_TYPES = new Set(["i8", "bool", "f32", "str", "void"]);
