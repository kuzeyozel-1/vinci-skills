# Rules and why

| Code | Level | Rule | Why |
|---|---|---|---|
| title_long | error | title > 70 chars | truncated in results; ideal ≤ 60 |
| meta_missing / meta_long | error | meta empty or > 160 | snippet quality |
| slug_invalid | error | slug not `[a-z0-9-]` | URL stability, no locale characters |
| h1_in_body | error | `<h1>` inside body | template already renders the title |
| heading_skip | error | H3 before any H2 | broken outline |
| faq_missing | error (blog) | no "FAQ" H2 | answer engines quote Q&A blocks |
| bold_heading / bold_whole_paragraph | error | bold inside headings or most of a paragraph | bold is for names, numbers, decisions |
| bad_link_text | error | "click here", "read more" | accessibility, SEO |
| external_rel | error | external link without noopener | security |
| locale_link | error | `/en/` link in default-language post or the reverse | broken language switching |
| banned_phrase | error | phrase in banned list | brand voice, unverifiable claims |
| script_embed | error | `<script>`, `<iframe>`, `on*=` | injection surface |
| img_alt | error | image without alt | accessibility |
| source_not_linked | error (news) | primary source URL absent from body | attribution |
| first_paragraph | warning | not 20–90 words | answer-first |
| long_paragraph | warning | > 130 words | readability |
| words_out_of_range | warning | outside profile range | depth |
| relative_date | warning (news) | "yesterday", "last week" | goes stale |
| keyword_* | warning | missing in title/meta/first 100 words/H2, density > 2.5% | placement without stuffing |
| parity | warning | H2/link/FAQ counts or length differ between languages | translation drift |
