import {
  GomDeferredType,
  GomListType,
  GomPrimitiveTypeOrAlias,
  GomStructType,
  GomTupleType,
  GomType,
} from ".";
import { GOM_BUILT_IN_TYPES, GomToken } from "../lexer/tokens";
import {
  NodeCollectionInit,
  NodeGomTypeComposite,
  NodeGomTypeId,
  NodeGomTypeList,
  NodeGomTypeStruct,
  NodeGomTypeStructField,
  NodeGomTypeTuple,
  NodeStructInit,
  NodeTerm,
  NodeTupleLiteral,
  NodeTypeDefinition,
} from "../parser/rd/nodes";
import { SimpleVisitor } from "../parser/rd/visitor";

export class TypeAttacher extends SimpleVisitor<void> {
  private getTermGomType(node: NodeTerm): GomType {
    if (node.token.type === GomToken.IDENTIFIER) {
      return new GomDeferredType("resolve_type", node.token.value);
    } else if (node.token.type === GomToken.NUMLITERAL) {
      return new GomPrimitiveTypeOrAlias("int");
    } else if (node.token.type === GomToken.STRLITERAL) {
      return new GomPrimitiveTypeOrAlias("str");
    } else if (
      node.token.type === GomToken.TRUE ||
      node.token.type === GomToken.FALSE
    ) {
      return new GomPrimitiveTypeOrAlias("bool");
    } else if (node.token.type === GomToken.BUILT_IN_TYPE) {
      return new GomPrimitiveTypeOrAlias(node.token.value);
    }

    throw new Error(`Cannot determine type for token: ${node.token.type}`);
  }

  visitTerm(node: NodeTerm): void {
    const type = this.getTermGomType(node);
    node.gomType = type;
  }

  visitStructInit(node: NodeStructInit): void {
    this.visitChildren(node);
    node.gomType = new GomStructType(
      node.structTypeName.token.value,
      node.fields.reduce((acc, [field, expr]) => {
        acc.set(field.token.value, expr.gomType);
        return acc;
      }, new Map<string, GomType>()),
    );
  }

  visitCollectionInit(node: NodeCollectionInit): void {
    this.visitChildren(node);
    node.gomType = new GomListType(
      node.collectionTypeName.token.value,
      node.elements[0].gomType,
    );
  }

  visitTupleLiteral(node: NodeTupleLiteral): void {
    this.visitChildren(node);
    node.gomType = new GomTupleType(
      node.elements.map((element) => element.gomType),
    );
  }

  visitTypeDefinition(node: NodeTypeDefinition): void {
    this.visitChildren(node);
    node.gomType = node.rhs.gomType;
  }

  visitGomTypeStruct(node: NodeGomTypeStruct): void {
    this.visitChildren(node);
    node.gomType = new GomStructType(
      node.name.token.value,
      node.fields.reduce((acc, field) => {
        acc.set(field.name.value, field.fieldType.gomType);
        return acc;
      }, new Map<string, GomType>()),
    );
  }

  visitGomTypeList(node: NodeGomTypeList): void {
    this.visitChildren(node);
    node.gomType = new GomListType(
      node.name.token.value,
      node.elementType.gomType,
    );
  }

  visitGomTypeTuple(node: NodeGomTypeTuple): void {
    this.visitChildren(node);
    node.gomType = new GomTupleType(node.fields.map((field) => field.gomType));
  }

  visitGomTypeComposite(node: NodeGomTypeComposite): void {
    this.visitChildren(node);
    node.gomType = new GomListType(node.id.token.value, node.fields[0].gomType);
  }

  visitGomTypeStructField(node: NodeGomTypeStructField): void {
    this.visitChildren(node);
    node.gomType = node.fieldType.gomType;
  }

  visitGomTypeId(node: NodeGomTypeId): void {
    if (GOM_BUILT_IN_TYPES.has(node.id.token.value)) {
      node.gomType = new GomPrimitiveTypeOrAlias(node.id.token.value);
    } else {
      node.gomType = new GomDeferredType(
        "resolve_custom_type",
        node.id.token.value,
      );
    }
  }
}
