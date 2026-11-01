// Framework-neutral reCAPTCHA Enterprise verification. See SKILL.md for the fail-open/closed policy.
const V3_THRESHOLD = 0.5;

async function assess({ token, siteKey, projectId, expectedAction, getAccessToken, fetchImpl = fetch, failClosed = false }) {
  if (!projectId) return { ok: false };
  const outcome = failClosed ? "request rejected" : "request allowed";
  try {
    const res = await fetchImpl(`https://recaptchaenterprise.googleapis.com/v1/projects/${projectId}/assessments`, {
      method: "POST",
      headers: { Authorization: `Bearer ${await getAccessToken()}`, "Content-Type": "application/json" },
      body: JSON.stringify({ event: { token, siteKey, ...(expectedAction ? { expectedAction } : {}) } }),
    });
    if (!res.ok) { console.error(`reCAPTCHA Enterprise call failed (${outcome}):`, res.status, (await res.text()).slice(0, 200)); return { ok: false }; }
    return { ok: true, assessment: await res.json() };
  } catch (e) { console.error(`reCAPTCHA Enterprise error (${outcome}):`, e?.message ?? e); return { ok: false }; }
}

/** v2 checkbox. Fails open when Google is unreachable or the key is misconfigured. */
export async function verifyV2(opts) {
  if (!opts.siteKey) return true;           // not configured → skip
  if (!opts.token) return false;            // widget not completed
  const r = await assess(opts);
  if (!r.ok) return true;
  const tp = r.assessment.tokenProperties;
  if (tp?.valid) return true;
  if (tp?.invalidReason === "BROWSER_ERROR" || tp?.invalidReason === "SITE_MISMATCH") { console.error("reCAPTCHA key configuration problem (allowed):", tp.invalidReason); return true; }
  console.error("reCAPTCHA v2 rejected:", tp?.invalidReason);
  return false;
}

/** v3 score. `failClosed: true` for login-like actions. */
export async function verifyV3(opts) {
  const failClosed = opts.failClosed === true;
  if (!opts.siteKey) return true;
  if (!opts.token) return false;
  const r = await assess({ ...opts, failClosed });
  if (!r.ok) return !failClosed;
  const { tokenProperties: tp, riskAnalysis: ra } = r.assessment;
  if (!tp?.valid) { console.error("reCAPTCHA v3 invalid token:", tp?.invalidReason); return false; }
  if (opts.expectedAction && tp.action !== opts.expectedAction) { console.error("reCAPTCHA v3 action mismatch:", tp.action); return false; }
  const score = ra?.score ?? 0;
  if (score < (opts.threshold ?? V3_THRESHOLD)) { console.error("reCAPTCHA v3 low score:", score, ra?.reasons); return false; }
  return true;
}

// node verify.mjs --selftest
if (process.argv.includes("--selftest")) {
  const mk = (status, body) => async () => ({ ok: status < 400, status, text: async () => JSON.stringify(body), json: async () => body });
  const base = { token: "t", siteKey: "k", projectId: "p", getAccessToken: async () => "x" };
  const cases = [
    ["v2 valid", () => verifyV2({ ...base, fetchImpl: mk(200, { tokenProperties: { valid: true } }) }), true],
    ["v2 google down → open", () => verifyV2({ ...base, fetchImpl: mk(503, {}) }), true],
    ["v2 SITE_MISMATCH → open", () => verifyV2({ ...base, fetchImpl: mk(200, { tokenProperties: { valid: false, invalidReason: "SITE_MISMATCH" } }) }), true],
    ["v2 invalid token → reject", () => verifyV2({ ...base, fetchImpl: mk(200, { tokenProperties: { valid: false, invalidReason: "MALFORMED" } }) }), false],
    ["v3 good score", () => verifyV3({ ...base, expectedAction: "contact", fetchImpl: mk(200, { tokenProperties: { valid: true, action: "contact" }, riskAnalysis: { score: 0.9 } }) }), true],
    ["v3 low score → reject", () => verifyV3({ ...base, expectedAction: "contact", fetchImpl: mk(200, { tokenProperties: { valid: true, action: "contact" }, riskAnalysis: { score: 0.1 } }) }), false],
    ["v3 google down, lead → open", () => verifyV3({ ...base, fetchImpl: mk(500, {}) }), true],
    ["v3 google down, login → closed", () => verifyV3({ ...base, failClosed: true, fetchImpl: mk(500, {}) }), false],
    ["no token → reject", () => verifyV3({ ...base, token: "", fetchImpl: mk(200, {}) }), false],
  ];
  const origErr = console.error; console.error = () => {};
  let bad = 0; for (const [name, run, want] of cases) { const got = await run(); if (got !== want) bad++; console.log(`${got === want ? "✓" : "✗"} ${name}`); }
  console.error = origErr; process.exit(bad ? 1 : 0);
}
