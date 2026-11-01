# Publish step template (Firestore Admin SDK)

Default to **draft**; require an explicit `--publish` flag. Skip when a document with the same slug+locale exists. Refuse to publish without a cover image.

```ts
// npx tsx --env-file=.env.local publish.ts <folder> [--publish]
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";

const fix = (v?: string) => (v ?? "").trim().replace(/^["']|["']$/g, "").replace(/\\n/g, "\n");
const dir = resolve(process.argv[2]);
const publish = process.argv.includes("--publish");
const { notes } = JSON.parse(readFileSync(join(dir, "notes.json"), "utf8"));
const app = getApps()[0] ?? initializeApp({ credential: cert({
  projectId: process.env.FIREBASE_ADMIN_PROJECT_ID!, clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL!, privateKey: fix(process.env.FIREBASE_ADMIN_PRIVATE_KEY) }) });
const db = getFirestore(app);

for (const n of notes) {
  const dup = await db.collection("posts").where("slug", "==", n.slug).get();
  if (dup.docs.some((d) => (d.data().locale ?? "tr") === n.locale)) { console.log("skip", n.slug); continue; }
  const other = notes.find((o: any) => o.locale !== n.locale);
  await db.collection("posts").add({
    slug: n.slug, locale: n.locale, title: n.title, content: readFileSync(join(dir, n.file), "utf8").trim(),
    alternateSlug: other?.slug ?? "", status: publish ? "published" : "draft",
    publishedAt: publish ? new Date().toISOString() : null, seo: { metaDescription: n.meta },
  });
  console.log(publish ? "published" : "draft", n.locale, n.slug);
}
```

Before a large batch, search existing posts for the same topic — documents without a `locale` field will not match `where("locale","==","tr")`.
