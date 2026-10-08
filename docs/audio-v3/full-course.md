# Japanse audio voor de hele cursus

Uitbreiding op 8 oktober 2026. Alleen Japanse tekst wordt uitgesproken, inclusief kana, getallen, modelzinnen, gegenereerde vraagzinnen, voorbeeldregels, Japanse instructies en volledige lees-/bonusteksten. Nederlandse vragen en instructies krijgen geen TTS.

## Dekking en koppeling

- 343 bestaande woord-ID's blijven intact; 325 zijn cursuswoorden.
- 163 kana-/schrijftekens: 160 hebben een zelfstandige klankopname. Kleine っ/ッ en ー houden hun `context-only` status en laten via de bestaande woord-ID's het effect horen in きって, ベッド en コーヒー. De knop vermeldt zichtbaar “Hoor in …”.
- 119 getallen uit de bestaande getallessen krijgen een uitspraak; de symbolen en waarden blijven afkomstig uit die lessen.
- 318 zinnen/tekstfragmenten hebben expliciete uitspraakmetadata. Modelzinnen behouden hun `sentence-l*-model-*` ID. Aanvullende bestaande vraagzinnen krijgen stabiele `sentence-course-*` ID's; dit is geen tweede woordenlijst.
- Alle 54 leesblokken en 15 bonusverhalen hebben uitspraakmetadata. Level 11 en Level 12 hebben elk 10 reguliere teksten en 3 bonusteksten, allemaal aangesloten op de bestaande afspeelroute.
- De begroetingsdialoog en 8 bestaande partikel-/grammatica-uitspraakingangen blijven aangesloten. Overige grammatica-titels met lege plaatsen of patroonnotatie worden niet als een verzonnen zin uitgesproken.

De complete selectie bevat momenteel 1.017 opnamen voor 8.761 Japanse teksttekens. De testset bevat 18 opnamen, met beide stemrollen en extra controles voor Level 11/12, pijlrichting en de getaluitspraak van 600. De extra opname van de begroeting in rol B wordt via de testset gegenereerd; de huidige echte begroetingsdialoog gebruikt rol A.

`audio-course-readings.js` bevat de exacte cursusstring, kana-uitspraak, niveau, bronles en stabiele ID. Metadata wordt alleen toegepast op exact overeenkomende tekst. Nieuwe of gewijzigde tekst wordt niet automatisch geraden. Lexicale は in はは, はじめます en あさごはん en へ in へや blijven ongewijzigd; partikels は/を/へ hebben hun eigen functie en uitspraak. Los は blijft zonder expliciete ID ambigu.

## Uitspraakkeuzes en bronnen

