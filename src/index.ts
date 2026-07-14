#!/usr/bin/env node
import * as path from "path";
import { collect } from "./collect";
import { audit } from "./ai";
import { renderCard, renderFull } from "./render";

async function main() {
  const cwd = process.cwd();
  const full = process.argv.includes("--full");

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

  if (full) {
    // full report requires a key — free tier is the grade card (d/e1af6aed)
    const key = process.env.REPOAUDIT_KEY;
    if (!key) {
      console.error(`\n\x1b[31mFull report requires REPOAUDIT_KEY.\x1b[0m`);
      console.error(`Get your free key → https://github.com/iteebz/repoaudit\n`);
      process.exit(1);
    }
    renderFull(result, snap.repoName);
  } else {
    renderCard(result, snap.repoName);
  }
}

main();
