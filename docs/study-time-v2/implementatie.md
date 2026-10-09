# Tijdregistratie V2 — implementatie

Bijgewerkt: 9 oktober 2026.

## Oorzaak en oplossing

Recall gebruikte de bestaande studietimer niet. Daardoor werden geplande herhaling en Vrij oefenen niet als tijdactiviteit opgeslagen. Recall gebruikt nu dezelfde `beginStudySession`, zichtbaarheidspauze, afronding en opslag als curriculumactiviteiten. Er is geen tweede timer toegevoegd.

Het totaal is curriculumtijd plus Recall-tijd. Een daadwerkelijke Recall-queue start de timer; het dashboard en lege selecties starten niets. Pauzeren, afronden of navigeren sluit het gemeten segment. Hervatten start een nieuw segment met behoud van de kaarten en hun planning. Expliciet openen van lesmateriaal, woordoefeningen en vervolgstappen wordt als curriculum geregistreerd. Passieve overzichten en Woordenboek tellen niet mee; een artikel onderbreekt de lopende timer en sluiten hervat dezelfde activiteit.

## Opgeslagen activiteiten

- `activityGroup`: `curriculum` of `recall`.
- Recall-types: `scheduledRecall` en `freePractice`.
- Bestaande velden `startedAt`, `endedAt`, `rawSeconds`, `effectiveSeconds` blijven leidend.
- Genormaliseerde velden `startTimestamp`, `endTimestamp`, `date`, `rawDuration` en `effectiveDuration` ondersteunen de activiteitweergave. Duurvelden zijn seconden; `date` gebruikt de lokale kalenderdag.
- Recall-metadata bevat modus, aantal kaarten en beschikbare sessietellers.

Oude activiteiten worden bij het lezen geclassificeerd; oude opgeslagen records worden hiervoor niet herschreven. Historische curriculumtijd blijft behouden. Niet eerder geregistreerde Recall-tijd wordt niet achteraf geschat. De bestaande historische basistijd blijft onderdeel van het totaal, zonder verzonnen datumpunten in de grafiek. Handmatig bewerken behoudt dit basiskenmerk.

## Zichtbaarheid, herladen en lange sessies

De bestaande timer meet zichtbare activiteit en pauzeert wanneer de pagina naar de achtergrond gaat. `rawSeconds` behoudt deze bestaande definitie; het is geen ongefilterde wandkloktijd. Een opgeslagen checkpoint wordt bij herladen eenmaal hersteld, ook bij korte sessies. Identieke sessie-ID's worden niet opnieuw toegevoegd. Niet opgeslagen tijd na een onverwachte crash wordt niet gereconstrueerd.

Een herstelde Recall-queue staat gepauzeerd totdat de gebruiker hervat. Er worden geen SRS-records, ranks, mastery of eerdere voortgang gewist. Een oude queue zonder tijdregistratie levert geen geschatte historische uren op.

Lange sessies worden niet afgekapt. Vanaf zes ruwe uren toont Activiteiten een controleaanduiding. De gebruiker kan effectieve minuten corrigeren; de ruwe registratie blijft behouden. Activiteiten toont de hoofdgroep, het type en een filter voor Curriculum/Recall. Ook handmatige activiteiten hebben een hoofdgroep.

## Voortgangsgrafiek

De tijdmetriek toont twee cumulatieve lijnen: Curriculum en Recall. De bestaande periodebediening, lokale daggroepering en meetnavigatie blijven gedeeld. De geselecteerde meting noemt beide deelwaarden en hun totaal; het kerngetal blijft de totale leertijd. Woorden en kanji behouden hun bestaande betekenis.

## Uitgevoerde controles

De volledige Node-regressiesuite behaalde **154 geslaagde tests, nul fouten**. Daarnaast zijn tien gerichte tijdregistratietests toegevoegd voor geplande Recall, Vrij oefenen, passieve schermen, curriculum, optelling op dezelfde dag, achtergrondpauze, navigatie/hervatten, herladen/deduplicatie, historische gegevens, lange sessies en directe woordoefeningen. De grafiektests controleren onder andere lokale daggrenzen en zomer-/wintertijd.

Na de laatste aanpassingen aan lesvervolgstappen, de Dakuten-lesselectie en behoud van het basiskenmerk zijn de 25 tests voor studietijd, grafiek en schermrendering opnieuw geslaagd. De inhoudsvalidator rapporteerde nul fouten en vier waarschuwingen over optionele audio en ongebruikte cataloguswoorden. `git diff --check` gaf geen fouten.

De echte UI is met Playwright in Edge op 375 CSS-pixels gecontroleerd, met synthetische gegevens in een afzonderlijk browserprofiel en een bestuurbare testklok:

| Scenario | Gemeten resultaat |
| --- | --- |
| Curriculumles | 20 minuten Curriculum |
| Alleen Recall-dashboard bekijken | 0 extra minuten |
| Geplande Recall | 10 minuten Recall |
| Vrij oefenen | 8 minuten Recall |
| Hervatten en herladen | 2 extra minuten; vier unieke activiteiten; queue gepauzeerd |
| Grafiek na herladen | Curriculum 20m, Recall 20m, totaal 40m; twee lijnen |
| Handmatige correctie van Vrij oefenen | 8 naar 6 effectieve minuten; ruwe 8 minuten behouden; totaal 38m |

Geen JavaScript-fouten of horizontale overflow tijdens deze UI-controle. De mobiele screenshot is visueel bekeken. Er is geen echte Safari-/iPhone-sessie of publieke deployment gecontroleerd. Na deployment moeten achtergrondgedrag en herladen op het echte toestel nog worden nagegaan.

## Bestanden voor deze wijziging

- `index.html`: timerkoppeling, herstel, activiteiten en grafiek.
- `tests/app-probe.cjs`: bestuurbare klok en observatie van de bestaande app.
- `tests/recall.test.cjs`: navigatie/pauze-regressie en DOM-stub.
- `tests/study-time.test.cjs`: gerichte timingregressies.
- `scripts/study-time-ui.js`: reproduceerbare echte UI-controle met uitsluitend testinstrumentatie.
- `output/playwright/study-time/mobile-time.png`: mobiele screenshot.
- Dit verslag.

De SRS-scheduler, woordselectie, ranking en lesinhoud zijn niet gewijzigd voor Tijdregistratie V2. Tegelijk verschenen audio- en avatarwijzigingen uit ander werk in dezelfde werkmap; die zijn behouden en vallen buiten dit verslag.
