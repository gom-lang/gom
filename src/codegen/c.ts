/**
 * Gom code generator to C
 */

import { writeFileSync } from "node:fs";
import { BaseCodeGenerator } from "./common";
import { GomPrimitiveTypeOrAlias } from "../types";
import {
  NodeAccess,
  NodeAssignment,
  NodeBinaryOp,
  NodeCall,
  NodeExpr,
  NodeExprBracketed,
  NodeExpressionStatement,
  NodeForStatement,
  NodeFunctionDefinition,
  NodeIfStatement,
  NodeLetStatement,
  NodeMainFunction,
  NodeReturnStatement,
  NodeTerm,
} from "../parser/rd/nodes";
import { Node } from "../parser/rd/tree";
import { GomToken } from "../lexer/tokens";

enum CType {
  INT = "int",
  FLOAT = "float",
  CHAR = "char",
  VOID = "void",
  BOOL = "bool",
  STRING = "char*",
}

type CValue = string;

export class CodeGenerator extends BaseCodeGenerator {
  private outLines: string[] = [];
  private indent = 0;

  override generate(): string {
    console.log("Generating code...");
    this.symbolTableReader.enterScope("global");
    this.writeIncludes();
    this.writeGlobalVariables();
    this.visit(this.ast);
    this.symbolTableReader.exitScope();
    return this.outLines.join("\n");
  }

  override generateAndWriteFile(): void {
    const out = this.generate();
    writeFileSync(this.outputPath, out);
  }

  private writeLine(line: string): void {
    this.outLines.push("  ".repeat(this.indent) + line);
  }

  private mapGomTypeToC(type: GomPrimitiveTypeOrAlias): CType {
    switch (type.typeString) {
      case "int":
        return CType.INT;
      case "float":
        return CType.FLOAT;
      case "void":
        return CType.VOID;
      case "bool":
        return CType.BOOL;
      case "str":
        return CType.STRING;
      default:
        throw new Error(`Unsupported type ${type.typeString}`);
    }
  }

  private writeIncludes(): void {
    this.writeLine("#include <stdio.h>");
    this.writeLine("#include <stdlib.h>");
  }

  private writeGlobalVariables(): void {
    // const globalVariables = this.symbolTableReader
    //   .getAllIdentifiers()
    //   .filter((id) => !id.isFunction());
    // globalVariables.forEach((id) => {
    //   const type = this.mapGomTypeToC(id.type as GomPrimitiveTypeOrAlias);
    //   if (id.valueExpr) {
    //     this.writeLine(
    //       `static ${type} ${id.name} = ${
    //         (id.valueExpr as NodeTerm).token.value
    //       };`
    //     );
    //   } else {
    //     this.writeLine(`static ${type} ${id.name};`);
    //   }
    // });
  }

  visitMainFunction(node: NodeMainFunction): void {
    this.symbolTableReader.enterScope("main");
    this.irScopeManager.enterScope("main");
    this.writeLine("int main() {");
    this.indent++;
    node.body.forEach((stmt) => this.visit(stmt));
    this.indent--;
    this.writeLine("}");
    this.symbolTableReader.exitScope();
    this.irScopeManager.exitScope();
  }

  visitFunctionDefinition(node: NodeFunctionDefinition): void {
    // this.symbolTableReader.enterScope(node.name.value);
    // this.irScopeManager.enterScope(node.name.value);
    // const returnType = this.mapGomTypeToC(
    //   node.gomType.returnType as GomPrimitiveTypeOrAlias
    // );
    // const argsType = node.gomType.args.map((arg) =>
    //   this.mapGomTypeToC(arg as GomPrimitiveTypeOrAlias)
    // );
    // this.writeLine(
    //   `${returnType} ${node.name.value}(${argsType
    //     .map((type, i) => `${type} ${node.args[i].name.token.value}`)
    //     .join(", ")}) {`
    // );
    // this.indent++;
    // node.body.forEach((stmt) => this.visit(stmt));
    // this.indent--;
    // this.writeLine("}");
    // this.symbolTableReader.exitScope();
    // this.irScopeManager.exitScope();
  }

  visitLetStatement(node: NodeLetStatement): void {
    for (const decl of node.decls) {
      const type = this.mapGomTypeToC(
        decl.lhs.gomType as GomPrimitiveTypeOrAlias,
      );
      const rhsValue = this.visitExpression(decl.rhs);

      this.writeLine(`${type} ${decl.lhs.token.value} = ${rhsValue};`);
    }
  }

  visitExpressionStatement(node: NodeExpressionStatement): void {
    const exprValue = this.visitExpression(node.expr);
    this.writeLine(`${exprValue};`);
  }

