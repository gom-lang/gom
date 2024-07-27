/**
 * Gom type can be:
 * - Primitive, e.g. i8, bool, f16, str
 * - Struct e.g. struct { x: i8, y: i8 }
 * - Custom, e.g. type Number = i8
 * - Function, e.g. fn add(a: i8, b: i8): i8
 *
 * For now, structs are not supported & custom types can only be aliases to primitives.
 */

export enum GomTypeKind {
  PrimitiveOrAlias = "PrimitiveOrAlias",
  Function = "Function",
}

export type GomType = GomPrimitiveTypeOrAlias | GomFunctionType;

export type GomPrimitiveTypeOrAliasValue =
  | "i8"
  | "bool"
  | "f16"
  | "str"
  | string;

export class GomPrimitiveTypeOrAlias {
  kind: GomTypeKind;
  typeString: GomPrimitiveTypeOrAliasValue;

  constructor(typeString: GomPrimitiveTypeOrAliasValue) {
    this.kind = GomTypeKind.PrimitiveOrAlias;
    this.typeString = typeString;
  }
}

export class GomFunctionType {
  kind: GomTypeKind;
  args: GomType[];
  returnType: GomType | null;

  constructor(args: GomType[], returnType: GomType | null) {
    this.kind = GomTypeKind.Function;
    this.args = args;
    this.returnType = returnType;
  }
}
