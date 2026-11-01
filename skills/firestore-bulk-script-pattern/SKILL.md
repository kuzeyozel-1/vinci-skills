---
name: firestore-bulk-script-pattern
description: Safe pattern for one-off bulk changes to Firestore (or any document DB) from a local script — dry-run by default, explicit --write, JSON backup before changes, batched commits under the 500-write limit, idempotent re-runs, and Admin SDK init that works in plain Node/tsx without framework imports. Use when the user says "bulk update Firestore", "migrate documents", "fix all posts", "toplu güncelleme", "one-off script", or any change touching many documents.
---

# Firestore bulk-script pattern

Every mass change is a small, named script kept in the repo as a historical record. The shape never changes:

1. **Dry run is the default.** The script prints what it *would* change (count + 5 samples + a diff of one doc). Writing requires `--write`.
2. **Backup first.** Before any write, dump the affected docs (id + data) to `backups/<name>-<timestamp>.json`. Restoring is then a script, not a prayer.
3. **Idempotent.** Re-running must not double-apply (check the new state before writing; use `FieldValue.arrayUnion` not read-modify-write on arrays).
4. **Batched.** `db.batch()` holds ≤ 500 writes; commit every 400.
5. **Self-contained init.** Do not import app code (`server-only` modules explode in plain Node). Initialise Admin SDK inline and normalise the private key (`\\n` → newline, strip quotes).
6. **Read narrowly.** Use `.select(...)` for the fields you need when scanning big collections, and query by indexed fields.
7. **Verify after.** Re-run the dry run; it must report 0 changes.

## Use

```bash
cp template/bulk-template.mjs scripts/fix-something.mjs
# edit TARGET (collection), match() and change()
node --env-file=.env.local scripts/fix-something.mjs            # dry run
node --env-file=.env.local scripts/fix-something.mjs --write    # apply
```

Requires `npm i firebase-admin` in the host project. Required env: `FIREBASE_ADMIN_PROJECT_ID`, `FIREBASE_ADMIN_CLIENT_EMAIL`, `FIREBASE_ADMIN_PRIVATE_KEY` (service-account values; never commit them).

## Gotchas

- Admin SDK **bypasses security rules** — the script is the only guard; keep the dry run honest.
- Documents created before a field existed do not match `where(field, "==", default)`. Scan and filter in code when a field may be missing.
- `.env.local` and production often point to the **same** database: a "local" run is a production write.
- Timestamps: write `FieldValue.serverTimestamp()` or ISO strings consistently with what the app reads.
