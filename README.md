# repoaudit

AI-powered security & quality audit for any git repo. One command, findings in seconds — nothing to install, nothing to configure.

```bash
npx github:iteebz/repoaudit
```

> **Note:** once published to npm, this becomes `npx repoaudit`.

Run it inside any git repository. It reads your tracked source files, git history, and `package.json`, sends them to your AI provider, and prints an actionable audit: a 0–100 score and the specific issues worth fixing, ordered by severity.

## What you get

```
repoaudit — my-project

  B+    ████████████████░░░░  87/100

  Solid structure, good test coverage — tighten dependency hygiene.

All findings (9):

  [CRIT] API key read from unvalidated env var  src/config.ts
         Falls back to empty string when unset, silently disabling auth.

  [HIGH] No input validation on webhook handler  src/webhook.ts
         Request body parsed and trusted directly — add schema validation.

  [ MED] Outdated transitive dependency  package.json
         openai@4.x pulls a version with a known ReDoS advisory.

  … 6 more findings

  Share: my-project scored B+ on repoaudit — npx repoaudit
  No data leaves your machine except to your AI provider.
```

## Setup

repoaudit needs an AI key. It auto-detects, in order:

| Env var | Provider | Cost |
| --- | --- | --- |
| `GROQ_API_KEY` | Groq (Llama 3.3 70B) | **free** — [get a key](https://console.groq.com) |
| `OPENROUTER_API_KEY` | OpenRouter (Claude 3 Haiku) | pay-as-you-go |
| `OPENAI_API_KEY` | OpenAI (GPT-4o mini) | pay-as-you-go |

```bash
export GROQ_API_KEY=your_key_here
npx github:iteebz/repoaudit
```

## How it works

Runs entirely on your machine. It samples up to 40 tracked source files (4KB each), your last 20 commit messages, and `package.json`, then asks your AI provider for a structured audit. `node_modules`, `dist`, `.git`, and other build/vendor dirs are skipped. The only network call is to the AI provider you configured.

## Requirements

- Node 18+
- A git repository (run it from the repo root)
- One AI key (see Setup)

## License

MIT © iteebz
