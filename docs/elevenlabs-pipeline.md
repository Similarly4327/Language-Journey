# ElevenLabs instellen en koppelen

De pipeline gebruikt het bestaande audiofundament en de stabiele catalogus-ID's. De browser speelt gegenereerde MP3's af; de ElevenLabs-sleutel blijft lokaal. Node.js 22 of hoger is nodig. Er zijn geen extra npm-pakketten nodig.

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

`audio/config.json` bevat model, formaat en steminstellingen. De huidige combinatie is `eleven_multilingual_v2` met `mp3_44100_128`. Dit model ondersteunt geen `language_code`; de app stuurt de bestaande expliciete kana-uitspraak. Bron: [ElevenLabs Create speech](https://elevenlabs.io/docs/api-reference/text-to-speech/convert). Stemmen worden met paginering uit [List voices](https://elevenlabs.io/docs/api-reference/voices/search) opgehaald.

## 2. Testset beluisteren

```powershell
npm run audio:pipeline -- plan --quality
npm run audio:pipeline -- quality
```

Open `output/audio-review.html` in de browser. De pagina bevat 14 opnamen met uitspraaktekst en afspeelknoppen, waaronder korte/lange klinkers, kleine kana, kleine tsu, zinnen en beide stemrollen. Je kunt de pagina ook openen als `/output/audio-review.html` via je lokale webserver. Met `npm run audio:pipeline -- review` bouw je de pagina opnieuw zonder API-verzoeken.

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

Na een geslaagde batch controleert de pipeline het manifest en de bestanden en werkt zij de clientversie bij. De bestaande speakers in lessen, quiz, Dictionary, Kennis en Recall vinden de audio via dezelfde ID's. Publiceer daarna de bijgewerkte `index.html`, het manifest en de gegenereerde MP3's met de overige websitebestanden.

Actuele bestanden worden overgeslagen. Na een fout kun je dezelfde opdracht herhalen; eerder geslaagde opnamen blijven bewaard. Verzoeken hebben een timeout; er worden geen automatische betaalde herhaalverzoeken uitgevoerd. Ongecontroleerde zinnen/passages worden overgeslagen en verschijnen in `audio:status` onder `missingReadings`. De pipeline bedenkt geen lezingen en wijzigt geen voortgang of SRS.

## Woordtelling op 8 oktober 2026

| Catalogus | Aantal |
| --- | ---: |
| Cursuswoorden (`core`) | 325 |
| Previewwoorden | 3 |
| Oudere compatibiliteitsitems (`legacy`) | 15 |
| Totaal stabiele woord-ID's | **343** |

Er zijn ook 343 unieke Japanse schrijfvormen. Kana-klanken en grammatica-items zijn apart en tellen niet als woorden mee. Alle 343 woorditems hebben uitspraakmetadata. Op het moment van implementatie zijn er **0 echte Japanse opnamen**. `npm run audio:status` geeft steeds de actuele telling en audiodekking.
