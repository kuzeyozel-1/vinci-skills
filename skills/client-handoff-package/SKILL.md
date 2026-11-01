---
name: client-handoff-package
description: Prepare a clean delivery package for a client project: audit the repo for leftovers (internal notes, AI/tool traces, secrets, local paths, TODOs), generate a .env.example, a client-facing README and a handoff PDF. Use when the user says "deliver to client", "handoff", "müşteriye teslim", "teslim paketi", "clean the repo before sending", or is about to zip/transfer/push a project to someone else.
---

# Client handoff package

A delivered codebase should contain **only what the client needs**: source, a short README, an env template, and a handoff document. Internal notes, assistant instruction files and any trace of tooling must not leave your machine.

## 1. Audit (read-only)

```bash
node scripts/audit.mjs <project-dir> [--json]
```

Exit code 1 when blockers exist. It flags:

| Class | Examples | Severity |
|---|---|---|
| Secrets | `.env*` (non-example), private key blocks, `AIza…`, `ghp_…`, `sk-…`, `AKIA…`, `xox[bp]-…` | blocker |
| Internal files | `CLAUDE.md`, `AGENTS.md`, `.claude/`, `.cursor/`, `docs/*notes*`, stray `*.md` other than README/LICENSE/CHANGELOG | blocker |
| Tool traces | `Co-Authored-By:`, "Generated with", "Claude", "Anthropic", "ChatGPT", "Copilot" in source or comments | blocker |
| Local paths | `/Users/…`, `C:\Users\…` | warning |
| Leftovers | `TODO`, `FIXME`, `console.log` in `src` | warning |

Also run `git log --format=%B | grep -i -E "co-authored|generated with"` if you deliver the git history; if traces exist, deliver a **fresh export** (`git archive HEAD -o delivery.zip`) instead of the repo.

## 2. Fix, then export

Remove or relocate blockers (keep internal notes outside the delivery directory). Deliver `git archive` output — it contains tracked files only, so ignored files such as `.env.local` and `node_modules` never travel.

## 3. Write the documents

Copy `templates/README.client.md`, `templates/env.example` and `templates/HANDOFF.md`, fill the placeholders (`{{…}}`). Keep language plain: the reader is the business owner, not a developer. Then:

```bash
node scripts/md-to-pdf.mjs HANDOFF.md HANDOFF.pdf
```

(Uses headless Chrome; supports headings, lists, tables, bold, code, links.)

## 4. Final check

Re-run the audit on the unzipped archive, open the PDF, and confirm the client can run the project from the README alone. Transfer credentials through a password manager or a separate channel — never inside the package.
