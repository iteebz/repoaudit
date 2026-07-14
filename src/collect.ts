import { execSync } from "child_process";
import { readFileSync, existsSync } from "fs";
import * as path from "path";

export interface RepoSnapshot {
  files: string[];
  sampleCode: Record<string, string>; // path -> content (truncated)
  gitLog: string;
  packageJson: string | null;
  repoName: string;
}

const CODE_EXTS = new Set([
  ".ts", ".js", ".py", ".go", ".rs", ".rb", ".java", ".cs",
  ".tsx", ".jsx", ".sh", ".yaml", ".yml", ".toml", ".json",
  ".env.example", ".env.sample",
]);

const SKIP_DIRS = new Set([
  "node_modules", ".git", "dist", "build", ".next", "vendor",
  "__pycache__", ".venv", "venv", "coverage",
]);

function isCodeFile(f: string): boolean {
  const ext = path.extname(f);
  const base = path.basename(f);
  return CODE_EXTS.has(ext) || base === ".env.example" || base === ".env.sample";
}

export function collect(cwd: string): RepoSnapshot {
  // list tracked files
  let files: string[] = [];
  try {
    const out = execSync("git ls-files", { cwd, encoding: "utf8" });
    files = out.trim().split("\n").filter(Boolean);
  } catch {
    throw new Error("Not a git repository (or git not available). Run repoaudit inside a git repo.");
  }

  // filter to code files, skip heavy dirs
  const codeFiles = files.filter((f) => {
    const parts = f.split("/");
    if (parts.some((p) => SKIP_DIRS.has(p))) return false;
    return isCodeFile(f);
  });

  // sample up to 40 files, cap each at 4KB
  const sample: Record<string, string> = {};
  for (const f of codeFiles.slice(0, 40)) {
    const full = path.join(cwd, f);
    if (!existsSync(full)) continue;
    try {
      const raw = readFileSync(full, "utf8");
      sample[f] = raw.slice(0, 4096);
    } catch {
      // binary or unreadable — skip
    }
  }

  // last 20 commit messages
  let gitLog = "";
  try {
    gitLog = execSync("git log --oneline -20", { cwd, encoding: "utf8" }).trim();
  } catch {
    gitLog = "(no commits)";
  }

  // package.json if present
  let packageJson: string | null = null;
  const pkgPath = path.join(cwd, "package.json");
  if (existsSync(pkgPath)) {
    try {
      packageJson = readFileSync(pkgPath, "utf8").slice(0, 2048);
    } catch {}
  }

  const repoName = path.basename(cwd);

  return { files: codeFiles, sampleCode: sample, gitLog, packageJson, repoName };
}
