# vinci-skills

Practical agent skills from a small web & marketing studio. Each skill is a folder with a `SKILL.md` (Claude Code / agent-skills format), small dependency-light scripts, and a tested example.
Küçük bir web ve pazarlama stüdyosunun gerçek işlerden çıkan, test edilmiş ajan skill'leri. / *Türkçe açıklamalar aşağıda.*

## Install / Kurulum

```bash
npx skills add kuzeyozel-1/vinci-skills                          # all skills / hepsi
npx skills add kuzeyozel-1/vinci-skills --skill bilingual-content-gate   # one skill / tek skill
# or copy a folder into .claude/skills/ / ya da klasörü .claude/skills/ altına kopyalayın
```

## Skills / Skill'ler

| Skill | What it does | Ne yapar |
|---|---|---|
| [bilingual-content-gate](skills/bilingual-content-gate) | Pre-publish quality gate for bilingual blog/news HTML (headings, FAQ, links, banned phrases, TR↔EN parity) | İki dilli blog/haber için yayın öncesi kalite kapısı |
| [instagram-carousel-renderer](skills/instagram-carousel-renderer) | Branded 1080×1350 carousel PNG + PDF + caption from JSON; text drawn by code | JSON'dan markalı carousel (PNG+PDF+açıklama), yazı kodla basılır |
| [client-handoff-package](skills/client-handoff-package) | Audit a repo for leftovers/secrets/tool traces, then build README, env template and handoff PDF | Müşteri teslimi öncesi temizlik denetimi + README/env/PDF |
| [remotion-video-pipeline](skills/remotion-video-pipeline) | Footage → proxies → contact sheets → Remotion promo videos, with the pitfalls list | Ham çekim → proxy → kontak sayfası → Remotion tanıtım videosu |
| [sourced-price-calibration](skills/sourced-price-calibration) | Calibrate calculator prices from ≥3 published sources, with confidence flags and citations | Fiyat hesaplayıcıyı yayınlanmış kaynaklardan kalibre eder |
| [payment-reminder-resend](skills/payment-reminder-resend) | Sparse unpaid-bill reminder emails (Resend) with signed one-click "mark paid" links | Ödenmemiş faturalar için seyrek hatırlatma e-postası (Resend) |
| [ssr-animation-lcp-diagnosis](skills/ssr-animation-lcp-diagnosis) | Find elements shipped invisible in SSR HTML (Framer Motion `initial`) that delay LCP; CSS-only fix | SSR'da görünmez basılan animasyonların LCP'yi bozmasını teşhis eder |
| [firestore-bulk-script-pattern](skills/firestore-bulk-script-pattern) | Dry-run-first, backup-first, batched Firestore bulk changes template | Firestore toplu değişiklik şablonu (önce kuru çalışma, yedek, batch) |
| [recaptcha-enterprise-failopen](skills/recaptcha-enterprise-failopen) | reCAPTCHA Enterprise Assessment API verification: fail-open for forms, fail-closed for login | reCAPTCHA Enterprise doğrulaması: formda fail-open, girişte fail-closed |

## Notes / Notlar

- Scripts use plain Node 18+ unless a skill says otherwise; headless Chrome is needed for the carousel and PDF tools.
- No credentials are included. Anything that needs keys reads environment variables.
- Betikler Node 18+ ile çalışır; carousel ve PDF araçları için Chrome gerekir. Hiçbir anahtar/parola içermez.

License: MIT.
