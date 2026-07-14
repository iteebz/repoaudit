#!/usr/bin/env node
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const path = __importStar(require("path"));
const collect_1 = require("./collect");
const ai_1 = require("./ai");
const render_1 = require("./render");
async function main() {
    const cwd = process.cwd();
    const full = process.argv.includes("--full");
    let snap;
    try {
        snap = (0, collect_1.collect)(cwd);
    }
    catch (e) {
        console.error(`\x1b[31merror:\x1b[0m ${e.message}`);
        process.exit(1);
    }
    console.log(`\x1b[90mCollected ${snap.files.length} files from ${path.basename(cwd)}. Analyzing…\x1b[0m`);
    let result;
    try {
        result = await (0, ai_1.audit)(snap);
    }
    catch (e) {
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
        (0, render_1.renderFull)(result, snap.repoName);
    }
    else {
        (0, render_1.renderCard)(result, snap.repoName);
    }
}
main();
