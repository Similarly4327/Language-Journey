# Language Journey content registry

`content.js` is the portable, browser-ready source of truth for the current curriculum. It exports `LanguageJourneyContent` in the browser and a CommonJS module for Node. The app loads it before its UI script. No server, bundler, cloud account or runtime speech service is required.

The manifest has `schemaVersion` and `contentVersion`. Keep stable IDs when editing: saved ranks use lesson IDs such as `l4-1`, and saved vocabulary mastery/flashcards use `vocab-ねこ`-style IDs. Do not rename an ID just to change display text. Historical Level 4 words remain in `vocabulary` as `coreOrContext: "legacy"` to keep old progress readable, but they are excluded from new lessons and `getKnowledgeState`.

## Structure

- `levels`, `lessons`, `exercises`, `readings`, `bonus`: course route and learning activities.
- `vocabulary`: one canonical word record per Japanese form. Lessons use `wordIds` or `exampleIds`; the adapter materializes the old tuple shape solely for the current UI.
- `grammar`, `patterns`, `kana`, `kanji`, `numbers`: separately addressable knowledge. The `kanji` registry currently contains Level 1 numeric writing; lexical kanji forms can be introduced later on an already-known vocabulary ID.
- `audio`: speaker registry (`ren`, `miku`) and local asset metadata. Missing optional recordings produce a warning, not a broken lesson. Never call browser TTS at runtime as a substitute.
- `getKnowledgeState(point)`: cumulative snapshot of vocabulary, grammar, kana, kanji and sentence patterns. Examples: `4-1`, `10-complete`, and future `11-1-A`. `foundationSnapshot` is the state after Level 10.

`introducedAt` says when the learner is actually taught an item; `availableFrom` allows later reuse. A reading can declare `contextVocabIds`, each with a matching `contextIntroductions` entry containing kana, romaji and Dutch meaning to display before the reading. Context words are not automatically core exam requirements. For a word first learned in kana and later shown with kanji, retain its vocabulary ID and set `kanjiForm` plus a later `kanjiIntroducedAt`; do not count it as a new word.

## Authoring workflow

1. Copy `templates/level-11.template.json` to plan a new level. It is a template, not active content.
2. Add new canonical records and references to `content.js`, preserving all existing IDs.
3. Include one clear grammar objective per lesson; ensure models, builders, checks and readings contain only known elements or explicitly introduced context elements.
4. Run `npm run validate-content`, `npm run curriculum:report`, and `npm test`. If npm is unavailable but Node exists, run the scripts directly with `node language-journey-content/validate.cjs`, `node language-journey-content/report.cjs`, and `node --test`.
5. Check mobile UI, back navigation, saved progress and flashcard directions in a browser before release.

The validator emits `ERROR`, `WARNING`, `INFO` and `SUMMARY`. Errors fail the command. Warnings require an editorial decision. Its text token check is intentionally conservative: it detects exact known vocabulary tokens in models, readings and exercise prompts/answers; it does not linguistically parse arbitrary Japanese. Human review remains necessary.

See `AUDIT.md` for the migration inventory and remaining adapter work. See `AGENTS.md` for future Codex editing guardrails.
