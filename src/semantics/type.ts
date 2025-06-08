/**
 * Gom type can be:
 * - Primitive, e.g. int, bool, float, str, void
 * - Tuple, e.g. (int, bool)
 * - Struct e.g. { x: int, y: int }
 * - Composite, e.g. type IntList = List<int>
 * - Function, e.g. function add(a: int, b: int): int
 *
 * For now, structs are not supported & custom types can only be aliases to primitives.
 */

import assert from "assert";

export enum GomTypeKind {
  PrimitiveOrAlias = "PrimitiveOrAlias",
  Tuple = "Tuple",
  Struct = "Struct",
  List = "List",
  Composite = "Composite",
  Function = "Function",
}

export enum GomCompositeTypeKind {
  _Custom = "_Custom",
  // Map = "Map",
  // Set = "Set",
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

export class GomListType extends GomType {
  name: string;
  kind: GomTypeKind;
  elementType: GomType;
  static readonly SIZE_PROPERTY = "size";

  constructor(name: string, elementType: GomType) {
    super();
    this.name = name;
    this.kind = GomTypeKind.List;
    this.elementType = elementType;
  }

  isEqual(other: GomListType): boolean {
    if (other.kind !== GomTypeKind.List) {
      return false;
    }
    return this.elementType.isEqual(other.elementType);
  }

  toStr(): string {
    return `[${this.elementType.toStr()}]`;
  }

  static isBuiltInProperty(name: string): boolean {
    return [GomListType.SIZE_PROPERTY].includes(name);
  }

  static builtInPropertyType(name: string): GomType {
    switch (name) {
      case GomListType.SIZE_PROPERTY:
        return new GomPrimitiveTypeOrAlias("int");
      default:
        throw new Error(`Unknown list property: ${name}`);
    }
  }
}

export class GomTupleType extends GomType {
  kind: GomTypeKind;
  fields: Map<string, GomType>;

  constructor(fields: GomType[]) {
    super();
    this.kind = GomTypeKind.Tuple;
    this.fields = fields.reduce((acc, field, i) => {
      acc.set(i.toString(), field);
      return acc;
    }, new Map<string, GomType>());
  }

  isEqual(other: GomTupleType): boolean {
    if (other.kind !== GomTypeKind.Tuple) {
      return false;
    }
    if (this.fields.size !== other.fields.size) {
      return false;
    }
    for (let i = 0; i < this.fields.size; i++) {
      const otherField = other.fields.get(i.toString());
      assert(otherField);
      if (!this.fields.get(i.toString())?.isEqual(otherField)) {
        return false;
      }
    }
    return true;
  }

  toStr(): string {
    return `{ ${Array.from(this.fields)
      .map((field) => field[1].toStr())
      .join(", ")} }`;
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

export class GomCompositeType extends GomType {
  kind: GomTypeKind;
  compositeKind: GomCompositeTypeKind;
  fieldTypes: GomType[];

  constructor(compositeKind: GomCompositeTypeKind, fieldTypes: GomType[]) {
    super();
    this.kind = GomTypeKind.Composite;
    this.compositeKind = compositeKind;
    this.fieldTypes = fieldTypes;
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

  usesSret(): boolean {
    return (
      this.returnType instanceof GomStructType ||
      this.returnType instanceof GomCompositeType ||
      this.returnType instanceof GomTupleType
    );
  }
}
