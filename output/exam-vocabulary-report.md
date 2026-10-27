# Punt 4 — woordregistratie na levelexamen

De afsluiting van een geslaagd officieel levelexamen registreert nu alle unieke, actuele woorden uit de gekoppelde lessen en voorbeelden. De selectie gebruikt de bestaande catalogus-ID's, bronkoppeling en het bronlevel; kana, historische vervallen woorden en woorden uit andere levels worden niet toegevoegd. De registratie gebeurt vóór de kennissnapshot van het examen, zodat de woordgroei in de sessie klopt. Een nieuw examenresultaat kan uitgestelde woorden van dat level bevestigen, zonder toekomstige woorden te ontsluiten.

Bekende woorden krijgen geen dubbele registratie of verzonnen historische datum. Bestaande eerste-ontmoetingsdatums tellen ook mee in de gedeelde woordenteller. Recall houdt de bestaande bron-, Copper- en selectieregels. Registratie wijzigt geen SRS-records, herhaaldata of woordmastery. Een mislukt of verlaten examen registreert niet automatisch de volledige levelwoordenschat; de bestaande registratie van daadwerkelijk getoonde vraagwoorden blijft bestaan.

## Opslagonderzoek

De opslagkey blijft `taal-japanse-leerapp-v1` voor Japans. In de code is geen vervaltermijn voor inactiviteit gevonden. Een geplande opslag had wel een venster van 80 ms en werd bij verlaten zonder actieve studiesessie niet direct uitgevoerd. Pagehide en het verbergen van de pagina slaan nu ook dan direct op. Examenafsluiting sloeg al synchroon op en doet dat nog steeds.

De app gebruikt lokale browseropslag. De beschikbare code en synthetische fixtures bevatten geen bewijs voor de oorzaak van het eerdere persoonlijke gegevensverlies. Er is geen persoonlijke opslag onderzocht of hersteld. De bestaande snapshot vóór migratie en exportmogelijkheid blijven behouden. Wissen van browserdata of gebruik van een andere browser/origin wordt hiermee niet opgelost.

## Verificatie — maximaal twee uitvoeringen per controle

- Eerste gerichte ronde: 80 tests geslaagd, geen fouten.
- Tweede ronde, volledige suite: 189 tests geslaagd, geen fouten. Nieuwe regressies dekken Levels 4–15, exacte groei, herkansen, scoreopslag, nieuwe appinitialisatie na 120 dagen, bronbeperking, mislukte/verlaten examens, SRS-behoud, handmatige Recall-selectie en directe opslag bij verlaten/verbergen.
- Browsercontrole: twee pogingen, beide gestopt op een te strenge testverwachting. Gemeten: 1 → 20 woorden, 20 opgeslagen woorden, 20 woorden in de sessie-eindmeting, 20 Recall-woorden, score 30/30, ongewijzigde SRS in beide richtingen. De controle verwachtte dat de afsluitfunctie alle 19 woorden toevoegde; in de tweede poging waren 2 daarvan al bij het tonen van de eerste vraag geregistreerd, zodat de afsluitfunctie correct nog 17 toevoegde.
- De browserverwachting is gecorrigeerd naar totale sessiegroei en resterende woorden na de eerste vraag. Niet opnieuw uitgevoerd vanwege de limiet. De browserstappen voor verversen/herkansen en desktop zijn daardoor niet bereikt; deze gevallen zijn wel in de geautomatiseerde suite geslaagd.

Log volledige suite: `output/exam-vocabulary-tests.log`. Browserdiagnostiek: `output/playwright/exam-vocabulary/results.txt`.
