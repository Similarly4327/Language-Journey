# LJ-JLPT-v1 milestones — 5 November 2026

This product scale supersedes the earlier internal N5–N3 thresholds and calendar-family weighting. It is an indicative Language Journey scale, not an official JLPT list or passing score.

| Tier | Cumulative canonical lexemes | Cumulative contextual kanji characters |
| --- | ---: | ---: |
| N5 | 1,000 | 100 |
| N4 | 2,000 | 300 |
| N3 | 4,000 | 650 |
| N2 | 7,000 | 1,000 |
| N1 | 11,000 | 2,000 |

Each tier uses exactly `100 * (0.7 * min(words / wordTarget, 1) + 0.3 * min(kanji / kanjiTarget, 1))`. Both counts are global cumulative unique permanent milestones; incomplete external benchmark mappings do not filter them. Domain contributions cap independently. The data layer retains the unrounded percentage; display may format it to one decimal.

## Storage and event contract

`language-journey-content/jlpt-milestones.js` owns `state.jlptMilestones`, schema version 1 and scale `LJ-JLPT-v1`, inside the existing progress save. It contains separate `lexemes` keyed by existing canonical `vocab-*` IDs and `kanji` keyed by Unicode Han character. Neither direction, synonym nor supporting whole-word reading creates another count. Existing distinct canonical lexical senses retain their own IDs. No parallel vocabulary catalog is introduced.

Every accepted review requires a unique `attemptId`, positive timestamp, source ID, explicit known target, `submitted: true`, `valid: true`, boolean correctness and no assistance. Word events use `kind: 'word-review'`. Three consecutive correct valid events latch `everMastered` and `masteredAt`. A wrong target event resets that target's active streak, while the permanent milestone survives. Skips, examples, exposure and excluded events neither award nor reset a streak.

`kind: 'contextual-kanji-review'` is separate. It requires explicit contextual character targets backed by a known, explicitly introduced whole-word spelling and exact course reading. Each target supplies `{character, wordId, form, reading, context}`; context must contain the actual kanji form. The adapter must assert `recognition: true`, `readingRevealed: false`, `audioAssisted: false`, and verify those conditions from the exercise presentation. Only explicitly tested characters advance; other characters and words in a sentence do not. Duplicate characters within an attempt advance once. Character events do not implicitly award lexical milestones.

The current isolated-word Recall question is not contextual kanji recognition. It awards word evidence only, including when its optional kanji display is enabled. A future contextual exercise must explicitly call `recordJlptReview(event)` under the stricter contract; ordinary display, a vocabulary grade, or legacy kanji evidence must never be converted into such an event. The source-neutral event contract can support later optional lesson or music sources while reusing existing canonical IDs.

Recall queue items persist `jlptAttemptId`. Creation and genuine retry insertion allocate fresh IDs; rerender, pause/resume and reload retain the existing ID. Accepted IDs and their minimal evidence remain in `attempts`, so replays and changed-answer submissions cannot advance or reset counters twice, even after other events. The monotonically increasing attempt sequence plus timestamp/random suffix avoids reusing IDs between sessions. Legacy interrupted cards receive an ID on first render. A future unknown milestone schema is retained verbatim and this client treats it as unavailable/read-only.

## Conservative migration

Migration starts an empty milestone store and never replays old history. Existing `guidelineEvidence`, SRS records, recent results, ranks, introduced vocabulary, spelling exposure, errors, profile, filters and in-progress sessions keep their original roles. A migration marker records `no-inferred-milestones`; there is no reset of existing progress and no inferred mastered timestamp.

Old practiced/applied/kanji stamps prove at most one success. Old SRS repetitions prove recorded grades, but the legacy scheduler accepts a bare programmatic `knew` grade without a checked chosen answer; its load adapter also defaults non-`again` grades to `knew`. Recent mastery results lack target, assistance and presentation proof. Consequently none proves three consecutive valid submitted target answers under the new contract. They remain preserved evidence without seeding new milestones. If a future import supplies a provable event ledger, it needs an explicit versioned importer rather than silent inference.

## Scheduler independence and limits

Recall remains the sole scheduler. Neither counters nor selectors write due dates, stages, intervals, repetitions, lapses, ranks, error history or exposure. Scheduled Recall advances milestones only when the submitted answer belongs to that attempt's actual revealed answer choices and the grade matches the checked answer. Bare legacy grades retain their existing SRS behavior without becoming milestone events. Free practice retains its existing ungraded behavior.

Permanent milestone totals do not depend on current due state, current ranks or whether a catalog item temporarily disappears from the teaching route. Saved stable IDs remain in the milestone store. No scheduled maintenance or second SRS is added. The accepted-attempt ledger grows with actual answered reviews; it is intentionally not truncated because truncation could admit old duplicate events. Existing localStorage capacity remains the storage limit.

Deterministic tests in `tests/jlpt-milestones.test.cjs` cover exact weights and all five anchors, independent caps, canonical mixed-direction streaks, wrong-answer reset and permanent latch, replay protection after reload, contextual character deduplication, help/exposure exclusions, conservative migration, unknown schema preservation, and Recall load/save compatibility with unchanged scheduling and legacy UI evidence.

## Optional music source

The Quintuplets pilot reuses catalog IDs and stores its own introduction and score only. It makes explicitly introduced pilot words available to Dictionary and Recall without awarding a lesson rank or completing a level. The kana word is shown first; the separate kanji step records which whole-word forms were explicitly shown. Only a submitted contextual question with no reading or audio help may send the displayed target, character and known reading to `recordJlptReview`. The optional quiz does not submit word-review evidence or change Recall scheduling. Mastered words are skipped by default, with an explicit all-words review.

The supplied rough transcription served only to identify candidate lemmas; no transcript or lyrics are shipped. The pilot omits 思い for now because the catalog already has the distinct homophone おもい “heavy” and its separate sense needs an explicit, vetted homograph treatment. Names, the title, particles, and uncertain transcript spellings are not vocabulary entries. The transcript's よおつ, 少しづつ and そおでしょ require source verification; they are not copied into the app. Standard よっつ is already catalogued, and the lemma 少し is taught rather than inferring a lyric transcription. No lyrics or audiovisual recordings are included or licensed by this change. The existing static audio registry is used when an exact recording exists; missing pilot recordings need separate production and rights review.

Lexical spot checks: [気持ち](https://en.wiktionary.org/wiki/%E6%B0%97%E6%8C%81%E3%81%A1), [悲しみ](https://en.wiktionary.org/wiki/%E6%82%B2%E3%81%97%E3%81%BF), [大好き](https://en.wiktionary.org/wiki/%E5%A4%A7%E5%A5%BD%E3%81%8D). The remaining additions should receive a full lexical and source review before publication.
