# Storage options

- **JSON file** (above): fine for one person; the "mark paid" endpoint rewrites the file, so host it somewhere with a writable disk.
- **Firestore** (serverless): collection `payments`, same fields. Mark paid: `update({ paidPeriods: FieldValue.arrayUnion(period) })` for monthly, `update({ paid: true })` for once. Use the Admin SDK server-side only.
- **Any SQL**: table `payments` + table `payment_periods(payment_id, period)`.

Monthly items reset themselves: a new month simply has no entry in `paidPeriods`.
