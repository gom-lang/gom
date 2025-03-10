/**
 * Gom type can be:
 * - Primitive, e.g. int, bool, float, str, void
 * - Struct e.g. { x: int, y: int }
 * - Custom, e.g. type Number = int
 * - Function, e.g. fn add(a: int, b: int): int
 *
 * For now, structs are not supported & custom types can only be aliases to primitives.
 */

export enum GomTypeKind {
  PrimitiveOrAlias = "PrimitiveOrAlias",
  Array = "Array",
  Struct = "Struct",
  Function = "Function",
}

export class GomType {
  kind: GomTypeKind = GomTypeKind.PrimitiveOrAlias;
  toStr(): string {
    return "gomType";
  }
  isEqual(other: GomType): boolean {
    return false;
  }
}

export type GomPrimitiveTypeOrAliasValue =
  | "int"
  | "bool"
  | "float"
  | "str"
  | "void"
  | string;

export class GomPrimitiveTypeOrAlias extends GomType {
  kind: GomTypeKind;
  typeString: GomPrimitiveTypeOrAliasValue;

  constructor(typeString: GomPrimitiveTypeOrAliasValue) {
    super();
    this.kind = GomTypeKind.PrimitiveOrAlias;
    this.typeString = typeString;
  }

  isEqual(other: GomPrimitiveTypeOrAlias): boolean {
    if (other.kind !== GomTypeKind.PrimitiveOrAlias) {
      return false;
    }
    return this.typeString === other.typeString;
  }

  toStr(): string {
    return this.typeString;
  }
}

export class GomArrayType extends GomType {
  kind: GomTypeKind;
  elementType: GomType;
  size: number;

  constructor(elementType: GomType, size: number) {
    super();
    this.kind = GomTypeKind.Array;
    this.elementType = elementType;
    this.size = size;
  }

  isEqual(other: GomArrayType): boolean {
    if (other.kind !== GomTypeKind.Array) {
      return false;
    }
    return (
      this.size === other.size && this.elementType.isEqual(other.elementType)
    );
  }

  toStr(): string {
    return `${this.elementType.toStr()}[${this.size}]`;
  }
}

export class GomStructType extends GomType {
  kind: GomTypeKind;
  name: string;
  fields: Map<string, GomType>;

  constructor(name: string, fields: Map<string, GomType>) {
    super();
    this.name = name;
    this.kind = GomTypeKind.Struct;
    this.fields = fields;
  }

  toStr(): string {
    return `struct { ${Object.entries(this.fields)
      .map(([name, type]) => `${name}: ${type.toStr()}`)
      .join(", ")} }`;
  }

  isEqual(other: GomStructType): boolean {
    if (this.fields.size !== other.fields.size) {
      return false;
    }

    for (const [name, type] of Object.entries(this.fields)) {
      if (!other.fields.has(name) || !type.isEqual(other.fields.get(name))) {
        return false;
      }
    }

    return true;
  }
}

export class GomFunctionType extends GomType {
  kind: GomTypeKind;
  args: GomType[];
  returnType: GomType;

  constructor(args: GomType[], returnType: GomType) {
    super();
    this.kind = GomTypeKind.Function;
    this.args = args;
    this.returnType = returnType;
  }

  isEqual(other: GomFunctionType): boolean {
    if (other.kind !== GomTypeKind.Function) {
      return false;
    }
    if (this.args.length !== other.args.length) {
      return false;
    }
    for (let i = 0; i < this.args.length; i++) {
      if (!this.args[i].isEqual(other.args[i])) {
        return false;
      }
    }

    return this.returnType.isEqual(other.returnType as GomType);
  }

  toStr(): string {
    return `(${this.args
      .map((arg) => arg.toStr())
      .join(", ")}) => ${this.returnType.toStr()}`;
  }
}
