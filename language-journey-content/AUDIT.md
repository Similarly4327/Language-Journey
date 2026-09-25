# Migration and curriculum audit

The former app kept nearly all course content inside `index.html`. This migration extracted Level 1–3 kana, dakuten and numbers, the Level 4 and 5 lessons, Level 6–10 lessons, exercise seeds, course phases, milestones, skills and introductory dialogue into `content.js`. The browser now imports that file before running the existing UI. The storage key, version, lesson IDs, vocabulary IDs, ranks, mastery, error history, profile and flashcard state were not reset.

Current route inventory: 15 playable levels; Levels 1–10 remain the foundation; Level 11 is the at-home travel course; Level 12 airport arrival; Level 13 airport-to-hotel transit; Level 14 hotel check-in; and Level 15 shopping. Levels 16–20 are described as planned route placeholders (restaurant, Tokyo, Kyoto, leisure/karaoke, final travel day). The original supermarket lessons retain IDs `l11-1`–`l11-5` at Level 15. The at-home course adds 50 new vocabulary forms and the instruction registry; old Level 11 supermarket ranks and in-flight progress are explicitly mapped to Level 15, with storage version 7. The app registers 317 vocabulary forms and has 15 optional bonus readings. Levels 1–3 remain generated kana/numeric activities rather than lesson records.

Audit fixes:

- Level 8 lesson 2 modeled `きょう` before Level 8 lesson 3 introduced it. The question now uses the already-known `なんようび` form without `きょう`.
- Level 8 lesson 5 modeled and checked `いま` before Level 8 lesson 6 introduced it. The model and check now ask `なんじ です か` without `いま`.
- Level 10 reused `おちゃ` and `ケーキ` from Level 5; they retain their original vocabulary IDs. New-word counts in advanced lessons are derived from the actual first-introduction point.

Known limitations to resolve in a later UI/content pass:

- The app's Level 1–3 quiz generators, cumulative Level 4 generator, and Level 6–10 question generator still live in `index.html`. Their source lists and lesson seed data are central, but the generator algorithms have not been moved.
- Existing model and check payloads keep their legacy UI shapes behind the adapter. New Level 11 content should use explicit refs and a native renderer, not extend that legacy shape.
- Optional recorded Japanese audio is not yet available (there are no local recording assets); the validator reports an aggregate vocabulary audio-coverage warning. The instruction registry reserves `audioRef` fields but leaves them null. The app does not synthesize speech or call a network TTS service.
- Automated browser rendering was not run in this environment because npm/npx is unavailable. Node tests cover script parsing, level data adapters, storage key stability, migration of former supermarket progress, validation rules and the report; a visual/mobile pass is still required before a release.

Validation command: `node language-journey-content/validate.cjs` (zero errors; one audio warning at migration). Test command: `node --test`.
