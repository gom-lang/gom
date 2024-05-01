#!/usr/bin/env node

import main from "./src/index";

const filePath = process.argv[2];

(async () => await main(filePath))();
