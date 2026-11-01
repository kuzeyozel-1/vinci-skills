#!/usr/bin/env node
// Usage: node remind.mjs payments.json [--send]
import fs from "node:fs";
import { findDue, render, send, todayIn } from "./lib.mjs";
const file = process.argv[2];
if (!file) { console.error("Usage: remind.mjs payments.json [--send]"); process.exit(2); }
process.env.PAYMENT_LINK_SECRET ??= "dry-run-only-secret";
const today = todayIn(), due = findDue(JSON.parse(fs.readFileSync(file, "utf8")), today);
if (!due.length) { console.log(`${today}: nothing to remind.`); process.exit(0); }
const mail = render(due);
console.log(`${today}: ${due.length} item(s)\n  subject: ${mail.subject}`);
for (const d of due) console.log(`  - ${d.item.name} (${d.period}) due ${d.due}, diff ${d.diff}`);
if (process.argv.includes("--send")) { await send(mail, today); console.log("sent."); } else console.log("(dry run; add --send)");
