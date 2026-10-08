# Eerlijke woorddekking — level 3 t/m 10

Bijgewerkt: 8 oktober 2026. Lokaal geïmplementeerd en gecontroleerd; niet gepubliceerd.

## Resultaat per level

Een woordronde bevat exact twee doelbeurten per unieke nieuwe woord-ID: één Japans → Nederlands en één Nederlands → Japans. Fouten voegen geen extra beurten toe; opnieuw oefenen is een aparte, vrijwillige ronde. Examens combineren deze verplichte dekking met de bestaande overige leerdoelen. De volgorde wordt gemengd zonder opeenvolgende doelen met hetzelfde woord waar dat mogelijk is.

| Level | Unieke nieuwe woorden | JP → NL | NL → JP | Overige examenopgaven | Totaal examen |
| --- | ---: | ---: | ---: | ---: | ---: |
| 3 | 0 | 0 | 0 | 0 | 2 × 50 kana-opgaven |
| 4 | 20 | 20 | 20 | 28 | 68 |
| 5 | 18 | 18 | 18 | 28 | 64 |
| 6 | 16 | 16 | 16 | 25 | 57 |
| 7 | 20 | 20 | 20 | 19 | 59 |
| 8 | 47 | 47 | 47 | 33 | 127 |
| 9 | 20 | 20 | 20 | 21 | 61 |
| 10 | 15 | 15 | 15 | 21 | 51 |

De aantallen hierboven zijn de gegenereerde auditronde. De interface start exact de samengestelde ronde waarvan zij de lengte toont. De ID-lijsten, aantallen per ID/richting en verdeling over woordvraagvormen staan volledig in `audit.json`. Context-meaning en context-recognition gebruiken bestaande situatievragen; meaning en recognition zijn directe vertalingen. Andere examenopgaven blijven afzonderlijk meetellen.

## Wat eerst misging

- **Level 3:** geen nieuwe lexicale woorden. Woorddekking is niet van toepassing. Beide bestaande examens blijven 50 kana-opgaven bevatten; er zijn geen woordvragen toegevoegd.
- **Level 4:** vier beurten per woord in Oefenen, examendekking zonder richtingscontrole. Lessen l4-5 en l4-6 zonder actuele woordintroductie kregen bovendien oude woorden via de legacy-fallback. Nu uitsluitend actuele introducties en één beurt per richting.
- **Level 5:** Oefen herkenning startte een gemengde kana/woordcheck. Nu start Oefen woorden de pure woordronde; de aparte snelle checks en lestoets behouden hun kana-doelen. Examens toetsen ook beide woordrichtingen naast de kana-opgaven.
- **Level 6:** vier oefenbeurten per woord; examenwoordvragen voornamelijk Nederlands → Japans. Nu 2N en beide examenrichtingen. l6-5 heeft geen nieuwe woorden.
- **Level 7:** dezelfde richtingsfout, plus een losse doelvraag over みっつ met een kaal vocab-ID als concept zonder dekkingslabel. Die expliciete bronkoppeling wordt in de examenpool naar het gedeelde vocab-doel vertaald. Losse woordvragen komen niet als ongetelde opvulling terug.
- **Level 8:** aparte maandenroute verwachtte acht vragen voor twee woorden en dezelfde structuur in checkpoints. Nu vier per blok, zes blokken samen 24. Oude checkpoints behouden beantwoorde unieke beurten en kunnen worden hervat. Weekdagen, tijdwoorden en maanden verschijnen in beide examenrichtingen; klok- en agenda-doelen blijven aanwezig. l8-6 voegt geen woorden toe.
- **Level 9:** vier oefenbeurten en examenwoorddekking zonder verplichte tweede richting. Nu 2N en 40 gerichte woordbeurten in het examen.
- **Level 10:** dezelfde fouten; l10-2 verwijst ook naar eerder geïntroduceerde woorden. Alleen zijn twee werkelijk nieuwe woorden zijn verplichte doelen. Dubbele of gedeelde ID-verwijzingen vergroten de verplichte dekking niet. l10-5 heeft geen nieuwe woorden.

