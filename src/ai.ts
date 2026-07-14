import OpenAI from "openai";
import { RepoSnapshot } from "./collect";

export interface Finding {
  severity: "critical" | "high" | "medium" | "low";
  category: string;
  title: string;
  detail: string;
  file?: string;
}

export interface AuditResult {
  summary: string;   // 1-2 sentences
  verdict: string;   // <=10 words, shareable judgment ("Well-secured, minor gaps")
  score: number;     // 0-100
  findings: Finding[];
}

function buildPrompt(snap: RepoSnapshot): string {
  const fileList = snap.files.slice(0, 100).join("\n");
  const codeBlocks = Object.entries(snap.sampleCode)
    .map(([f, c]) => `--- ${f} ---\n${c}`)
    .join("\n\n");

  return `You are a senior security and code-quality engineer auditing a git repository.

Repository: ${snap.repoName}
Files (${snap.files.length} total, showing up to 100):
${fileList}

Recent commits:
${snap.gitLog}

${snap.packageJson ? `package.json:\n${snap.packageJson}\n` : ""}

Code samples (up to 40 files, 4KB each):
${codeBlocks}

Produce a JSON audit result with this exact shape (no markdown, raw JSON only):
{
  "summary": "<1-2 sentence plain-English summary of the repo's security and quality posture>",
  "verdict": "<10 words or fewer, shareable judgment suitable for sharing — e.g. 'Well-secured, minor gaps in dependency hygiene'>",
  "score": <integer 0-100, where 100 is excellent>,
  "findings": [
    {
      "severity": "critical" | "high" | "medium" | "low",
      "category": "<Security | Dependencies | Code Quality | Configuration | Documentation>",
      "title": "<short title>",
      "detail": "<1-2 sentences explaining the issue and recommended fix>",
      "file": "<path/to/file or null>"
    }
  ]
}

Rules:
- findings must be real, specific, and actionable — no generic advice
- include 8-15 findings total — be thorough, cover security, deps, quality, config, docs
- order by severity descending
- if a finding has no specific file, omit the "file" key
- score reflects overall posture after considering all findings
- verdict must be <=10 words, positive framing, shareable as a flex — not a warning
- return ONLY the JSON object, no other text`;
}

function detectClient(): { client: OpenAI; model: string } {
  if (process.env.GROQ_API_KEY) {
    return {
      client: new OpenAI({
        apiKey: process.env.GROQ_API_KEY,
        baseURL: "https://api.groq.com/openai/v1",
      }),
      model: "llama-3.3-70b-versatile",
    };
  }
  if (process.env.OPENROUTER_API_KEY) {
    return {
      client: new OpenAI({
        apiKey: process.env.OPENROUTER_API_KEY,
        baseURL: "https://openrouter.ai/api/v1",
      }),
      model: "anthropic/claude-3-haiku",
    };
  }
  if (process.env.OPENAI_API_KEY) {
    return {
      client: new OpenAI({ apiKey: process.env.OPENAI_API_KEY }),
      model: "gpt-4o-mini",
    };
  }
  throw new Error(
    "No AI key found. Set GROQ_API_KEY (free), OPENROUTER_API_KEY, or OPENAI_API_KEY.\n" +
    "Get a free Groq key at https://console.groq.com"
  );
}

const SEVERITIES = new Set(["critical", "high", "medium", "low"]);

// LLM output is untrusted: the model is fed arbitrary repo content (prompt
// injection) and can hallucinate. Coerce every field into the AuditResult
// contract so a hostile/garbage response can never crash render (String.repeat
// on a negative count throws) or emit a nonsense shareable grade.
export function normalize(parsed: unknown): AuditResult {
  const p = (parsed ?? {}) as Record<string, unknown>;

  const rawScore = Number(p.score);
  const score = Number.isFinite(rawScore)
    ? Math.max(0, Math.min(100, Math.round(rawScore)))
    : 0;

  const summary = typeof p.summary === "string" ? p.summary : "No summary provided.";

  let verdict = typeof p.verdict === "string" && p.verdict.trim() ? p.verdict : "";
  if (!verdict) verdict = summary.split(".")[0] || "Audit complete";

  const rawFindings = Array.isArray(p.findings) ? p.findings : [];
  const findings: Finding[] = rawFindings.map((raw): Finding => {
    const f = (raw ?? {}) as Record<string, unknown>;
    const severity = SEVERITIES.has(f.severity as string)
      ? (f.severity as Finding["severity"])
      : "low";
    const finding: Finding = {
      severity,
      category: typeof f.category === "string" ? f.category : "Code Quality",
      title: typeof f.title === "string" ? f.title : "(untitled finding)",
      detail: typeof f.detail === "string" ? f.detail : "",
    };
    if (typeof f.file === "string" && f.file) finding.file = f.file;
    return finding;
  });

  return { summary, verdict, score, findings };
}

export async function audit(snap: RepoSnapshot): Promise<AuditResult> {
  const { client, model } = detectClient();
  const prompt = buildPrompt(snap);

  const resp = await client.chat.completions.create({
    model,
    messages: [{ role: "user", content: prompt }],
    temperature: 0.2,
    max_tokens: 2048,
  });

  const raw = resp.choices[0]?.message?.content ?? "";
  let parsed: unknown;
  try {
    // strip any accidental markdown fencing
    const json = raw.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim();
    parsed = JSON.parse(json);
  } catch {
    throw new Error(`AI returned non-JSON response:\n${raw.slice(0, 500)}`);
  }

  return normalize(parsed);
}
