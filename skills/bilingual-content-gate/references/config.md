# Config file

All keys optional; unspecified keys use defaults in `scripts/check.mjs`.

```json
{
  "siteHosts": ["example.com"],
  "enPrefix": "/en",
  "servicePathPattern": "^/(en/)?(services|hizmetler)\\b",
  "profiles": { "blog": { "words": [900, 2200], "h2": [5, 12], "internal": [3, 8], "external": [1, 4], "boldMax": 14, "faq": [4, 6] } },
  "banned": { "en": ["world-class", "cutting-edge", "guaranteed #1"], "tr": ["sektör lideri", "garantili 1. sıra"] }
}
```

`siteHosts` decides which absolute links count as internal. `enPrefix` is the path prefix of the second language; the default language has no prefix.
