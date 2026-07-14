import { AuditResult, Finding } from "./ai";

const RESET = "\x1b[0m";
const BOLD = "\x1b[1m";
const DIM = "\x1b[90m";

const SEVERITY_COLOR: Record<Finding["severity"], string> = {
  critical: "\x1b[31m",
  high:     "\x1b[33m",
  medium:   "\x1b[36m",
  low:      "\x1b[90m",
};

function letterGrade(score: number): string {
  if (score >= 97) return "A+";
  if (score >= 93) return "A";
  if (score >= 90) return "A-";
  if (score >= 87) return "B+";
  if (score >= 83) return "B";
  if (score >= 80) return "B-";
  if (score >= 77) return "C+";
  if (score >= 73) return "C";
  if (score >= 70) return "C-";
  if (score >= 67) return "D+";
  if (score >= 60) return "D";
  return "F";
}

function gradeColor(score: number): string {
  if (score >= 80) return "\x1b[32m"; // green
  if (score >= 60) return "\x1b[33m"; // yellow
  return "\x1b[31m";                  // red
}

function scoreBar(score: number): string {
  const filled = Math.round(score / 5);
  const bar = "█".repeat(filled) + "░".repeat(20 - filled);
  return `${gradeColor(score)}${bar}${RESET}`;
}

function severityLabel(s: Finding["severity"]): string {
  const labels = { critical: "CRIT", high: "HIGH", medium: " MED", low: " LOW" };
  return `${SEVERITY_COLOR[s]}${labels[s]}${RESET}`;
}

export function renderSummary(result: AuditResult, repoName: string): void {
  renderFull(result, repoName);
}

export function renderFull(result: AuditResult, repoName: string): void {
  const grade = letterGrade(result.score);
  const color = gradeColor(result.score);

  console.log(`\n${BOLD}repoaudit${RESET} — ${repoName}\n`);
  console.log(`  ${color}${BOLD}${grade.padEnd(4)}${RESET}  ${scoreBar(result.score)}  ${result.score}/100`);
  console.log(`\n  ${result.verdict}\n`);

  console.log(`${BOLD}All findings (${result.findings.length}):${RESET}\n`);
  for (const f of result.findings) {
    const loc = f.file ? `  ${DIM}${f.file}${RESET}` : "";
    console.log(`  [${severityLabel(f.severity)}] ${f.title}${loc}`);
    console.log(`         ${DIM}${f.detail}${RESET}`);
    console.log();
  }
  console.log(`  ${DIM}Share: ${repoName} scored ${grade} on repoaudit — npx repoaudit${RESET}`);
  console.log(`  ${DIM}No data leaves your machine except to your AI provider.${RESET}\n`);
}
