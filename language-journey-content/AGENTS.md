# Content editing guardrails

- Treat `content.js` as the canonical curriculum source. Add words once to `manifest.vocabulary` and refer to their stable IDs from lessons, exercises and readings. Do not reintroduce a known word under a new ID.
- Preserve existing `l*-*`, `vocab-*`, rank and storage IDs. Never clear or rewrite localStorage to accompany a content edit.
- Put new content in `manifest` rather than hardcoding it in `index.html`. Keep the legacy tuple adapter only for existing UI compatibility.
- Run content validation, the report and tests after each curriculum edit; correct every error and review warnings. Inspect rendered lessons as well when browser tooling is available.
- Distinguish core teaching from optional context vocabulary and optional bonus. A bonus must never become a completion prerequisite by accident.
- Record only static, local audio assets with a valid speaker ID. Do not add runtime TTS, a backend, or network requirements.
- Follow the root `AGENTS.md` rules for Level 4/5 teaching, navigation, saved progress and avatars.
- For new lessons, levels and optional routes, compare each Dutch base gloss with existing vocabulary before publication. Use a concise `lessonMeaning` on the canonical vocabulary entry where there is a useful distinction. It can be a string or a map with `default` and existing lesson IDs for different contexts. Keep `meaning` and `meanings` fit for assessment.
- Use `dictionaryUsage` for the wider explanation: a `note`, existing `relatedIds`, optional alternative senses under `also` (`meaning` and `description`) and useful examples with `japanese`, kana `reading` and a Dutch `translation`. Verify the nuance, readings and examples in context. Keep alternate senses out of new mandatory questions or Recall cards.
- Run `npm run validate-content` and review the `REVIEW_*` diagnostics. Identical base glosses, missing romaji and missing details on context-sensitive words are review signals. Set `contextSensitive: true` for words or grammar that need that review even without a matching gloss. Correct genuine ambiguities and preserve legitimate overlap.