  visitReturnStatement(node: NodeReturnStatement): void {
    if (node.expr) {
      const exprValue = this.visitExpression(node.expr);
      this.writeLine(`return ${exprValue};`);
    } else {
      this.writeLine("return;");
    }
  }

  visitIfStatement(node: NodeIfStatement): void {
    const conditionValue = this.visitExpression(node.conditionExpr);
    this.writeLine(`if (${conditionValue}) {`);
    this.indent++;
    this.symbolTableReader.enterScope("if");
    this.irScopeManager.enterScope("if");
    node.body.forEach((stmt) => this.visit(stmt));
    this.symbolTableReader.exitScope();
    this.irScopeManager.exitScope();
    this.indent--;
    this.writeLine("}");
    if (node.elseBody) {
      this.writeLine("else {");
      this.indent++;
      this.symbolTableReader.enterScope("else");
      this.irScopeManager.enterScope("else");
      node.elseBody.forEach((stmt) => this.visit(stmt));
      this.symbolTableReader.exitScope();
      this.irScopeManager.exitScope();
      this.indent--;
      this.writeLine("}");
    }
  }

  visitForStatement(node: NodeForStatement): void {
    if (node.initExpr && node.conditionExpr && node.updateExpr) {
      const initValue = this.visitExpression(node.initExpr as NodeExpr);
      const conditionValue = this.visitExpression(node.conditionExpr);
      const updateValue = this.visitExpression(node.updateExpr);

      this.writeLine(`for (${initValue}; ${conditionValue}; ${updateValue}) {`);
      this.indent++;
      this.symbolTableReader.enterScope("for");
      this.irScopeManager.enterScope("for");
      node.body.forEach((stmt) => this.visit(stmt));
      this.symbolTableReader.exitScope();
      this.irScopeManager.exitScope();
      this.indent--;
      this.writeLine("}");
    } else {
      // while 1 loop
      this.writeLine(`while (1) {`);
      this.indent++;
      this.symbolTableReader.enterScope("for");
      this.irScopeManager.enterScope("for");
      node.body.forEach((stmt) => this.visit(stmt));
      this.symbolTableReader.exitScope();
      this.irScopeManager.exitScope();
      this.indent--;
      this.writeLine("}");
    }
  }

  visitExpression(expr: NodeExpr): CValue {
    if (expr instanceof NodeAccess) {
      return this.visitAccess(expr);
    } else if (expr instanceof NodeBinaryOp) {
      return this.visitBinaryOp(expr);
    } else if (expr instanceof NodeCall) {
      return this.visitCall(expr);
    } else if (expr instanceof NodeTerm) {
      return this.visitTerm(expr);
    } else if (expr instanceof NodeAssignment) {
      return this.visitAssignment(expr);
    } else if (expr instanceof NodeExprBracketed) {
      return this.visitExpression(expr.expr);
    }

    throw new Error("Unknown expression type: " + (expr as Node).type);
  }

  visitAccess(node: NodeAccess): CValue {
    // TODO
    return "";
  }

  visitAssignment(node: NodeAssignment): CValue {
    const id = this.symbolTableReader.getIdentifier(node.lhs.token.value);
    if (!id) {
      this.errorManager.throwCodegenError({
        loc: node.loc,
        message: "Unknown identifier: " + node.lhs.token.value,
      });
    }

    const rhsValue = this.visitExpression(node.rhs);
    return `${id.name} = ${rhsValue}`;
  }

  visitBinaryOp(node: NodeBinaryOp): CValue {
    const op = node.op;
    const lhs = this.visitExpression(node.lhs);
    const rhs = this.visitExpression(node.rhs);

    return `${lhs} ${op.value} ${rhs}`;
  }

  visitCall(node: NodeCall): CValue {
    const fn = this.symbolTableReader.getIdentifier(node.id.token!.value);
    if (!fn) {
      throw new Error("Unknown function: " + node.id.token!.value);
    }

    const args = node.args.map((arg) => this.visitExpression(arg));
    return `${fn.name}(${args.join(", ")})`;
  }

  visitTerm(node: NodeTerm): CValue {
    const type = node.token.type;
    if (type === GomToken.NUMLITERAL) {
      return node.token.value;
    } else if (type === GomToken.STRLITERAL) {
      return `"${node.token.value}"`;
    } else if (type === GomToken.IDENTIFIER) {
      const id = this.symbolTableReader.getIdentifier(node.token.value);
      if (!id) {
        // throw new Error("Unknown identifier: " + node.token.value);
        this.errorManager.throwCodegenError({
          loc: node.loc,
          message: "Unknown identifier: " + node.token.value,
        });
      }

      return id.name;
    } else if (type === GomToken.TRUE || type === GomToken.FALSE) {
      return node.token.value;
    } else {
      throw new Error("Unknown term type: " + type);
    }
  }
}
