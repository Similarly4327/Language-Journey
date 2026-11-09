# ElevenLabs instellen en koppelen

De pipeline gebruikt het bestaande audiofundament en de stabiele catalogus-ID's. De browser speelt gegenereerde MP3's af; de ElevenLabs-sleutel blijft lokaal. Node.js 22 of hoger is nodig. Er zijn geen extra npm-pakketten nodig.

Voor de spreadsheetbacklog van 31 oktober 2026 is er een afzonderlijke [lokale import- en reviewlaag](audio-backlog-20261031.md): `npm run audio:backlog -- inspect|plan|import`. Deze doet geen netwerkverzoeken of synthese en importeert uitsluitend exact gekoppelde bestaande canonieke audio-entry's. Kandidaatcontent wordt nooit automatisch lesstof.

In **Opties → Audio en geluid → Spreeksnelheid** kiest de gebruiker normaal (1×) of langzamer (0,75×). Dezelfde keuze staat bij de audio-instellingen in het profiel. De app bewaart deze keuze lokaal, gebruikt standaard 1× voor bestaande gebruikers en behoudt de toonhoogte. De snelheid geldt voor alle Japanse opnamen, inclusief dialoogregels; het antwoordgeluid blijft op normale snelheid. Er worden hiervoor geen nieuwe MP3's gegenereerd.

Op Windows kan Node bij een bedrijfsproxy `SELF_SIGNED_CERT_IN_CHAIN` melden. Gebruik dan `node --use-system-ca scripts/audio-pipeline.cjs generate --all` (Node 24), zodat Windows' vertrouwde certificaten worden gebruikt. Schakel certificaatcontrole niet uit.

## 1. Instellen

```powershell
npm run audio:setup
```

Vul in het aangemaakte `.env.elevenlabs.local` je `ELEVENLABS_API_KEY`, `VOICE_A_ID` en `VOICE_B_ID` in. Dit bestand wordt door Git genegeerd en hoort niet bij de te publiceren websitebestanden. Bestaande procesvariabelen hebben voorrang. `audio:setup` overschrijft bestaande instellingen nooit.

Gebruik een sleutel met toegang tot Text to Speech en, voor de stemlijst, Voices. Zoek de beschikbare stem-ID's op:

```powershell
npm run audio:voices
npm run audio:status
```

De stemlijst toont naam, ID en beschikbaar taallabel. Kies stemmen die natuurlijk Japans spreken; een label alleen bewijst geen uitspraakkwaliteit. Rol A is de hoofdspreker, rol B is de tweede dialoogstem. Je kunt dezelfde stem-ID voor beide rollen gebruiken. De rollen staan los van de avatar en persoonlijke namen.

