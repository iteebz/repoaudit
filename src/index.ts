#!/usr/bin/env node
import * as path from "path";
import { collect } from "./collect";
import { audit } from "./ai";
import { renderFull } from "./render";

async function main() {
  const cwd = process.cwd();

  let snap;
  try {
    snap = collect(cwd);
  } catch (e: any) {
    console.error(`\x1b[31merror:\x1b[0m ${e.message}`);
    process.exit(1);
  }

  console.log(`\x1b[90mCollected ${snap.files.length} files from ${path.basename(cwd)}. Analyzing…\x1b[0m`);

  let result;
  try {
    result = await audit(snap);
  } catch (e: any) {
    console.error(`\x1b[31merror:\x1b[0m ${e.message}`);
    process.exit(1);
  }

  renderFull(result, snap.repoName);
}

main();
