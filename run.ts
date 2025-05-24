#!/usr/bin/env tsx
import { runCompile } from "./src/index";
import { execSync } from "child_process";

const filePath = process.argv[2];
const target = (process.argv[3] || "c") as "c" | "llvm";

runCompile(filePath, target)
  .then(() => {
    if (target === "llvm") {
      // compile using clang
      execSync(
        `clang -o ${filePath.replace(".gom", "")} ${filePath.replace(
          ".gom",
          ".ll"
        )}`,
        { stdio: "inherit" }
      );
      console.log(
        `✅ Executable generated at: ${filePath.replace(".gom", "")}`
      );
    }
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
