#!/usr/bin/env node
const SegfaultHandler = require("segfault-handler");
SegfaultHandler.registerHandler("crash.log");
import { runCompile } from "./src/index";

const filePath = process.argv[2];
const target = (process.argv[3] || "c") as "c" | "llvm";

(async () => await runCompile(filePath, target))();

// program
//   .arguments("<filePath>")
//   .option("-t, --target <target>", "target language", "c")
//   .action(async (filePath) => {
//     await main(filePath, target);
//   });

// program.parse(process.argv);