`audio/config.json` bevat model, formaat en steminstellingen. Sinds 9 november 2026 is de standaard `eleven_v4` met `mp3_44100_128`, expliciete taal `ja` en de bestaande gecontroleerde kana-uitspraak. De adapter gebruikt hiervoor [Create dialogue](https://elevenlabs.io/docs/api-reference/text-to-dialogue/convert), ook voor één losse zin of één woord. Legacy `voice_settings` blijven voor de oude TTS-adapter beschikbaar maar worden niet als ongedocumenteerde velden naar de v4 Dialogue API gestuurd. `next_text` wordt voor v4 als `future_text` verzonden. V4 Turbo wordt niet via een ongeschikte HTTP-route aangeroepen; het vereist een afzonderlijke WebSocket-adapter. Stemmen worden met paginering uit [List voices](https://elevenlabs.io/docs/api-reference/voices/search) opgehaald.

De gebruiker heeft de vier Sakura-v4-vergelijkingsclips beluisterd en v4 gekozen, en daarna expliciet herziening van de hele bibliotheek met beide stemmen gevraagd. Het manifest bewaart deze beperkte luisterproef en bredere generatieautorisatie afzonderlijk in `modelTransitionApproval`, gebonden aan configuratiehash en stemvingerafdrukken. Dit is geen bewering dat alle clips of stem B afzonderlijk zijn beluisterd. Nieuwe opnamen vermelden `modelId`, `languageCode`, `reviewBasis` en `individuallyListened:false`. Zie [het modelonderzoek](elevenlabs-model-review-2026-11-09.md).

Historisch kreeg onder meer `vocab-コーヒー` na een Engelse uitspraak een Turbo-v2.5-uitzondering met expliciet Japans; de gebruiker keurde die proef op 8 oktober goed. Bij de volledige v4-overgang vervallen deze modeluitzonderingen, zodat de bibliotheek consequent v4 gebruikt. De Japanse tekst en canonieke IDs blijven behouden. Overrides en het model tellen mee in de generatiehash.

## 2. Testset beluisteren

```powershell
npm run audio:pipeline -- plan --quality
npm run audio:pipeline -- quality
```

Open `output/audio-review.html` in de browser. De pagina bevat 18 opnamen met uitspraaktekst en afspeelknoppen, waaronder korte/lange klinkers, kleine kana, kleine tsu, zinnen, Level 11/12-verhalen, getallen, pijlrichtingen en beide stemrollen. Je kunt de pagina ook openen als `/output/audio-review.html` via je lokale webserver. Met `npm run audio:pipeline -- review` bouw je de pagina opnieuw zonder API-verzoeken.

Controleer alle opnamen op verstaanbaarheid, mora-timing, klinkerlengte en zinsintonatie. Keur daarna expliciet goed:

```powershell
npm run audio:pipeline -- approve --reviewer "Je naam"
```

De testset verschijnt pas na goedkeuring in de app. Veranderde uitspraak, stem of modelinstellingen vereisen opnieuw een actuele testset en beoordeling. De bestaande batch bewaakt deze stap ook bij rechtstreeks gebruik van `audio:batch`.

## 3. Genereren en automatisch koppelen

```powershell
# Eerst aantallen en Japanse teksttekens bekijken; geen API-verzoeken.
npm run audio:pipeline -- plan --words
# Alle 325 cursuswoorden.
npm run audio:pipeline -- generate --words
# Of een kleine selectie.
npm run audio:pipeline -- generate --lesson l4-1
# Alle content waarvoor expliciete uitspraak beschikbaar is, inclusief previews/legacy.
npm run audio:pipeline -- plan --all
npm run audio:pipeline -- generate --all
```

Andere selecties: `--ids vocab-ねこ,vocab-いぬ`, `--level 4` of `--range 1-5`. Kies precies één selectie. `--dry-run` voert alleen de planning uit; `--force` of `--regenerate` genereert de selectie opnieuw. De planner telt teksttekens voor de nog benodigde verzoeken; dit is geen bedrag of creditraming. Bij ontbrekende stemconfiguratie is overslaan van bestaande bestanden nog niet betrouwbaar te bepalen.

Voor gewone woordopnamen kiest `--voice-role A`, `--voice-role B` of `--voice-role both` de gewenste stemrollen; standaard is A. Bijvoorbeeld `generate --ids vocab-はは --voice-role both`. Dialoogregels behouden hun eigen stemrol. De kwaliteitstest bepaalt zelf haar rollen en kan niet met deze optie worden gecombineerd. Actuele bestanden worden per stemrol overgeslagen. Een `entry_overrides`-instelling kan `previous_text` en `next_text` als afzonderlijke context aan ElevenLabs meegeven: ze worden niet aan de uitgesproken tekst toegevoegd. Deze context telt mee in de generatiehash.

Na een geslaagde batch controleert de pipeline het manifest en de bestanden en werkt zij de clientversie bij. De bestaande speakers in lessen, quiz, Dictionary, Kennis en Recall vinden de audio via dezelfde ID's. Publiceer daarna de bijgewerkte `index.html`, het manifest en de gegenereerde MP3's met de overige websitebestanden.

Actuele bestanden worden overgeslagen. Na een fout kun je dezelfde opdracht herhalen; eerder geslaagde opnamen blijven bewaard. Verzoeken hebben een timeout; er worden geen automatische betaalde herhaalverzoeken uitgevoerd. Nieuwe teksten zonder expliciete uitspraak worden overgeslagen en verschijnen in `audio:status` onder `missingReadings`. De pipeline bedenkt geen lezingen en wijzigt geen voortgang of SRS. [De volledige cursusuitbreiding](audio-v3/full-course.md) beschrijft de klanken, alle verhalen en vraagzinnen. Controleer de inhoudsdekking met `npm run audio:coverage`.

## Woordtelling op 8 oktober 2026

| Catalogus | Aantal |
| --- | ---: |
| Cursuswoorden (`core`) | 325 |
| Previewwoorden | 3 |
| Oudere compatibiliteitsitems (`legacy`) | 15 |
| Totaal stabiele woord-ID's | **343** |

Er zijn ook 343 unieke Japanse schrijfvormen. Kana-klanken en grammatica-items zijn apart en tellen niet als woorden mee. Alle 343 woorditems hebben uitspraakmetadata. Op het moment van implementatie zijn er **0 echte Japanse opnamen**. `npm run audio:status` geeft steeds de actuele telling en audiodekking.
