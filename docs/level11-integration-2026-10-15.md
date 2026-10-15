# Level 11 — vier opbouwlessen en een integratie-examen

## Schermvolgorde

Oud: alle tien leswoorden in blokken 3 + 3 + 3 + 1 → twintig directe woordvragen → voorbeelden en verhaal A → bron B zonder eigen woordintroductie → Lestoets. Les 5 had nog drie nieuwe reiswoorden; daarnaast stond een afzonderlijke leveltoets met twintig vragen.

Nieuw, lessen 1–4: A introduceert vijf woorden samen → tien geschudde woordvragen, elk woord eenmaal per richting → twee of drie korte zinschermen → twee korte toepassingsvragen. Daarna introduceert B zijn eigen vijf woorden → tien eigen woordvragen → twee of drie korte zinschermen met bekende A-woorden → twee toepassingsvragen. De bestaande vier-vragen-Lestoets en rankdrempel blijven behouden. De uitgebreide bronopdracht staat uitsluitend in les 5.

Op 320 px staan de vijf introductiekaarten onder elkaar, zonder horizontaal schuiven of afgebroken Japanse woorden. Les 1 houdt navigatie, uitleg en instructies volledig Nederlands, ook na introductie van de UI-woorden. Vanaf les 2 verschijnen alleen daadwerkelijk bekende Japanse labels; onbekende instructies krijgen Nederlands als fallback.

## Woordinventaris en A/B-sets

Elke vorm hieronder gebruikt zijn bestaande ID `vocab-<vorm>`; er is geen nieuw woord of parallelle woordenlijst toegevoegd.

| Les | A: vijf woorden | B: vijf woorden |
| --- | --- | --- |
| 1 | レベル, レッスン, しつもん, こたえ, えらびます | もんだい, れんしゅう, ただしい, まちがい, もういちど |
| 2 | せつめい, ぶん, ことば, いみ, みつけます | よんでください, ページ, タイトル, もじ, しるし |
| 3 | きいてください, おと, おんせい, ゆっくり, くりかえします | うめてください, くうらん, かいてください, きごう, まる |
| 4 | じゅんばん, ならべます, さいしょ, つぎ, おわり | りょこう, じゅんび, ひこうき, はじめます, かくにん |

De eerste drie sets blijven ongewijzigd. De drie resterende reiswoorden uit de oude les 5 verhuizen naar 4-B: zo blijft reisvoorbereiding onderdeel van Level 11 en bruikbaar in het examen. Ze vervangen expliciet `vocab-ぜんぶ`, `vocab-あと` en `vocab-すすめます`, die een echte latere introductie en voorbeeldzin krijgen:

| Woord-ID | Nieuwe introductie |
| --- | --- |
| vocab-りょこう | 11-4-B |
| vocab-じゅんび | 11-4-B |
| vocab-ひこうき | 11-4-B |
| vocab-ぜんぶ | 12-5-A |
| vocab-あと | 12-2-B |
| vocab-すすめます | 12-3-A |

De andere zeven oorspronkelijke les-5-woorden waren in de bestaande didactische revisie al naar Level 12 verplaatst en blijven daar expliciet ondergebracht:

| Woord-ID | Introductie |
| --- | --- |
| vocab-しゅっぱつ | 12-4-A |
| vocab-にもつ | 12-2-B |
| vocab-くうこう | 12-1-A |
| vocab-あんないじょ | 12-1-B |
| vocab-ひょうじ | 12-1-B |
| vocab-でぐち | 12-1-B |
| vocab-のりば | 12-4-B |

De beleefde opdrachtvorm wordt pas bij 2-B uitgelegd met het daar geïntroduceerde よんでください. A toont geen B-afhankelijke modellen, woordhulp of grammatica. De audit kijkt bij deze lessen nu naar het werkelijke A/B-moment, niet naar een fictief moment waarop alle tien al bekend zijn.

## Les 5: de leveltoets

Geen nieuwe woorden, woordintroductie of losse A/B-rondes. Drie bronnen van elk drie geschreven regels:

1. Lespagina: lezen, titel/zin/woordbetekenis en een juist antwoord kiezen — lessen 1 en 2.
2. Luister- en invulkaart: langzaam luisteren, geluid herhalen, open vak invullen en symbool/antwoord herkennen — les 3.
3. Reisvoorbereiding in de app: kaart → trein → vliegtuig ordenen en het antwoord controleren — les 4, met bekende basiswoorden als context.

Elke bron heeft zes geautoriseerde vragen. Per poging blijven twee ankers aanwezig en worden twee aanvullende vragen geschud gekozen: twaalf vragen totaal, gegroepeerd per bron. Alle geregistreerde doelwoord-ID’s horen bij Level 11; context en afleiders worden niet automatisch als getoetst gerekend. Een geslaagd examen blijft de bestaande `l11-exam`-rank één stap verhogen, vanaf 80%. De historische `l11-home-5`-rank wordt niet gewist of kunstmatig opnieuw toegekend.