De actuele oorzaak was de expliciete dubbele lus in `wordCrashCourseDeck` en selectie op `targetGoalIds` zonder richting in de verschillende examengeneratoren. De examens konden al groeien met het aantal leerdoelen, maar daarmee was beide richtingen toetsen niet gegarandeerd. Er is in deze huidige examenroute geen aparte harde achtvragenlimiet gevonden. De oudere `selectDistinctLessonQuestions`-helper onderscheidt lemmas zonder richting; de nieuwe examenroutes gebruiken haar niet. Willekeurige kana-selectie met teruglegging blijft uitsluitend onderdeel van bestaande kana-oefeningen: Level 1 en 2 krijgen geen nieuwe woordrondes of extra examenvragen.

## Broncontrole en lesaudit

Bron: `manifest.vocabulary.introducedAt` op het actuele level en de actuele lesvolgorde. Elke nieuwe ID is ook gecontroleerd tegen `wordIds` of `exampleIds` van de centrale les en `vocabById`. Geen ongeldige verwijzingen of ontbrekende introductiekoppelingen gevonden. De kale conceptverwijzing bij de Level 7-vraag wordt hierboven apart verantwoord. Legacy woorden blijven beschikbaar voor bestaande opslag, maar worden geen nieuwe doelen via een fallback.