Partikels zijn gecontroleerd tegen [Japan Foundation IRODORI Grammar_all.pdf](https://www.irodori.jpf.go.jp/assets/data/Grammar_all.pdf), pagina 1 (は → wa), pagina 11 (を → o) en pagina 62 (へ → e). Kana, kleine tsu en lange klinkers volgen de bestaande Level 1/3/5-lessen en de [Japan Foundation Starter Lesson 1](https://www.irodori.jpf.go.jp/assets/data/starter/pdf/X_L01.pdf). Getaluitspraak volgt de bestaande getallenbron en uitzonderingen in `numberReading`: bijvoorbeeld 300 sanbyaku, 600 roppyaku, 800 happyaku, 3000 sanzen en 8000 hassen.

De expliciete bord-/verhaallezingen zetten de aanwezige cijfers om: bijvoorbeeld 5ばん → ごばん, 10じ 15ふん → じゅうじ じゅうごふん, 24じかん → にじゅうよじかん. Voor kamer 305 gebruikt de cursus de volledige getallezing さんびゃくご, niet een nieuwe uitspraakregel voor losse hotelkamercijfers. De labels en kamernummers op het scherm veranderen niet.

Bij richtingborden worden →/↓/↑ uitgesproken als みぎ/した/うえ. In de stapsgewijze Level 11-procedure geeft → een overgang naar de volgende stap aan; daar is de uitspraak つぎに. ○ wordt まる; de letter A wordt エー. Een leeg invulvak blijft een pauze en krijgt geen verzonnen invulling. Dit zijn gedocumenteerde interpretaties van de bestaande visuele cursusbron, geen extra te leren woorditems. De echte TTS-opnamen moeten nog worden beluisterd om onder andere intonatie, pauzes en nummerlezingen te beoordelen.

## Oefeningen

Japanse zichtbare vraagteksten en leescontext krijgen een afspeelknop, ook als de vraag zelf Nederlands is. Nederlandse tekst wordt niet naar ElevenLabs gestuurd. Bij invulvragen wordt de volledige ingevulde Japanse zin pas na beantwoorden hoorbaar. Zinnen bouwen en Recall NL→JP houden antwoordaudio tot na het antwoord verborgen. Japanse instructies, voorbeeldregels en de voorbeeldwoorden in Level 5 hebben hun eigen knop. De bestaande stop-/vervangfunctie en mobiele tikbediening blijven gedeeld.

## Genereren

Configureer eerst de lokale sleutel en stem-ID's volgens [de instelhandleiding](../elevenlabs-pipeline.md). Daarna:

```powershell
npm run audio:pipeline -- plan --quality
npm run audio:pipeline -- quality
# Open output/audio-review.html en beluister alle 18 opnamen.
npm run audio:pipeline -- approve --reviewer "Je naam"
npm run audio:pipeline -- plan --all
npm run audio:pipeline -- generate --all
```

Je kunt ook `generate --level 11` of `generate --level 12` gebruiken. Dat omvat woorden, voorbeeldfragmenten en verhalen voor het betreffende level. Reeds actuele opnamen worden overgeslagen.

`npm run audio:coverage` inventariseert de werkelijke vraagbanken, ingevulde vragen, lesvoorbeelden, instructies en verhalen en faalt wanneer een Japanse tekst geen uitspraakbron heeft. De huidige 570 unieke cursusstrings hebben allemaal een uitspraakbron; kana/partikels blijven bij overlap aparte IDs. Deze inhoudscontrole bewijst geen echte audiodekking. De gebruiker heeft de testset voor deze versie goedgekeurd. Alle 1.017 geselecteerde opnamen zijn nu gegenereerd en gekoppeld, plus de extra begroeting met Ren: 1.018 MP3’s in totaal. De app biedt een opgeslagen snelheidskeuze van 1× of 0,75× met behoud van toonhoogte.

## Verificatie

Contentvalidatie: 0 fouten; de bestaande waarschuwingen over nog ontbrekende audio en drie previewwoorden blijven. De bestaande regressietests en acht aanvullende cursusaudiotests controleren onder andere vraagbankdekking, behouden woord-ID's, alle 69 passages, uitzonderlijke getaluitspraak, contextvoorbeelden en antwoordaudio na invullen. De clientbestanden hebben dezelfde nieuwe assetversie; de Recall-regressies zijn daarmee opnieuw geslaagd.

Mobiele Edge-controle op 375 pixels met expliciete mockopnamen: Level 11/12-verhalen, kleine tsu, lange klinkers en ingevulde vraagzin tonen passende knoppen, geen horizontale overflow en tikvlakken van minstens 44 pixels. Een tweede tik stopt de afspeelservice. Geen scriptfouten. Screenshots en controlecode staan in `output/playwright/audio-full/`. Deze fixtures bewijzen de aansluiting en layout, niet de uitspraakkwaliteit van echte ElevenLabs-opnamen.

Live koppeling op 8 oktober: beide stemmen gevonden via de officiële ElevenLabs-stemlijst, beide met `ja` als taallabel. Na de feedback over koffie is alleen die opname vervangen door Turbo v2.5 met Japans expliciet ingesteld; de gebruiker bevestigde de verbetering en keurde de testset voor deze versie goed. Alle 1.018 actuele bestanden bestaan en hebben geldige MP3-headers; de manifestcontrole vindt 0 fouten, 0 waarschuwingen en volledige dekking voor alle uitingen met uitspraakmetadata. Alle 33 gerichte audio- en pipelinetests slagen. De snelheidskeuze is op 375 px gecontroleerd: beide keuzes blijven na herladen bewaard, de browser behoudt de toonhoogte en er is geen horizontale overflow.
