#!/usr/bin/env node
const SegfaultHandler = require("segfault-handler");
SegfaultHandler.registerHandler("crash.log");
import main from "./src/index";

const filePath = process.argv[2];
const target = (process.argv[3] || "c") as "c" | "llvm";

(async () => await main(filePath, target))();