| Les | Unieke nieuwe woord-ID’s | Verwachte beurten | Beide richtingen |
| --- | --- | ---: | --- |
| l4-1 | `vocab-これ`, `vocab-ねこ`, `vocab-いぬ`, `vocab-みず`, `vocab-パン` | 10 | ja |
| l4-2 | `vocab-それ`, `vocab-あれ`, `vocab-ほん`, `vocab-さかな` | 8 | ja |
| l4-3 | `vocab-わたし`, `vocab-ひと`, `vocab-ともだち` | 6 | ja |
| l4-4 | niet van toepassing | 0 | niet van toepassing |
| l4-5 | niet van toepassing | 0 | niet van toepassing |
| l4-6 | niet van toepassing | 0 | niet van toepassing |
| l4-7 | `vocab-のみます`, `vocab-たべます`, `vocab-みます` | 6 | ja |
| l4-8 | `vocab-よみます` | 2 | ja |
| l4-9 | `vocab-いきます`, `vocab-みせ`, `vocab-えき`, `vocab-うち` | 8 | ja |
| l4-10 | niet van toepassing | 0 | niet van toepassing |
| l5-1 | `vocab-きゃく`, `vocab-きょく` | 4 | ja |
| l5-2 | `vocab-しゃしん`, `vocab-しゅみ`, `vocab-しょくじ` | 6 | ja |
| l5-3 | `vocab-おちゃ`, `vocab-ちょきん`, `vocab-じゃま`, `vocab-じゅう`, `vocab-じょせい` | 10 | ja |
| l5-4 | `vocab-きって`, `vocab-ざっし`, `vocab-ベッド` | 6 | ja |
| l5-5 | `vocab-ケーキ`, `vocab-ゲーム`, `vocab-コーヒー`, `vocab-スーパー`, `vocab-タクシー` | 10 | ja |
| l6-1 | `vocab-あなた`, `vocab-かぞく`, `vocab-おとこ`, `vocab-おんな` | 8 | ja |
| l6-2 | `vocab-ちち`, `vocab-はは`, `vocab-おとうさん`, `vocab-おかあさん` | 8 | ja |
| l6-3 | `vocab-あに`, `vocab-あね`, `vocab-きょうだい`, `vocab-だれ` | 8 | ja |
| l6-4 | `vocab-おとうと`, `vocab-いもうと`, `vocab-こども`, `vocab-みんな` | 8 | ja |
| l6-5 | niet van toepassing | 0 | niet van toepassing |
| l7-1 | `vocab-ひとつ`, `vocab-ふたつ`, `vocab-みっつ`, `vocab-よっつ` | 8 | ja |
| l7-2 | `vocab-ひとり`, `vocab-ふたり`, `vocab-さんにん`, `vocab-よにん` | 8 | ja |
| l7-3 | `vocab-いっぴき`, `vocab-にひき`, `vocab-さんびき`, `vocab-なんびき` | 8 | ja |
| l7-4 | `vocab-いっぽん`, `vocab-にほん`, `vocab-いちまい`, `vocab-にまい` | 8 | ja |
| l7-5 | `vocab-いちばんめ`, `vocab-にばんめ`, `vocab-さんばんめ`, `vocab-どれ` | 8 | ja |
| l8-1 | `vocab-げつようび`, `vocab-かようび`, `vocab-すいようび`, `vocab-もくようび` | 8 | ja |
| l8-2 | `vocab-きんようび`, `vocab-どようび`, `vocab-にちようび`, `vocab-なんようび` | 8 | ja |
| l8-3 | `vocab-きょう`, `vocab-あした`, `vocab-きのう`, `vocab-こんしゅう`, `vocab-らいしゅう`, `vocab-せんしゅう` | 12 | ja |
| l8-4 | `vocab-いちがつ`, `vocab-にがつ`, `vocab-さんがつ`, `vocab-しがつ`, `vocab-ごがつ`, `vocab-ろくがつ`, `vocab-しちがつ`, `vocab-はちがつ`, `vocab-くがつ`, `vocab-じゅうがつ`, `vocab-じゅういちがつ`, `vocab-じゅうにがつ` | 24 | ja |
| l8-5 | `vocab-いちじ`, `vocab-にじ`, `vocab-さんじ`, `vocab-よじ`, `vocab-ごじ`, `vocab-ろくじ`, `vocab-しちじ`, `vocab-はちじ`, `vocab-くじ`, `vocab-じゅうじ`, `vocab-じゅういちじ`, `vocab-じゅうにじ`, `vocab-ごぜん`, `vocab-ごご` | 28 | ja |
| l8-minutes | `vocab-なんじ`, `vocab-いま`, `vocab-ごふん`, `vocab-じゅうごふん`, `vocab-さんじゅっぷん`, `vocab-よんじゅうごふん`, `vocab-はん` | 14 | ja |
| l8-6 | niet van toepassing | 0 | niet van toepassing |
| l9-1 | `vocab-ここ`, `vocab-そこ`, `vocab-あそこ`, `vocab-どこ` | 8 | ja |
| l9-2 | `vocab-ひだり`, `vocab-みぎ`, `vocab-まっすぐ`, `vocab-みち` | 8 | ja |
| l9-3 | `vocab-まえ`, `vocab-うしろ`, `vocab-となり`, `vocab-なか` | 8 | ja |
| l9-4 | `vocab-うえ`, `vocab-した`, `vocab-そと`, `vocab-ちかく` | 8 | ja |
| l9-5 | `vocab-こうえん`, `vocab-がっこう`, `vocab-レストラン`, `vocab-ちず` | 8 | ja |
| l10-1 | `vocab-ください`, `vocab-いくら`, `vocab-おかね`, `vocab-かいます` | 8 | ja |
| l10-2 | `vocab-メニュー`, `vocab-みせて` | 4 | ja |
| l10-3 | `vocab-やくそく`, `vocab-あいます`, `vocab-いつ`, `vocab-いっしょに`, `vocab-だいじょうぶ` | 10 | ja |
| l10-4 | `vocab-でんしゃ`, `vocab-バス`, `vocab-のります`, `vocab-おります` | 8 | ja |
| l10-5 | niet van toepassing | 0 | niet van toepassing |

