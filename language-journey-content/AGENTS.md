# Content editing guardrails

- Treat `content.js` as the canonical curriculum source. Add words once to `manifest.vocabulary` and refer to their stable IDs from lessons, exercises and readings. Do not reintroduce a known word under a new ID.
- Preserve existing `l*-*`, `vocab-*`, rank and storage IDs. Never clear or rewrite localStorage to accompany a content edit.
- Put new content in `manifest` rather than hardcoding it in `index.html`. Keep the legacy tuple adapter only for existing UI compatibility.
- Run content validation, the report and tests after each curriculum edit; correct every error and review warnings. Inspect rendered lessons as well when browser tooling is available.
- Distinguish core teaching from optional context vocabulary and optional bonus. A bonus must never become a completion prerequisite by accident.
- Record only static, local audio assets with a valid speaker ID. Do not add runtime TTS, a backend, or network requirements.
- Follow the root `AGENTS.md` rules for Level 4/5 teaching, navigation, saved progress and avatars.
