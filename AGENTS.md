# Language Journey maintenance rules

## Preserve existing behavior

- Keep the Level 4 back-arrow hierarchy intact: quiz/result → originating lesson step → lesson overview → lesson list.
- Do not remove or reset existing localStorage progress, ranks, mastery, error history, or introduced vocabulary.
- Keep Levels 1–3 and Level 5 working when changing Level 4.

## Level 4 teaching style

- Every new grammar principle uses this order: short explanation → example → visual breakdown → immediate exercise.
- Keep explanation readable in roughly 20–40 seconds.
- Use at most 2–3 short explanatory text blocks and 1–2 model sentences.
- Prefer plain Dutch and functional labels over academic terminology.
- Introduce only one important grammar principle per lesson and avoid presenting several exceptions together.
- Quick checks and practice sessions skip explanatory screens and open questions directly.
- Preserve the mobile-first tap-based sentence builder; do not require drag-and-drop or a Japanese keyboard.
- Level 4 may use only writing taught through Level 3: no kanji, small kana, small っ, or long-vowel mark ー.

## Level 5 teaching style

- Give every exercise one primary learning goal tied to the current lesson's new kana rule.
- Introduce every new example word with kana, romaji, and Dutch meaning before testing it.
- Reuse earlier grammar or vocabulary only as context for the current kana target, never as a detached review question.
- Keep the lesson sequence: introduce the rule → show examples → recognize → apply → check.
- Prefer useful contrasts such as きや versus きゃ, and avoid ambiguous answer options.
- Quick checks test only the selected lesson; the Level 5 exam is balanced across all five Level 5 lessons.

## Homepage avatar

- Preserve the optional homepage mascot and its saved settings: enabled state, gender presentation, auto/manual mode, selected skin, unlocked skins, and current level.
- Keep the mascot secondary to the learning content: compact, calm, and without rank text, currency, shops, or loud gamification.
- Auto mode follows the most recently active level. Manual mode may select only skins unlocked by opening that level.
- Keep the Level 1–10 skins visually consistent and maintain the mobile layout so the learning button and copy remain readable.
- Preserve personal profile fields and their backward-compatible localStorage defaults. Ren / レン is the default male companion and Miku / ミク the default female companion; users may rename either without affecting progress or skins.
- Keep avatar variant, avatar name, and selected skin as separate data. Skin changes never rename the companion or affect mastery.
- Resolve future personalized lesson copy through the shared profile placeholder helper instead of hardcoding learner or companion names.

## Flashcards

- Use the shared vocabulary catalog as the source for course words and flashcards; avoid maintaining a second disconnected word list.
- Keep flashcards optional and available from the home navigation, level overviews, and vocabulary progress view. Preview words may be practiced without changing course rank or introduction status.
- Store spaced-repetition history separately per word and direction (`jp-nl` / `nl-jp`). Flashcard practice must not alter lesson completion, ranks, mastery, error history, or introduced vocabulary.
- Preserve flashcard selection, active/paused session, and review history when saving or migrating localStorage. Older saved versions must load without resetting any existing progress.
- When extending the flashcard system, verify mobile layout, resume after interruption, due/new card selection, separate direction history, and one-time requeueing of missed cards.

## Dictionary

- Build word articles from `vocabCatalog` and preserve each `vocab-*` ID; do not create a parallel vocabulary list.
- Keep kana-as-sound, lexical words, and grammar particles as separate entry kinds/IDs, even where spelling or pronunciation overlaps (for example は / wa, を / o, か / ka, and も / mo).
- Kana entries describe spelling and sound only unless a separate, verified lexical or grammar entry applies. Do not attach invented word meanings to individual kana.
- New lesson words must map to an existing stable word ID or add a vetted catalog entry, with reading, meaning, lesson context, and any distinct senses recorded before the word is used in practice or Recall.
- Dictionary searches and article visits must never mutate introduced-word state, mastery, rank, errors, or flashcard SRS. Opening/closing an article from a lesson must preserve that lesson's DOM, scroll, and exercise state.
- Keep future catalog words searchable but label them as previews until the existing lesson-introduction rule makes them learned.
- Verify readings, particle functions, and examples against course context and reliable references; document uncertain cases rather than guessing. Current verified references: Japan Foundation IRODORI Grammar_all.pdf and Starter Lesson 1 kana chart.
