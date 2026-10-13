# Woordrondes en compacte examens — Level 3 t/m 10

Bijgewerkt: 13 oktober 2026. Uitgevoerd volgens de aanvulling van 12 oktober: volledige 2N-dekking geldt voor de losse woordoefening; een examen heeft vooraf een totaalbudget van maximaal 40 vragen. Lokaal gecontroleerd, niet gepubliceerd.

## Aantallen en verdeling

De oude aantallen zijn gemeten vóór deze correctie. De nieuwe verdeling hieronder is de reproduceerbare auditronde met seed 1; de verdeling grammatica/context kan tussen pogingen iets verschillen. Het totaalbudget en de verplichte leerdoelen blijven gelijk.

| Level | Oud totaal | Nieuw totaal | Woordvragen | Grammatica/kana | Zins-/situatiebegrip |
| --- | ---: | ---: | ---: | ---: | ---: |
| 3, examen A | 50 | 30 | 0 | 30 | 0 |
| 3, examen B | 50 | 30 | 0 | 30 | 0 |
| 4 | 68 | 30 | 13 | 7 | 10 |
| 5 | 64 | 30 | 9 | 21 | 0 |
| 6 | 57 | 25 | 11 | 0 | 14 |
| 7 | 59 | 30 | 14 | 1 | 15 |
| 8 | **127** | **40** | 18 | 0 | 22 |
| 9 | 61 | 30 | 13 | 1 | 16 |
| 10 | 51 | 30 | 13 | 2 | 15 |

Alle oude examens waren langer dan 40. Level 8 was bovendien langer dan 100. Geen gemeten examen was langer dan 150. De categorie context bevat ook vragen die grammaticale patronen toepassen; daadwerkelijke doeldekking wordt op de bestaande goal-ID’s gecontroleerd, niet op het categorielabel.

Level 3 heeft geen nieuwe lexicale woorden: woordrondes zijn **niet van toepassing**. Ieder kana-examen trekt drie verschillende kana per patroon én schrift, dus 10 groepen × 3 = 30. Alle dakuten/handakuten-patronen blijven vertegenwoordigd in Hiragana en Katakana; welke kana gekozen worden varieert.

Level 5 krijgt 30 vragen omdat de 21 individuele nieuwe kana-doelen allemaal behouden blijven, naast negen woordvragen. Level 6 krijgt 25 vragen voor vijf korte lessen. Levels 4, 7, 9 en 10 krijgen 30; de uitgebreide kalender-, klok- en agendastof van Level 8 krijgt het maximum van 40.

## Oorzaak en correctie

De bestaande `buildWordCoveredExam` telde per les eerst structuurvragen op en voegde vervolgens **ieder nieuw woord in beide richtingen** toe. Die combinatie verklaart 94 woordvragen plus 33 overige vragen in Level 8. De woordoefening zelf was in de huidige code al 2N; deze blijft volledig en wordt afzonderlijk gecontroleerd.

De examengenerator legt nu vóór het vullen twee quota vast. Hij dekt eerst de bestaande niet-lexicale leerdoelen en vertegenwoordigt iedere les. Daarna bepaalt hij, binnen het levelbudget, hoeveel overige vragen en unieke doelwoorden passen. De woordsteekproef wordt gelijkmatig over introductielessen verdeeld; beide richtingen worden evenwichtig toegewezen. Iedere doelwoord-ID wordt hooguit eenmaal getoetst. Er wordt niets achteraf van een te lange ronde afgeknipt.

Weekdag- en maandvragen uit Level 8 die ook een patroondoel toetsen, tellen expliciet als woordvraag en nemen een plaats in diezelfde steekproef in. Ook oudere focus-/agendavragen zonder lexicale metadata krijgen een doelwoord-ID wanneer het daadwerkelijk te geven antwoord precies dat woord is. Een dergelijk woord kan niet nogmaals als vertaalvraag worden gekozen. Woorden die uitsluitend in scenario’s, zinnen of distractors voorkomen worden niet als getoetst woord geteld.

Wat per level vervalt of wordt samengevoegd:

| Level | Oude → nieuwe woordvragen | Oude → nieuwe overige vragen | Correctie |
| --- | ---: | ---: | --- |
| 3 | 0 → 0 | 50 → 30, per examen | Gespreide kana-steekproef uit alle patronen en beide schriften |
| 4 | 40 → 13 | 28 → 17 | Verplichte dubbele woorddekking vervangen; equivalente patroonvragen gespreid geselecteerd |
| 5 | 36 → 9 | 28 → 21 | Woordsteekproef naast volledige kana-doeldekking; extra equivalente opgaven vervallen |
| 6 | 32 → 11 | 25 → 14 | Eerlijke steekproef naast familie- en relatiebegrip uit alle lessen |
| 7 | 40 → 14 | 19 → 16 | Unieke telwoorddoelen naast alle telpatronen |
| 8 | 94 → 18 | 33 → 22 | Kalenderwoordsteekproef; 24-uursklok, middernacht, dagdelen, minuten, halfuur en agenda blijven gedekt |
| 9 | 40 → 13 | 21 → 17 | Woordsteekproef naast alle plaats-/richtingpatronen |
| 10 | 30 → 13 | 21 → 17 | Woordsteekproef naast verzoeken, afspreken en vervoerssituaties |

