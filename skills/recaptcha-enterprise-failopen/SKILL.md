---
name: recaptcha-enterprise-failopen
description: Server-side verification for Google reCAPTCHA Enterprise (v2 checkbox and v3 score) via the Assessment API using a service account, with an explicit fail-open policy for public lead forms and fail-closed for login. Also explains the classic-vs-Enterprise key mismatch (`invalid-input-response`) that silently blocks every form. Use when the user says "reCAPTCHA", "form always rejected", "invalid-input-response", "Fraud Defense keys", "captcha fail open", or when forms stop converting after adding a captcha.
---

# reCAPTCHA Enterprise verification (fail-open for leads)

## Diagnose first

| Symptom | Cause | Fix |
|---|---|---|
| Every submission rejected with `invalid-input-response` although the widget works | Keys were created in **Google Cloud reCAPTCHA Enterprise / Fraud Defense**, but code calls the classic `siteverify` endpoint with a "secret key" | Use the **Assessment API** (below). Enterprise keys have no classic secret. |
| `invalid-input-secret` | Secret is wrong (classic keys) | Re-copy the secret, check env scope (production vs preview) |
| `SITE_MISMATCH` / `BROWSER_ERROR` | Domain not in the key's allowed domains (add `localhost` for dev), or widget/site key mismatch | Fix key settings; don't block users for config errors |
| 403 from Assessment API | Service account lacks role | Grant **reCAPTCHA Enterprise Agent** to the account and enable the API |

Platform secret variables of type "secret" cannot be read back with env-pull tools; when unsure, read the server logs.

## Policy

- **Public lead forms: fail open.** If Google is unreachable, quota is exhausted, or the service account lacks permission, accept the submission and log loudly. Honeypot field + per-IP rate limit still protect you. Losing a customer costs more than letting an occasional bot through.
- **Login / admin / money movement: fail closed.** Reject when verification cannot complete.
- Config errors (`SITE_MISMATCH`, `BROWSER_ERROR`) are *your* bug: log, don't punish the user.
- v3 score threshold starts at 0.5; log scores for two weeks before tightening.

## Code

`scripts/verify.mjs` is framework-neutral: it needs an `getAccessToken()` function (for a Firebase/GCP service account, e.g. `google-auth-library` or the Admin SDK credential) and the project id.

```js
import { verifyV2, verifyV3 } from "./verify.mjs";
const ok = await verifyV3({ token, siteKey, projectId, expectedAction: "contact", getAccessToken });          // lead form → fail-open
const ok2 = await verifyV3({ token, siteKey, projectId, expectedAction: "login", getAccessToken, failClosed: true });
```

Run `node scripts/verify.mjs --selftest` to see the policy matrix pass against a mocked Google endpoint.

Never log tokens; never expose the service-account key to the browser.
