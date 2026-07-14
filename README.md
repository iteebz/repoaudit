# repoaudit

Run it in any git repo. Get a security and quality score in seconds.

```bash
npx github:iteebz/repoaudit
```

No config. No install. Just a number and the issues behind it.

```
repoaudit — my-project

  B+    ████████████████░░░░  87/100

  Solid structure, good test coverage — tighten dependency hygiene.

  Share:   my-project scored B+ on repoaudit — npx github:iteebz/repoaudit
```

---

## What it does

Reads your tracked source files, git history, and `package.json`. Sends them to your AI provider. Returns a 0–100 score and the specific issues worth fixing, ordered by severity.

Nothing is stored. The only network call is to the AI provider you configure.

## Full report

```bash
npx github:iteebz/repoaudit --full
```

```
  [CRIT] API key read from unvalidated env var  src/config.ts
         Falls back to empty string when unset, silently disabling auth.

  [HIGH] No input validation on webhook handler  src/webhook.ts
         Request body parsed and trusted directly — add schema validation.
```

## Setup

repoaudit needs one AI key. Groq is free:

```bash
export GROQ_API_KEY=your_key   # free at console.groq.com
npx repoaudit
```

Auto-detects in order: `GROQ_API_KEY` (Groq, free) → `OPENROUTER_API_KEY` (OpenRouter) → `OPENAI_API_KEY` (OpenAI).

## Requirements

- Node 18+
- A git repository
- One AI key

## See also

**[README Scorecard](https://iteebz.github.io/readme-scorecard/)** — paste any public GitHub repo URL, get an instant README grade card. No install.

## License

MIT © iteebz
