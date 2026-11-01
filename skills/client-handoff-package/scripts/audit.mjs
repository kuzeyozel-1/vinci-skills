#!/usr/bin/env node
// Read-only pre-delivery audit. Usage: node audit.mjs <dir> [--json]
import fs from "node:fs"; import path from "node:path";
const root = path.resolve(process.argv[2] ?? "."); const asJson = process.argv.includes("--json");
if (!fs.existsSync(root)) { console.error("Directory not found"); process.exit(2); }
const SKIP = new Set(["node_modules", ".git", ".next", "dist", "build", ".turbo", ".vercel", "coverage", ".venv", "__pycache__"]);
const TEXT = /\.(m?[jt]sx?|json|css|scss|html?|md|txt|ya?ml|toml|sh|py|sql|env.*|swift|kt|java|go|rs|php|rb|vue|svelte)$/i;
const INTERNAL_NAMES = /^(CLAUDE\.md|AGENTS\.md|GEMINI\.md|\.cursorrules|\.windsurfrules|copilot-instructions\.md)$/i;
const INTERNAL_DIRS = new Set([".claude", ".cursor", ".agents", ".windsurf", ".codex"]);
const ALLOWED_MD = /^(README|LICENSE|CHANGELOG|CONTRIBUTING|HANDOFF|SECURITY)(\.[\w-]+)?\.md$/i;
const SECRETS = [[/-----BEGIN [A-Z ]*PRIVATE KEY-----/, "private key block"], [/\bAIza[0-9A-Za-z_\-]{35}\b/, "Google API key"], [/\bghp_[0-9A-Za-z]{30,}\b/, "GitHub token"], [/\bsk-[A-Za-z0-9]{20,}\b/, "secret key (sk-…)"], [/\bAKIA[0-9A-Z]{16}\b/, "AWS access key"], [/\bxox[bp]-[0-9A-Za-z-]{20,}\b/, "Slack token"], [/\bre_[A-Za-z0-9]{20,}\b/, "Resend key"]];
const TRACES = [/Co-Authored-By:/i, /Generated with/i, /\bClaude\b/, /\bAnthropic\b/i, /\bChatGPT\b/, /\bOpenAI\b/, /\bCopilot\b/, /\bCodex\b/];
const PATHS = /(\/Users\/[A-Za-z0-9._-]+|[A-Z]:\\Users\\[A-Za-z0-9._-]+)/;
const findings = [];
const add = (severity, kind, file, detail) => findings.push({ severity, kind, file: path.relative(root, file), detail });
function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) { if (INTERNAL_DIRS.has(e.name)) { add("blocker", "internal-dir", p, "tooling directory must not be delivered"); continue; } if (!SKIP.has(e.name)) walk(p); continue; }
    if (/^\.env/.test(e.name) && !/example|sample|template/i.test(e.name)) add("blocker", "env-file", p, "environment file with real values");
    if (INTERNAL_NAMES.test(e.name)) add("blocker", "internal-file", p, "assistant/tool instruction file");
    if (/\.md$/i.test(e.name) && !ALLOWED_MD.test(e.name) && !INTERNAL_NAMES.test(e.name)) add("blocker", "stray-markdown", p, "internal notes? only README/LICENSE/CHANGELOG/HANDOFF belong in a delivery");
    if (!TEXT.test(e.name) || fs.statSync(p).size > 1_500_000) continue;
    const lines = fs.readFileSync(p, "utf8").split("\n");
    lines.forEach((ln, i) => {
      for (const [re, name] of SECRETS) if (re.test(ln)) add("blocker", "secret", p, `${name} (line ${i + 1})`);
      if (!/\.md$/i.test(p) || !ALLOWED_MD.test(e.name)) for (const re of TRACES) if (re.test(ln)) { add("blocker", "tool-trace", p, `matches ${re} (line ${i + 1})`); break; }
      if (PATHS.test(ln)) add("warning", "local-path", p, `line ${i + 1}`);
      if (/\b(TODO|FIXME|XXX)\b/.test(ln)) add("warning", "leftover", p, `line ${i + 1}: ${ln.trim().slice(0, 60)}`);
    });
  }
}
walk(root);
const blockers = findings.filter((f) => f.severity === "blocker");
if (asJson) console.log(JSON.stringify(findings, null, 2));
else {
  for (const f of findings) console.log(`${f.severity === "blocker" ? "BLOCKER" : "warning"}  ${f.kind.padEnd(14)} ${f.file}  ${f.detail}`);
  console.log(`\n${blockers.length} blocker(s), ${findings.length - blockers.length} warning(s).${blockers.length ? " Fix blockers before delivery." : " Clean."}`);
}
process.exit(blockers.length ? 1 : 0);
