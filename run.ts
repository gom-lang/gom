#!/usr/bin/env node
import { runCompile } from "./src/index";

const filePath = process.argv[2];
const target = (process.argv[3] || "c") as "c" | "llvm";

(async () => await runCompile(filePath, target))();
