import { SyntaxError } from "./error";
import {
  GOM_KEYWORDS,
  GOM_PRIMITIVE_TYPES,
  GomToken,
  getKeywordType,
  getPrimitiveType,
} from "./tokens";

export interface Token {
  type: GomToken;
  value: string;
  start: number;
  end: number;
}

export class Lexer {
  src: string;
  pos: number;
  currentChar: string;

  constructor(src: string) {
    this.src = src;
    this.pos = 0;
    this.currentChar = this.src[this.pos];
  }

  nextToken(): Token {
    if (this.pos >= this.src.length)
      return {
        type: GomToken.EOF,
        value: "eof",
        start: this.pos,
        end: this.pos,
      };
    while (1) {
      if (this.pos >= this.src.length)
        return {
          type: GomToken.EOF,
          value: "eof",
          start: this.pos,
          end: this.pos,
        };
      this.currentChar = this.src[this.pos];

      if (/\s/.test(this.currentChar)) {
        this.pos++;
        continue;
      }

      switch (this.currentChar) {
        // Single character symbols
        case "(":
          this.pos++;
          return {
            type: GomToken.LPAREN,
            value: this.currentChar,
            start: this.pos - 1,
            end: this.pos - 1,
          };
        case ")":
          this.pos++;
          return {
            type: GomToken.RPAREN,
            value: this.currentChar,
            start: this.pos - 1,
            end: this.pos - 1,
          };
        case "{":
          this.pos++;
          return {
            type: GomToken.LBRACE,
            value: this.currentChar,
            start: this.pos - 1,
            end: this.pos - 1,
          };
        case "}":
          this.pos++;
          return {
            type: GomToken.RBRACE,
            value: this.currentChar,
            start: this.pos - 1,
            end: this.pos - 1,
          };
        case ":":
          this.pos++;
          return {
            type: GomToken.COLON,
            value: this.currentChar,
            start: this.pos - 1,
            end: this.pos - 1,
          };
        case ";":
          this.pos++;
          return {
            type: GomToken.SEMICOLON,
            value: this.currentChar,
            start: this.pos - 1,
            end: this.pos - 1,
          };
        case ",":
          this.pos++;
          return {
            type: GomToken.COMMA,
            value: this.currentChar,
            start: this.pos - 1,
            end: this.pos - 1,
          };
        case ".":
          this.pos++;
          return {
            type: GomToken.DOT,
            value: this.currentChar,
            start: this.pos - 1,
            end: this.pos - 1,
          };
        case "+":
          this.pos++;
          return {
            type: GomToken.PLUS,
            value: this.currentChar,
            start: this.pos - 1,
            end: this.pos - 1,
          };
        case "-":
          this.pos++;
          return {
            type: GomToken.MINUS,
            value: this.currentChar,
            start: this.pos - 1,
            end: this.pos - 1,
          };
        case "*":
          this.pos++;
          return {
            type: GomToken.MUL,
            value: this.currentChar,
            start: this.pos - 1,
            end: this.pos - 1,
          };
        case "/":
          this.pos++;
          return {
            type: GomToken.DIV,
            value: this.currentChar,
            start: this.pos - 1,
            end: this.pos - 1,
          };
        case "^":
          this.pos++;
          return {
            type: GomToken.EXP,
            value: this.currentChar,
            start: this.pos - 1,
            end: this.pos - 1,
          };

        // Possible double character symbols
        case "=":
          if (this.src[this.pos + 1] === "=") {
            this.pos += 2;
            return {
              type: GomToken.EQEQ,
              value: "==",
              start: this.pos - 2,
              end: this.pos - 1,
            };
          }
          this.pos++;
          return {
            type: GomToken.EQ,
            value: this.currentChar,
            start: this.pos - 1,
            end: this.pos - 1,
          };
        case ">":
          if (this.src[this.pos + 1] === "=") {
            this.pos += 2;
            return {
              type: GomToken.GTE,
              value: ">=",
              start: this.pos - 2,
              end: this.pos - 1,
            };
          }
          this.pos++;
          return {
            type: GomToken.GT,
            value: this.currentChar,
            start: this.pos - 1,
            end: this.pos - 1,
          };
        case "<":
          if (this.src[this.pos + 1] === "=") {
            this.pos += 2;
            return {
              type: GomToken.LTE,
              value: "<=",
              start: this.pos - 2,
              end: this.pos - 1,
            };
          }
          this.pos++;
          return {
            type: GomToken.LT,
            value: this.currentChar,
            start: this.pos - 1,
            end: this.pos - 1,
          };
        default: {
          if (this.currentChar === '"') {
            // String literal
            let value = this.currentChar;
            let start = this.pos;
            this.pos++;
            while (this.src[this.pos] !== '"') {
              value += this.src[this.pos];
              this.pos++;
            }

            value += this.src[this.pos];

            this.pos++;

            return {
              type: GomToken.STRLITERAL,
              value,
              start,
              end: this.pos - 1,
            };
          }

          // Identifier/Keyword/Primitive type
          if (/[A-Za-z_]/.test(this.currentChar)) {
            let value = this.currentChar;
            this.pos++;
            while (
              this.src[this.pos] !== undefined &&
              /[A-Za-z0-9_]/.test(this.src[this.pos])
            ) {
              value += this.src[this.pos];
              this.pos++;
            }

            if (GOM_KEYWORDS.has(value)) {
              return {
                type: getKeywordType(value),
                value,
                start: this.pos - value.length,
                end: this.pos - 1,
              };
            }

            if (GOM_PRIMITIVE_TYPES.has(value)) {
              return {
                type: getPrimitiveType(value),
                value,
                start: this.pos - value.length,
                end: this.pos - 1,
              };
            }

            return {
              type: GomToken.IDENTIFIER,
              value,
              start: this.pos - value.length,
              end: this.pos - 1,
            };
          }

          // Number literal
          if (/[0-9]/.test(this.currentChar)) {
            let value = this.currentChar;
            this.pos++;
            while (
              this.src[this.pos] !== undefined &&
              /[0-9]/.test(this.src[this.pos])
            ) {
              value += this.src[this.pos];
              this.pos++;
            }

            if (/A-Za-z_/.test(this.src[this.pos])) {
              throw new SyntaxError({
                start: this.pos - value.length,
                message: `Identifier can only start with a character matching [A-Za-z_]: '${value}'`,
              });
            }

            return {
              type: GomToken.NUMLITERAL,
              value,
              start: this.pos - value.length,
              end: this.pos - 1,
            };
          }

          throw new SyntaxError({
            start: this.pos,
            message: `Unidentified character '${this.currentChar}'`,
          });
        }
      }
    }

    throw new SyntaxError({
      start: this.pos,
      message: `Unidentified character '${this.src[this.pos]}'`,
    });
  }
}