Het overzicht noemt vier lessen plus een afzonderlijke toetsdag als vrijblijvend weekritme. Het examen noemt 15–20 minuten als richttempo; dit is geen gemeten gebruikersonderzoek of tijdslot. Recall wordt nooit verplicht aan het examen gekoppeld. Na slagen staat alleen een optionele knop naar het overzicht van Level 12 les 1; er begint niet automatisch een woordronde.

## Opslag en migratie

- Bestaande storagekey en opslagschemaversie 9 blijven behouden.
- Een aanvullende, idempotente curriculumrevisie 2 bewaart de verplaatsingen van woorden. Oude introducties en aantoonbaar behaalde oorspronkelijke lessen blijven geldig via de bestaande historische woord-ID-lijst.
- Een oude rank op de nieuwe bestemmingsles is geen bewijs dat een verplaatst woord al bekend is. Zonder bestaande introductie of bewijs uit de oorspronkelijke bron blijft het woord uitgesteld tot zijn echte introductiescherm. Dit geldt ook voor een eventuele tussentijdse revisie 1.
- Ranks, scores, mastery, foutgeschiedenis en SRS-records worden niet gewist. Een verouderde actieve Level 11-schermvolgorde keert veilig terug naar het lesoverzicht; de leerhistorie blijft behouden.
- Bij de eerste geslaagde nieuwe integratiepoging wordt `level11IntegrationPass` opgeslagen: revisie, slaagtijd en de unieke doelwoord-ID’s uit precies die twaalf vragen. Een herkansing verandert deze eerste registratie niet. Een oud examenresultaat zonder exacte lijst geeft geen bonus op basis van geraden woorden.

## Recall-bonus

De bonuslijst is: daadwerkelijk geïntroduceerde huidige Level 11-woorden, minus de geregistreerde examendoelwoorden, vervolgens gefilterd door de bestaande Copper/eligibility-regel.

De bonus geldt vanaf de eerste slaagtijd tot exact vijf etmalen later. Maximaal twee kaarten krijgen voorrang per sessie. Bij due-kaarten verandert alleen hun positie binnen de reeds geselecteerde sessie: geen andere due-kaart verliest zijn plek. Bij nieuwe kaarten kunnen maximaal twee normale nieuwe-kaartslots naar bonuskaarten gaan. De bestaande limieten van veertig kaarten en twintig nieuwe kaarten blijven gelden; due-kaarten blijven vóór nieuwe kaarten. Waar alternatieven bestaan blijven twee richtingen van hetzelfde woord gespreid.

Er worden geen toekomstige kaarten naar voren gehaald. Selectie schrijft geen beoordelingen, intervallen, vervaldatums of richting-specifieke geschiedenis. Vrij oefenen behoudt zijn bestaande zelfstandige werking.

## Uitgevoerde controles

- Volledige Node-testsuite: 182/182 geslaagd. Ook de gerichte Recall-/Level 11-regressies zijn na de laatste bron-/spreidingscorrectie opnieuw uitgevoerd.
- Contentvalidatie en curriculumrapport: geen fouten; vier bestaande waarschuwingen over ontbrekende optionele audio en drie ongebruikte datumwoorden.
- Nieuwe regressietests: 5/5 woorden, 10/10 beurten per onderdeel, beide richtingen, geen vroege B-woorden, Nederlandse eerste les, drie examenbronnen en veranderende doelselectie, eerste Copper, herladen, herkansing, dag 1/dag 6, legacy zonder doelwoorden, eligibility en ongewijzigde SRS in beide richtingen.
- Echte Edge-browser met geïsoleerde opslag: alle vier lessen volledig doorlopen, inclusief 80 woordvragen, zestien toepassingsvragen en vier Lestoetsen; alle Lestoetsen 4/4. Daarna het mobiele examen 12/12 en Copper/slagingsgegevens na herladen gecontroleerd.
- Visueel bekeken op 320 en 390 px, plus desktop 1280 px. Geen horizontale pagina-overflow; de vijf introductiewoorden blijven elk op één regel. De testklok versnelt uitsluitend de bestaande feedbackwachttijd.
- Screenshots: `output/playwright/level11-integration/`. Reproduceerbare browserstappen: `scripts/level11-ui-qa.js` en `scripts/level11-ui-flow.js` (lokale testserver op poort 4185 en Playwright CLI).

Nieuwe of gewijzigde teksten krijgen geen automatisch gegenereerde spraak. Uitspraakmetadata is geregistreerd; alleen bestaande passende lokale opnamen kunnen worden afgespeeld. Ontbrekende opnamen blijven veilig stil. Geen account, cloudsync of netwerkafhankelijkheid toegevoegd.

## Bestanden

Implementatie: `index.html`, `scenes.css`, `language-journey-content/content.js`, `language-journey-content/level11-integration.js`.

Audit/tests: `scripts/thematic-didactic-audit.cjs`, `tests/level11-integration.test.cjs`, `tests/app-probe.cjs`, `tests/audio-course.test.cjs`, `tests/content.test.cjs`, `tests/japanese-ui.test.cjs`, `tests/recall.test.cjs`, `tests/thematic-didactics.test.cjs`, plus de twee browser-QA-scripts hierboven en dit verslag.

Gelijktijdig aangetroffen Recall-typografie-aanpassingen zijn behouden en niet als onderdeel van deze inhoudelijke opdracht herbouwd.
