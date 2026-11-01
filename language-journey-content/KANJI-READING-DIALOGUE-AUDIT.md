# Kanji, reading help, conversations and JLPT audit

Audit date: 2026-11-01. This is an additive correction to the existing implementation. Vocabulary remains canonical in `content.js`; orthography never adds a second Recall card, mastery item or reading.

Follow-up: the internal N5–N3 guideline document supersedes unrestricted reading help during questions. Active targets and every answer option now suppress kana/Dictionary helpers; feedback and ordinary reading retain the appropriate support. The new internal evidence contract and its explicit limits are documented in `docs/jlpt/internal-guideline.md`.

## Orthography route

| Existing word ID | Kana | Form | Explicit teaching point |
| --- | --- | --- | --- |
| `vocab-わたし` | わたし | 私 | 11-1-A |
| `vocab-ひと` | ひと | 人 | 12-1-A, only when the word is already known |
| `vocab-でんしゃ` | でんしゃ | 電車 | 13-1-A |
| `vocab-えき` | えき | 駅 | 13-1-A |
| `vocab-みず` | みず | 水 | 14-1-A, only when the word is already known |
| `vocab-country-japan` | にほん | 日本 | Deferred until a natural context after Level 12 exists |

The former 12-5-A Japan spelling introduction repeated the initial arrival context and was too early for the corrected route. Level 12 now retains にほん throughout. No natural later Japan reuse exists in the current Levels 13–15, so no replacement date or artificial sentence is invented. `kanjiForm` remains available as Dictionary search metadata, but the article, lessons, options and Recall do not reveal it. A historical stored exposure remains saved, without overriding the corrected teaching gate. The unscheduled-form validation warning is intentional and records this open curriculum decision.

Known vocabulary and explicitly acknowledged spelling are separate gates. A saved rank alone never acknowledges kanji; an exposure ID alone never establishes vocabulary knowledge. Lower-level lessons retain kana even when revisited after later kanji exposure. Quick checks do not introduce spellings. The validator rejects orthography scheduled before or at the same point as a new lexeme.

Reading help reveals kana only, attached to an entire spaced lexical token: 電車 → でんしゃ. It handles sentence punctuation, quotes and parentheses without replacing substrings inside longer words. Options keep the help control outside the answer button, with room for the existing audio button on mobile. Tapping help changes only the native disclosure state, closes other open reading disclosures and leaves grading, error history, ranks, word introduction and both Recall SRS directions untouched. Recall keeps its existing Copper/source eligibility and canonical `vocab-*::direction` keys.

## Genuine conversations

Existing conversations already cover the Level 8 time exchange; Level 9 location/action exchanges; Level 10 directions; and contextual Levels 12–14 conversations. A/B are logical turns: the selected companion is lead A, the other gender is B, and existing playback maps them to the configured distinct voice roles. Missing reviewed local audio fails closed.

The Level 15 checkout source (`l11-4`, preserved historical ID) was the remaining genuine labeled exchange rendered as a single passage. It now references `dialogue-l11-4-B` and shows its original three turns, with Winkelmedewerker/Klant function labels and the existing companion names. The source passage and reading ID remain available for existing exercises/audio. The batch planner requests both configured voices for every dialogue line, without generating or approving recordings automatically.

Level 7 counter examples, Level 11 UI instructions, signs, isolated model sentences and multiple-choice UI exchanges are not reclassified as conversations. The Level 8 multiple-choice time response remains an exercise; the actual authored model exchange is the dialogue.

## JLPT evidence boundary

The existing benchmark selector already suppresses overall and domain percentages until the underlying domain is reviewed. Vocabulary introduction and both SRS directions are evidence for linked vocabulary only; they cannot manufacture kanji, grammar, reading, listening or overall proficiency. The UI retains In opbouw/Nog niet in kaart and labeled linked-word counts. No numerical JLPT score was added. Remaining work is reviewed benchmark/domain evidence, rather than a cosmetic percentage repair.

## Verification and reviewed warnings

Focused tests cover explicit introductions/reload; earlier lesson and future gates; the Japan/counter distinction and deferral; whole lexical tokens; score-neutral kana-only helper clicks; canonical Recall scheduling in both directions; the checkout source and A/B batch jobs; and original dialogue lesson boundaries. Existing JLPT tests cover read-only rendering, incomplete-domain suppression and unsupported-score prevention.

Run `node language-journey-content/validate.cjs`, `node language-journey-content/report.cjs` and `node --test` after curriculum edits. Current validation has zero errors. Besides intentional Japan deferral, warnings concern the existing optional-audio metadata coverage and the existing unused `vocab-ついたち`, `vocab-ふつか`, `vocab-みっか` entries. Their IDs and saved history are preserved.

Verification for this correction: all 219 tests pass, including the all-level render smoke tests, and the curriculum report completes. A rendered browser pass remains unavailable: the connected browser cannot reach the local static server and does not permit file navigation. No additional dependency or browser setup was installed.