Voor l8-4 is de bronlijst verdeeld in zes expliciet geregistreerde microstappen van telkens twee maanden. Elke microstap bevat vier beurten; alle twaalf maanden samen 24. De IDs per blok staan in `audit.json`.

## Verificatie

- `node --test`: 116 tests, allemaal geslaagd.
- Alle lessen en examens level 3–10 gecontroleerd over 20 schudseeds; telling per woord-ID en richting, geen afhankelijkheid van vaste volgorde.
- Sets van één, twee en vier woorden; dubbele IDs en gedeelde lesbronnen over 30 seeds; aangrenzende gelijke woorden vermeden waar mogelijk; meerdere echte schudvolgordes aangetoond.
- Correct antwoord gecontroleerd tegen het centrale woord en de gedeclareerde richting. Ongetelde lexicale opvulvragen worden uitgesloten. Overige canonical doelen blijven gedekt.
- Oude maandencheckpoint van acht beurten hervat met vier unieke beurten en behoud van reeds beantwoorde vragen. Ranks, SRS-planning en aangeleverde opslagfixture blijven intact.
- Werkelijke browserinterface: Edge op 375 × 812 CSS-pixels, geïsoleerde testopslag. 40 oefenroutes geopend, waaronder alle zes maandenblokken; antwoordopties onthuld. Eén vierwoordenronde volledig via knoppen beantwoord: acht verschillende ID/richting-paren en daarna het resultaat.
- Beide Level 3-examens en alle Level 4–10-examens gestart via hun knoppen. Werkelijke quizvragen gecontroleerd op dekking; getoonde examenlengte gelijk aan de gestarte sessie. Geen JavaScript-paginafouten. Resultaten: `ui-audit.json`.
- Mobiele oefen- en examenscreenshot visueel beoordeeld. Screenshots: `output/playwright/word-coverage/mobile-practice.png` en `mobile-exam.png`.
- `node language-journey-content/validate.cjs`: 0 fouten. Bestaande waarschuwingen: ontbrekende optionele audio en drie niet meer gebruikte datumwoorden; bestaande legacy-compatibiliteit blijft intact.
- `git diff --check`: geslaagd. `node scripts/version-client-assets.cjs` uitgevoerd; externe assets zijn niet gewijzigd, dus hun versie bleef gelijk.

Niet geverifieerd: daadwerkelijk iPhone/Safari-toestel, publieke deployment, of elk antwoord van elk lang examen door handmatig klikken. Alle gegenereerde examenvragen zijn wel geteld en de bestaande beantwoording is door de regressietests gecontroleerd. Er is geen echte gebruikersopslag gewijzigd.

## Gewijzigde bestanden en herhalen

- `index.html`: woordbron, 2N-woordronde, veilige afleiders, gedeelde ID/richting-dekking, examengeneratoren en lengte, Level 5-oefenknop en compatibele maandencheckpoint.
- `tests/app-probe.cjs`: gedeelde applicatieprobe uit bestaande render-smoketests.
- `tests/render-smoke.test.cjs`: verwachtingen aangepast van vier naar twee beurten, gedeelde probe gebruikt.
- `tests/word-coverage.test.cjs`: robuuste dekkings-, bron-, route- en checkpointtests.
- `scripts/word-coverage-audit.cjs`: reproduceerbare volledige JSON-audit (`node scripts/word-coverage-audit.cjs`).
- `scripts/word-coverage-ui.js`: browsercontrole voor Playwright CLI (`playwright-cli -s=word-coverage run-code --filename scripts/word-coverage-ui.js`), met lokale preview op poort 8766. Alleen het onderschepte testdocument krijgt een observatieprobe; er staat geen debug-interface in de app. Testdata blijft in het geïsoleerde browserprofiel.
- `docs/word-coverage/`: dit rapport, `audit.json` en `ui-audit.json`.
- `output/playwright/word-coverage/`: twee mobiele screenshots.
