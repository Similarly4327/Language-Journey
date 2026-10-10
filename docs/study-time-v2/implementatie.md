# Tijdregistratie V2 — implementatie

Bijgewerkt: 10 oktober 2026, volgens de prompt van 9 oktober 19:08 CEST en de leidende aanvullende UI-nuance.

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

Lange sessies worden niet afgekapt. Vanaf zes ruwe uren toont Activiteiten een controleaanduiding. De gebruiker kan effectieve minuten corrigeren; de ruwe registratie blijft behouden. Activiteiten toont de hoofdgroep, het type en een filter voor Leren/Recall. Ook handmatige activiteiten hebben een hoofdgroep. Intern blijven de groepen `curriculum` en `recall` heten.

## Voortgangsgrafiek

De tijdmetriek toont **één cumulatieve lijn: Totale leertijd**. Elke waarde is de som van curriculumtijd en Recall-tijd, inclusief Vrij oefenen. De schaal, nieuwste marker en geselecteerde marker volgen deze totale waarde. De twee afzonderlijke lijnen, extra markers en legenda uit de eerdere implementatie zijn verwijderd.

De bestaande periodebediening, lokale daggroepering en meetnavigatie blijven intact. Bij een geselecteerde tijdmeting staan compact **Leren**, **Recall** en **Totaal**; de twee bronnen tellen exact op tot de totale meetwaarde. Het kerngetal blijft de totale leertijd. Woorden en kanji behouden hun bestaande betekenis.

## Uitgevoerde controles

De volledige Node-regressiesuite behaalde **155 geslaagde tests, nul fouten**. De elf gerichte tijdregistratietests controleren geplande Recall, Vrij oefenen, passieve schermen, curriculum, optelling op dezelfde dag, achtergrondpauze, navigatie/hervatten, herladen/deduplicatie, historische gegevens, lange sessies en directe woordoefeningen. De grafiektests controleren onder andere lokale daggrenzen en zomer-/wintertijd.

De nieuwe regressietest controleert dat Leren 12u36 plus Recall 4u52 (verdeeld over geplande herhaling en Vrij oefenen) eindigt op één cumulatieve waarde van 17u28. Daarnaast controleren de tests dat de grafiek slechts één totale serie heeft, de schaal de som gebruikt en de uitsplitsing in de detailtekst blijft staan. `git diff --check` gaf geen fouten.

De echte UI is met Playwright in Edge op 375 CSS-pixels gecontroleerd, met synthetische gegevens in een afzonderlijk browserprofiel en een bestuurbare testklok:

| Scenario | Gemeten resultaat |
| --- | --- |
| Curriculumles | 20 minuten Curriculum |
| Alleen Recall-dashboard bekijken | 0 extra minuten |
| Geplande Recall | 10 minuten Recall |
| Vrij oefenen | 8 minuten Recall |
| Hervatten en herladen | 2 extra minuten; vier unieke activiteiten; queue gepauzeerd |
| Grafiek na herladen | Leren 20m, Recall 20m, Totaal 40m; exact één lijn |
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

De SRS-scheduler, woordselectie, ranking en lesinhoud zijn niet gewijzigd voor Tijdregistratie V2. Voor deze aanvulling zijn alleen `index.html`, `tests/study-time.test.cjs`, `scripts/study-time-ui.js`, de screenshot en dit verslag aangepast. De timerkoppeling en bestaande opslag zijn behouden. Er is geen commit, push of deployment uitgevoerd.
