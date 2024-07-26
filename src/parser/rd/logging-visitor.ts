import { NodeAccess, NodeCall } from "./nodes";
import { SimpleVisitor } from "./visitor";

export class LoggingVisitor extends SimpleVisitor<void> {
  visitCall(node: NodeCall): void {
    console.log("Call id", node.id.token.value);
    this.visitChildren(node);
  }

  visitAccess(node: NodeAccess): void {
    console.log("Access", `${node.lhs.token.value}.${node.rhs.rhs}`);
    this.visitChildren(node);
  }
}
