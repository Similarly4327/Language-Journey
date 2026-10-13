# Vraaguitlijning en antwoordopties — 13 oktober 2026

## Gedeelde wijzigingen

- `index.html`: de bestaande vraagvelden staan in `question-stem`. Audio heeft op mobiel een eigen rij boven de tekst en op desktop een eigen kolom. De antwoordruimte wordt niet meer smaller door een speaker bij de vraag.
- `answer-option-row`: antwoord en speaker staan naast elkaar in aparte gridcellen. De speaker blijft een aparte button met de bestaande gedelegeerde audio-eventhandler; hij selecteert geen antwoord.
- De bestaande onthulfase blijft behouden. Verborgen antwoordrijen nemen geen ruimte in; de onthulknop blijft ongeveer 49 px hoog. Feedbackaudio heeft eveneens een eigen cel.
- De bestaande kana-, schrift-, getal-, reken-, woord- en zinsgeneratoren streven naar vier verschillende opties. Kana-afleiders komen uit de opgegeven les/selectie, niet uit toekomstige rijen. Een tweede spelling van dezelfde juiste klank wordt uitgesloten.
- `vocabularyChoices` vult kleine huidige woordsets aan vanuit de opgegeven bekende woordpool. De selectie gebruikt catalogus-ID, woordsoort, schrift en afzonderlijke betekenissen. Woordoefeningen mogen ook eerder geïntroduceerde woorden gebruiken, binnen de betreffende lesgrens. Bouwvragen behouden hun tegelinteractie.

## Oorzaak en bronnen Level 10

`contextualLessonWordQuestion` koos uitsluitend de huidige leswoorden zodra er ten minste twee waren. Les 10-2 introduceert `メニュー` en `みせて`; daarom bleef de vraag over “laat zien” op twee opties staan, hoewel eerdere werkwoorden beschikbaar waren.

De gedeelde selectie gebruikt nu ook eerdere passende werkwoorden. De betreffende lesvraag en dezelfde bron in het examen hebben vier opties, met precies één correct antwoord. Het examen behoudt zijn bestaande selectie en leerdoelen; de vraag wordt niet speciaal in ieder examen geforceerd.

In `manifest.vocabulary` zijn drie bestaande woordsoortvelden expliciet gemaakt: `みせて` en `ください` als werkwoordvormen, `ほん` (boek) als zelfstandig naamwoord. Daardoor vallen ze niet onder de eerdere automatische noun/counter-fallback. De schrijfwijze, uitspraak, betekenissen en stabiele IDs blijven behouden. De werkwoordtoepassing van `みせて` is gecontroleerd aan [Japan Foundation IRODORI, Grammar Worksheets Y](https://www.irodori.jpf.go.jp/assets/data/resources/Grammar_Worksheets_Y.pdf).

De vijf bestaande Level 10-focusbronnen en `reading-l10-5` bevatten nu ook een vierde gecontroleerde optie. De leesvraag contrasteert het station met het al bekende park; de rolvraag in Les 5 gebruikt ook het reeds zichtbare werkwoordblok `いきます`. Er zijn geen nieuwe leswoorden, regels of lesstappen toegevoegd.

## Pools met minder dan vier opties

De volledige momentopname staat in `question-small-pools-2026-10-13.json`, met bron-ID, vraag, correct antwoord en alle beschikbare opties. Geen van de huidige Level 10-lespools blijft onder vier.

Voorbeelden van aantoonbaar kleine gegenereerde pools:

- Level 4 Les 1: de hiragana-zelfstandige naamwoorden zijn `ねこ`, `いぬ`, `みず`: drie opties. `パン` is op dat punt het eerste katakana-woord; een minimale bekende hiragana-vergelijking levert twee opties. `これ` is het eerste aanwijzende woord en krijgt een minimale vergelijking met een ander bekend woord.
- Vroege Level 4-structuurvragen: de beschikbare behandelde bouwstenen zijn alleen `は` en `です`: twee opties. Na introductie van `の` zijn drie mogelijk; latere pools leveren vier.
- Kana/selectievragen met slechts twee of drie afzonderlijke toegestane klanken/schrijfwijzen houden twee of drie opties. Er worden geen toekomstige rijen geïmporteerd om het aantal aan te vullen.

Daarnaast blijven gesloten, handmatig geschreven focus- en contextvragen elders met twee/drie gecontroleerde bronopties behouden. Dat is een beperkte **gecontroleerde bronpool**, geen bewering dat taalkundig nooit een vierde afleider mogelijk is. Uitbreiding daarvan vraagt een inhoudelijk beoordeelde nieuwe afleider; de generator plakt geen willekeurige woorden op een specifieke grammatica-, tijd- of leesvraag. Deze gevallen zijn apart herkenbaar in de momentopname.

## Controle

- Browsercontrole op 320, 375 en 1280 px: kana in beide richtingen, kleine pool, Level 10-woordvraag, Les 5, leesvraag, examen, zonder audio en langere Nederlandse vertalingen.
- Alle 27 combinaties: geen horizontale overflow, geen overlappende antwoord-/audioknoppen, alle mobiele tekst- en antwoordvelden benutten de volledige interne kaartbreedte. Geen JavaScript-fouten.
- Audio bij de vraag en in antwoorden start de bestaande playbackroute zonder index/score te wijzigen. De browsercontrole gebruikt een geïsoleerd profiel en gesimuleerde audio; de kwaliteit van opnames is hiermee niet opnieuw beoordeeld.
- Antwoordopties blijven verborgen tot onthullen; onjuist antwoord geeft feedback en markeert het juiste antwoord. Voortgang, Recall, SRS en bestaande navigatie blijven behouden.
- Gerichte regressies staan in `tests/question-options.test.cjs`. De bestaande render-smoke-test controleert nu expliciet huidige **of eerder geïntroduceerde** afleiders, met uitsluiting van toekomstige woorden.
- Definitieve volledige testuitvoering: **163 tests geslaagd, 0 fouten**. Browsermetingen en mobiele screenshots staan in `output/playwright/question-layout/`.
- Inhoudsvalidatie: nul fouten; de bestaande waarschuwingen over ontbrekende optionele audio en drie verweesde datumwoorden blijven gemeld.

De werkmap bevat daarnaast gelijktijdige wijzigingen aan audio en examenbudgetten uit ander werk. Die zijn geen onderdeel van deze layout-/afleiderpatch.
