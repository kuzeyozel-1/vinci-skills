#!/usr/bin/env node
// Bulk-change template. Dry run by default; --write applies. Run: node --env-file=.env.local this.mjs [--write]
import fs from "node:fs";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const TARGET = "posts";                                   // collection to scan
const match = (d) => typeof d.content === "string" && d.content.includes("/old-path/");   // which docs need changing
const change = (d) => ({ content: d.content.replaceAll("/old-path/", "/new-path/") });    // fields to update (must be idempotent)

const WRITE = process.argv.includes("--write");
const fix = (v) => (v ?? "").trim().replace(/^["']|["']$/g, "").replace(/\\n/g, "\n");
const need = ["FIREBASE_ADMIN_PROJECT_ID", "FIREBASE_ADMIN_CLIENT_EMAIL", "FIREBASE_ADMIN_PRIVATE_KEY"].filter((k) => !process.env[k]);
if (need.length) { console.error(`Missing env: ${need.join(", ")}`); process.exit(2); }
const app = getApps()[0] ?? initializeApp({ credential: cert({ projectId: process.env.FIREBASE_ADMIN_PROJECT_ID, clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL, privateKey: fix(process.env.FIREBASE_ADMIN_PRIVATE_KEY) }) });
const db = getFirestore(app);

const snap = await db.collection(TARGET).get();
const hits = snap.docs.filter((d) => match(d.data()));
console.log(`${TARGET}: ${snap.size} scanned, ${hits.length} to change${WRITE ? "" : " (dry run)"}`);
for (const d of hits.slice(0, 5)) console.log(`  - ${d.id}  fields: ${Object.keys(change(d.data())).join(", ")}`);
if (!WRITE || hits.length === 0) process.exit(0);

fs.mkdirSync("backups", { recursive: true });
const file = `backups/${TARGET}-${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
fs.writeFileSync(file, JSON.stringify(hits.map((d) => ({ id: d.id, data: d.data() })), null, 1));
console.log(`backup → ${file}`);

let batch = db.batch(), n = 0, total = 0;
for (const d of hits) {
  batch.update(d.ref, change(d.data())); n++; total++;
  if (n === 400) { await batch.commit(); batch = db.batch(); n = 0; console.log(`  committed ${total}`); }
}
if (n) await batch.commit();
console.log(`✓ updated ${total} document(s). Re-run without --write: expect 0.`);
