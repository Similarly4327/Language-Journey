# Recall V2 — audit en implementatie

Datum: 7 oktober 2026.

## Audit vóór implementatie

De centrale bron is `LanguageJourneyContent.manifest.vocabulary` in `language-journey-content/content.js`. Lessen verwijzen naar stabiele woord-IDs via `wordIds` en `exampleIds`; `introducedAt` geeft het oorspronkelijke level, de lesvolgorde en eventueel module A/B. `vocabCatalog` wordt hieruit opgebouwd. Dictionary en Kennis gebruiken dezelfde catalogus.

Les- en examenranks staan in `rankState`, opgeslagen naast de bestaande state onder `taal-japanse-leerapp-v1`. Examenranks gebruiken `l${level}-exam`; sommige verhuisde winkel-lessen behouden bewust hun historische `l11-*` IDs in Level 15.

De oude centrale `flashcardEligible` liet woorden toe via `introducedVocabIds`, een lesrank óf reviewhistorie. Woordintroducties vullen de eerste lijst al tijdens het bekijken. Daardoor konden alleen bekeken winkel-/reiswoorden of eerder onterecht gereviewde woorden in Recall komen. Er was geen blacklist nodig.

Auto Recall mengt twee vertaalrichtingen en kiest eerst due kaarten, daarna nieuwe kaarten, met maximaal 40 kaarten/20 nieuwe. Handmatige selectie hoort bij Vrij oefenen. SRS-records staan per `woord-ID::richting` in `flashcardProgress.cards`, met dueAt, intervalDays, repetitions, lapses en laatste beoordeling. De oude fout-herhaling werd eenmaal achteraan toegevoegd; dit verklaart herkenbare fout-staarten.

## Centrale regel en wijzigingen

- `flashcardEligible`: uitsluitend geldige centrale entries met een geverifieerde bron en `recallCore`, plus Copper/Silver/Gold/Platinum op de bronles OF het bronlevel-examen. Bekijken en reviewhistorie zijn geen vrijgavebewijs.
- Alle bestaande Recall-pools, de handmatige woordselectie, aantallen en due-selectie gebruiken deze functie. Ook hervatten en direct beoordelen controleren de gate.
- `vocabCatalog`: bronles wordt gevonden via daadwerkelijk level/lesvolgorde/woord-ID, met behoud van de bestaande les- en woord-IDs. Metadata voor core/context, introductiepunt, module en bronvalidatie wordt doorgegeven. Dit herstelt onder meer `l11-home-*` bronnen; winkel-lessen op Level 15 blijven hun echte `l11-*` IDs houden.
- `scheduleRecallRetry`: fout-herhaling na 5–10 andere kaarten wanneer beschikbaar, kortere afstand bij korte sessies, nooit direct dezelfde kaart, maximaal twee extra pogingen per woord/richting.
- `sanitizeRecallSessionQueue`: oude toekomstige kaarten en onbedoelde duplicaten worden uit de resterende sessie geweerd. Beide richtingen blijven aparte kaarten. Oude antwoordopties worden opnieuw gevalideerd zodat toekomstige decoys niet via hervatten terugkomen.
- Feedback bevat één correct antwoord met Dictionary-link en oorspronkelijke level/les/titel. De automatische doorgang wordt stilgezet tijdens het naslaan. Sluiten keert terug naar dezelfde antwoordstatus.
- Mobiel: Sla over / Volgende kaart op één rij, Onderbreek sessie eronder. Knoppen minimaal 48 px, labels passen ook op 320 px.
- Nederlandse, Engelse en Duitse Recall-uitleg beschrijft nu de Copper-vrijgave.

## Data en broncontrole

Geen destructieve migratie. Bestaande ranks, introductievlaggen, woord-IDs, mastery en SRS-records blijven behouden. Oude toekomstige reviews tellen niet mee zolang de bron niet is behaald en worden weer bruikbaar zodra het woord legitiem is vrijgegeven.

De systematische audit is reproduceerbaar met `node scripts/audit-recall-vocabulary.cjs`. De volledige tabel staat in `vocabulary-audit.csv`; de samenvatting in `vocabulary-audit.json`.

343 catalogusentries, 325 Recall-corewoorden. **0 corewoorden zonder geldige bron.** Drie vooruitblikentries (ついたち, ふつか, みっか; Level 21) hebben nog geen bestaande bronles. Ze zijn als preview geregistreerd, geen Recall-core, en blijven uitgesloten. Ze vereisen inhoudelijke afwerking wanneer Level 21 wordt gebouwd.

## Controles

- Gerichte integratietests gebruiken de echte curriculumgate: niet geopend, bekeken, gedeeltelijk, Copper/hogere ranks, examenroute, volgend level, context/preview, bronmetadata, verborgen historische reviews en hervatten.
- Daarnaast: beide richtingen onafhankelijk, due/nieuwe limieten, maximaal twee retries met afstand, geen onmiddellijke lone-card-herhaling, geen onbedoelde duplicaten, oude decoys en Dictionary zonder reviewmutatie.
- Bestaande SRS-unitfixtures houden een beperkte synthetische woordpool om intervallen/timers/richtingen afzonderlijk te testen. De nieuwe curriculum-integratietests gebruiken deze fixture niet.
- Browsercontrole op 320, 375, 390 en 1280 CSS-pixels: feedbackknoppen, geen horizontale overloop, Dictionary openen/sluiten na een fout zonder wijziging van sessie/ranks/SRS. Screenshots in `output/playwright/recall-v2-audit`.
- Geen fysieke iPhone/Safari-controle. Geen publicatie uitgevoerd.

## Gewijzigde bestanden voor deze revisie

`index.html`, `language-journey-content/content.js`, `locales/nl.js`, `locales/en.js`, `locales/de.js`, `tests/recall.test.cjs`, `scripts/audit-recall-vocabulary.cjs`, deze auditdocumenten en mobiele screenshots. Eerder aanwezige wijzigingen blijven behouden.

Definitieve volledige testrun: **92 tests geslaagd, 0 mislukt**.
