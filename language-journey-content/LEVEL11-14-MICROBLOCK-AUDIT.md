# Levels 11–14: microblock audit

Baseline: main f1f942e (JLTP test). Local correction: 2026-11-02. The baseline and published A/B five-word UI matched; this is an implementation correction, not evidence of a failed deployment or stale cache.

Each cell lists canonical vocabulary IDs (the `vocab-` prefix is omitted below for compactness) and any grammar IDs. Parenthesized counts include grammar; every block has at most three new targets. Empty means deliberate reuse/integration, not a new-word quota.

| Lesson | A | B | C | D |
| --- | --- | --- | --- | --- |
| l11-home-1 | (3) `レベル`, `レッスン`, `しつもん` | (2) `こたえ`, `えらびます` | (3) `もんだい`, `れんしゅう`, `ただしい` | (2) `まちがい`, `もういちど` |
| l11-home-2 | (3) `せつめい`, `ぶん`, `ことば` | (3) `いみ`, `みつけます`, `grammar-noun-to` | (3) `よんでください`, `ページ`, `タイトル` | (3) `もじ`, `しるし`, `grammar-l11-home-1` |
| l11-home-3 | (3) `きいてください`, `おと`, `おんせい` | (2) `ゆっくり`, `くりかえします` | (3) `うめてください`, `くうらん`, `かいてください` | (2) `きごう`, `まる` |
| l11-home-4 | (3) `じゅんばん`, `ならべます`, `さいしょ` | (2) `つぎ`, `おわり` | (3) `りょこう`, `じゅんび`, `ひこうき` | (2) `はじめます`, `かくにん` |
| l11-home-5 | Integration exam; no new targets | — | — | — |
| l12-1 | (3) `くうこう`, `あんないじょ`, `ひょうじ` | (3) `でぐち`, `いりぐち`, `grammar-l12-1` | (3) `とうちゃく`, `ターミナル`, `つきました` | (3) `あんないばん`, `country-japan`, `grammar-de-transport` |
| l12-2 | (3) `あと`, `にもつ`, `こちら` | (2) `パスポート`, `ならびます` | (3) `にゅうこく`, `てつづき`, `すすみます` | (2) `ゆうどう`, `ゆか` |
| l12-3 | (3) `すすめます`, `ばん`, `ばんごう` | (2) `うけとります`, `ベルト` | (3) `かばん`, `おおきい`, `ちいさい` | (2) `くろ`, `あか` |
| l12-4 | (2) `しゅっぱつ`, `しゅうりょう` | (0)  | (3) `ホテル`, `のりば`, `まどぐち` | (3) `まちます`, `でむかえ`, `まちあい` |
| l12-5 | (2) `ぜんぶ`, `ひこうじょう` | (0)  | (0)  | (0)  |
| l13-1 | (1) `つきます` | (1) `grammar-l13-1` | (3) `きっぷ`, `いきさき`, `ばんせん` | (1) `のりかえ` |
| l13-2 | (3) `かたみち`, `おとな`, `えん` | (1) `grammar-l13-price` | (2) `きっぷうりば`, `うんてんしゅ` | (0)  |
| l13-3 | (2) `まがります`, `かいだん` | (0)  | (3) `ちか`, `ちじょう`, `ちかてつ` | (3) `おりば`, `しゅうてん`, `ホテルまえ` |
| l13-4 | (3) `でます`, `はやい`, `おそい` | (3) `じ`, `ふん`, `じかん` | (2) `おくれ`, `てんじ` | (0)  |
| l13-5 | (0)  | (0)  | (0)  | (0)  |
| l14-1 | (3) `フロント`, `よやく`, `なまえ` | (2) `あります`, `みせます` | (3) `よやくばんごう`, `おねがいします`, `とまります` | (2) `ひとばん`, `grammar-l14-1` |
| l14-2 | (3) `へや`, `かい`, `エレベーター` | (0)  | (3) `かぎ`, `カード`, `つかいます` | (2) `ひらきます`, `ドア` |
| l14-3 | (3) `トイレ`, `かりる`, `タオル` | (0)  | (3) `きんえん`, `じはんき`, `あんない` | (3) `あさごはん`, `ひつよう`, `さがします` |
| l14-4 | (3) `できます`, `あずけます`, `あずかります` | (1) `あとで` | (3) `あさ`, `よる`, `あいています` | (1) `しめます` |
| l14-5 | (0)  | (0)  | (0)  | (0)  |

## Decisions

### Correction — 2026-11-04

- Add known-word kanji from Level 11 onward. Kanji is an optional spelling layer, not a required answer or completion target; it may replace kana in ordinary exercises after its introduction.
- Show the already-known forms `私` (Level 11), `人` (Level 12), `電車` and `駅` (Level 13), and `水` (Level 14) in a short, non-graded introduction when the learner already knows the canonical word. Preserve the kana reading and the existing canonical vocabulary ID. Recall may use the kanji representation on that same card and SRS record.
- Japan (`日本`) remains deferred until a natural later use. Levels 16–20 do not yet have authored lessons or candidate kanji; the shared renderer accepts future known-word mappings without adding speculative words or spellings.
- This correction supersedes the November 2 kanji deferral in the source prompt. It does not change Level 4/5 writing restrictions or introduce kanji in new vocabulary at the same time as its meaning.

- Level 11 keeps the stable source/application A/B IDs: displayed blocks A+B prepare source A, C+D prepare source B. Existing source completion maps to the corresponding completed blocks. Level 11 lesson 5 remains the 12-question integration exam with no new learning targets.
- Levels 12–14 use A+B → original source A, then C+D → original source B wherever the source is already integrable. Exactly three exceptions defer source A until D: `l12-1` uses the later `vocab-でぐち` and has 5 first-part words + 2 new grammar targets; `l12-2` uses later `vocab-あと`; `l14-1` has 6 first-part words + 1 grammar target, exceeding the six-item A+B capacity. All original reading/question/audio IDs remain. Some smaller lessons use 3+3 blocks under the same maximum of three; there is no quota.
- The two Level 11 lesson-2 grammar targets occupy B and D alongside two words each. The noun-と introduction uses the already-known ことば と いみ example; the original later examples remain stored with their later introduction point.
- Kanji exposure is gated by an authored `kanjiIntroducedAt` point and actual known-word state. The optional intro is informational and does not add a tested target or alter vocabulary progress. The same canonical lexeme can render in kanji in later lesson context and Recall; the kana reading remains available under the existing question-help rules.
- No library extras, bonus vocabulary, new Recall IDs or ElevenLabs candidates were added. No recordings were regenerated or approved. Existing optional material remains optional.
- New block completion is additive; old A/B completion and lesson ranks remain valid. Per-direction Recall records, error history, mastery, profile data and existing introduced words are retained.
- Source and explicit stem remain outside the hidden/inert answer region. The reveal control is static within the answer region. Tests inspect the emitted DOM at a 375px VM viewport; this is not a real-browser screenshot claim.

Validation: run `node language-journey-content/validate.cjs`, `node language-journey-content/report.cjs`, focused tests and `node --test`. The existing five warnings concern deliberate Japan spelling deferral, optional-audio metadata and three preserved calendar-day preview IDs. No push or deployment is part of this correction.

Final local verification: 240/240 full-suite tests and 55/55 focused tests passed; validation and the curriculum report completed with zero errors and the same five reviewed warnings. HEAD is still `f1f942ee97d9dd28d37a40200c4360e2fe8526a8`; the correction is an uncommitted working-tree delta for review. Real local-build browser rendering remained unavailable; the 375px regression is a VM/emitted-DOM check.
