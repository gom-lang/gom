import { compileAndReturn } from "../src";
import { spawn } from "child_process";
import { rm, writeFile } from "fs/promises";
import express from "express";
import path from "path";
import cors from "cors";

const app = express();

app.use(cors());
app.use(express.json());

app.post("/compile", async (req, res) => {
  res.setHeader("Access-Control-Expose-Headers", "X-Compile-Time");
  const { src } = req.body;
  const randomNameLL = Math.random().toString(36).substring(7);
  const llFilePath = path.resolve(__dirname, randomNameLL + ".ll");
  let startTime: number;
  Promise.all([
    writeFile(llFilePath, ""),
    new Promise<string>((res) => {
      startTime = Date.now();
      res(compileAndReturn(src, "llvm"));
    }),
  ])
    .then(async ([, llvmIr]) => {
      const compileTime = Date.now() - startTime;
      res.setHeader("X-Compile-Time", compileTime.toString());
      await writeFile(llFilePath, llvmIr);
      const child = spawn("lli", [llFilePath]);
      child.stdout.pipe(res);
      child.on("close", async () => {
        res.end();
        await rm(llFilePath);
      });
    })
    .catch((e) => {
      console.error(e);
      throw e;
    });
});

app.post("/codegen", async (req, res) => {
  const { src, target } = req.body;
  compileAndReturn(src, target).then((llvmIr) => {
    res.send(llvmIr);
  });
});

app.listen(5001, () => {
  console.log("Server listening on port 5001");
});
