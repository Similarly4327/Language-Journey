# Migration and curriculum audit

The former app kept nearly all course content inside `index.html`. This migration extracted Level 1–3 kana, dakuten and numbers, the Level 4 and 5 lessons, Level 6–10 lessons, exercise seeds, course phases, milestones, skills and introductory dialogue into `content.js`. The browser now imports that file before running the existing UI. The storage key, version, lesson IDs, vocabulary IDs, ranks, mastery, error history, profile and flashcard state were not reset.

Inventory at migration: 10 playable levels; 41 lessons in Levels 4–10; 156 word records (133 active core, 23 historical compatibility); 31 grammar entries; 34 patterns; 146 explicit exercise seeds; four readings; 15 numeric-writing records; zero bonus items and zero recorded audio assets. Levels 1–3 are generated kana/numeric activities rather than lesson records. Level 11 remains a schema/template only.

Audit fixes:

- Level 8 lesson 2 modeled `きょう` before Level 8 lesson 3 introduced it. The question now uses the already-known `なんようび` form without `きょう`.
- Level 8 lesson 5 modeled and checked `いま` before Level 8 lesson 6 introduced it. The model and check now ask `なんじ です か` without `いま`.
- Level 10 reused `おちゃ` and `ケーキ` from Level 5; they retain their original vocabulary IDs. New-word counts in advanced lessons are derived from the actual first-introduction point.

Known limitations to resolve in a later UI/content pass:

- The app's Level 1–3 quiz generators, cumulative Level 4 generator, and Level 6–10 question generator still live in `index.html`. Their source lists and lesson seed data are central, but the generator algorithms have not been moved.
- Existing model and check payloads keep their legacy UI shapes behind the adapter. New Level 11 content should use explicit refs and a native renderer, not extend that legacy shape.
- Optional recorded audio is not yet available; the validator reports one aggregate warning for 133 core words with no recording. It does not synthesize speech.
- Automated browser rendering was not run in this environment because npm/npx is unavailable. Node tests cover script parsing, all level data adapters, storage key stability, validation rules and the report; a visual/mobile pass is still required before a release.

Validation command: `node language-journey-content/validate.cjs` (zero errors; one audio warning at migration). Test command: `node --test`.