## Volledige les- en doel-ID-audit

[audit.json](audit.json) bevat iedere les van Level 4–10 en iedere patroon/schriftgroep van Level 3. Per les staan de unieke nieuwe woord-ID’s, hun centrale introductiebron, de verwachte 2N-beurten, beide richtingen en eventuele maandenmicrostappen. Lessen zonder nieuwe woorden zijn expliciet als niet van toepassing geregistreerd. Geen ongeldige woordverwijzingen of ontbrekende leskoppelingen gevonden. De bestaande normalisatie van het kale `vocab-みっつ`-concept blijft gebruikt.

Dezelfde audit bevat per examen het oude/nieuwe totaal, quota, categorieën, lesverdeling, iedere getoetste woord-ID/richting, en per grammatica-, kana-, patroon- of toepassingsdoel de werkelijk geselecteerde vraag-ID’s. Alle verplichte niet-lexicale doelen hebben een geselecteerde vraag.

## Verificatie

- Volledige regressiesuite `node --test`: **163 tests geslaagd, 0 mislukt**.
- Alle leswoordrondes en alle Level 3–10-examens over 20 random seeds gecontroleerd. Woordselectie en richtingen varieerden per examen; geen doelwoord kwam tweemaal voor.
- Sets van vier, twee en één woord en dubbele IDs over 30 seeds: exact 2N pure woordbeurten; elk woord eenmaal per richting; aangrenzende gelijke woorden vermeden waar mogelijk.
- De generatiecontrole bewaakt budget, geplande lengte, verplichte doeldekking, les-/woordspreiding, unieke vraagbronnen, unieke woorddoelen en passende vertaalrichtingen.
- Werkelijke Edge-interface op 375 × 812: 40 oefenroutes, waaronder de zes maandenmicrostappen, geopend via de oefenknoppen. Eén vierwoordenronde volledig beantwoord: acht unieke ID/richting-paren en de normale afronding.
- Beide Level 3-examens en ieder Level 4–10-examen driemaal gestart via de echte startknop: 27 examenstarts, correcte getoonde lengte, variërende woordkeuze, geen paginafouten. Resultaat: [ui-audit.json](ui-audit.json).
- Resultaatverwerking van het compacte examen en herladen gecontroleerd: 30/30 blijft een normaal resultaat, examenrank stijgt één stap naar Copper, bestaande lesrank/attempts en beide SRS-richtingen blijven behouden.
- Oude maandencheckpoints blijven compatibel; de invoersnapshot wordt niet gewijzigd.
- Contentvalidator: 0 fouten, vier bestaande waarschuwingen over optionele audio en ongebruikte historische datumwoorden. Diffcontrole zonder whitespacefouten.

Level 1 en 2 zijn niet aangepast. De antwoordhandlers, ranking, resultaten, opslag en Recall-scheduler zijn behouden. Browserdata is uitsluitend in een geïsoleerd testprofiel gebruikt. Geen echte iPhone/Safari, publieke deployment of handmatige volledige beantwoording van ieder examen getest.

## Bestanden en herhalen

- `index.html`: compact examenbudget, gedeelde balanscontrole, selectie en correcte examenbeschrijvingen; beide Level 3-startacties.
- `tests/app-probe.cjs`, `tests/word-coverage.test.cjs`, `tests/render-smoke.test.cjs`: werkelijke appfuncties, multi-seed selectie, 2N-dekking, resultaat/rank/opslagcontrole en bijgewerkte examenverwachtingen.
- `scripts/word-coverage-audit.cjs`: `node scripts/word-coverage-audit.cjs` regenereert de gedetailleerde audit.
- `scripts/word-coverage-preview.cjs`: tijdelijke localhost-preview op poort 8766.
- `scripts/word-coverage-ui.js`: browsercontrole via Playwright CLI `run-code --filename scripts/word-coverage-ui.js`.
- `docs/word-coverage/` en `output/playwright/word-coverage/`: auditrapporten en visueel gecontroleerde mobiele screenshots.

Reeds aanwezige en gelijktijdige wijzigingen aan audio/content vallen buiten deze correctie en zijn behouden. De client-assetlinks zijn met de bestaande versiehelper gesynchroniseerd.
