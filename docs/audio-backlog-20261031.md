# Lokale integratie van de ElevenLabs-backlog

Bron: [Language Journey — ElevenLabs audio-backlog — 2026-10-31](https://drive.google.com/file/d/1Suj7y3NVGQVB-UbHf5_BoUhKd69xazGwCkkuGpQYv7s/view). Dit Drive-bestand is XLSX, met de tabbladen Overzicht, Woorden, Zinnen, Dialogen, Stemmen en Codex.

De importlaag doet **geen netwerkverzoeken en genereert geen audio**. De manager controleert accountbalans, inhoudelijke goedkeuring, daadwerkelijke synthese en kosten buiten deze CLI. De bestaande betaalde `audio:pipeline generate` wordt door deze importlaag nooit aangeroepen.

## Grens tussen backlog en cursus

Alleen een expliciet goedgekeurde binding naar een **bestaande canonieke audio-entry** kan in het bestaande appmanifest terechtkomen. De appcatalogus, lessen, woorden, grammatica, dialogen, voortgang en SRS veranderen niet. Er is geen kandidaatregister of alternatieve tekstresolver in de player toegevoegd.

Een exacte tekstmatch in het inspectierapport is een suggestie, geen binding. Een sheet-ID wordt nooit een nieuwe cursus-ID. Zowel displaytekst als de gecontroleerde `pronunciation.audioTextKana` moeten exact overeenkomen. Partikels worden niet automatisch herschreven en cijfers worden niet automatisch uitgesproken. De planuitvoer neemt TTS-tekst en modelinstellingen uit de canonieke app-entry; een afwijkende sheet-reading wordt afgewezen in plaats van stil gecorrigeerd.

De gelezen snapshot bevat 124 woorden, 309 zinnen en 2.622 dialoogregels. De JA-selectie bestaat uit 2.260 P1/P2-rijen (29.144 tekens) en 200 P3-rijen (2.355 tekens). De overige 595 rijen staan op NEE. Van de geselecteerde P1/P2-rijen hebben 160 cijfers of andere niet-toegestane tekens in hun kana-input. Deze 31.499 geselecteerde tekens zijn dus geen automatisch goedgekeurde generatiebatch.

Inspectie zonder bindings geeft: 2.100 `unmapped`, 160 `invalid-kana`, 200 `p3-held`, 595 `not-selected`. De bron en het volledige reviewrapport staan lokaal in `output/audio-backlog/backlog-20261031.json` en `output/audio-backlog/review-20261031.json`. Dit zijn werkbestanden; ze worden niet door de app geladen.

## Invoer en mapping

`--workbook` accepteert een lokale `.xlsx` of een JSON-export met deze vorm:

```json
{
  "schemaVersion": 1,
  "sheets": {
    "Overzicht": [["Instelling", "Waarde"], ["Buffer voor retries", "3500"]],
    "Woorden": [["Audio ID", "...kolomnamen uit de bron..."]],
    "Zinnen": [["Audio ID", "...kolomnamen uit de bron..."]],
    "Dialogen": [["Audio ID", "...kolomnamen uit de bron..."]],
    "Stemmen": [["Voice key", "ElevenLabs voice ID"], ["NARRATOR", ""], ["LEAD_A", ""], ["PARTNER_B", ""]],
    "Codex": [["Regel", "Instructie"]]
  }
}
```

De JSON-rijen bevatten de volledige oorspronkelijke kolommen. XLSX wordt lokaal als ZIP/XML gelezen via de meegeleverde Windows PowerShell-adapter; Office, Python en npm-downloads zijn niet nodig. Formules worden niet uitgevoerd: alleen opgeslagen celwaarden worden gelezen. Externe XML-entiteiten zijn verboden.

Een afzonderlijk, nagekeken bindingsbestand bevat bijvoorbeeld:

```json
{
  "bindings": [
    {"audioId": "w-0001", "entryId": "vocab-パン"},
    {"audioId": "w-0002", "entryId": "vocab-みず"}
  ]
}
```

| Backlogveld | Verwerking |
| --- | --- |
| Audio ID | Blijft bewaard als `backlogAudioId`, inclusief oorspronkelijke bestandsnaam |
| Expliciete binding `entryId` | Bestaand `content.audioEntryById`-ID; wordt `asset.entryId` voor de huidige player |
| Audio tekst kana | Moet kana-only én exact gelijk zijn aan de gecontroleerde canonieke reading |
| Display JP | Exact gelijk aan de bestaande displaytekst; woorden gebruiken het kana-veld als display |
| Genereren? | Alleen JA; NEE blijft uitgesloten, ook bij GEGENEREERD |
| Prioriteit | P1 vóór P2; P3 alleen met `--include-p3` en resterende ruimte in het plan |
| NARRATOR / LEAD_A | Bestaande `VOICE_A_ID`, rol A |
| PARTNER_B | Bestaande `VOICE_B_ID`, rol B; bij dialogen moeten A en B verschillen |
| Stemmen-tab | Eventueel ingevulde stem-ID moet overeenkomen met lokale rolconfiguratie; nooit automatisch overgenomen |
| Output bestand | Bron onder `--assets-root`, bijvoorbeeld `audio/words/w-0001.mp3` |
| Appbestand | `assets/audio/ja/backlog/words/w-0001.mp3`; de voorgestelde mapindeling en naam blijven herkenbaar |
| Generation status | Alleen exact GEGENEREERD mag nieuw worden geïmporteerd |
| Werkelijke credits | Moet overeenkomen met het lokale generatiebewijs indien in de sheet ingevuld |

Iedere dialoogrij blijft één volledige utterance. Een binding verwijst naar een bestaande canonieke zin, nooit naar een complete nieuwe dialoog. Alleen de bestaande appdialoog bepaalt volgorde, avatars en A/B-wisseling. Deze importer bouwt geen zinnen uit woordclips en maakt geen scènes aan. Als de bestaande avatars A/B kunnen omwisselen, zijn voor beide richtingen ook de bijbehorende canonieke stemopnamen nodig; de importer verzint geen ontbrekende tegenstem.

## Exacte CLI

Voer vanuit de repository uit. Gebruik bij import een recente lokale export waarin de geslaagde regels op GEGENEREERD staan.

```powershell
# Alleen lezen en suggesties rapporteren; geen bindingen activeren.
npm run audio:backlog -- inspect --workbook "output/audio-backlog/backlog-20261031.json" --report "output/audio-backlog/review-20261031.json"

# Ook rechtstreeks op een gedownloade XLSX-export:
npm run audio:backlog -- inspect --workbook "output/audio-backlog/backlog.xlsx" --report "output/audio-backlog/review.json"

# Vul balance en factor uitsluitend in na controle van het echte account/model.
# 35000 en 1 hieronder zijn voorbeelden uit de sheet, geen bevestigde balans/kosten.
npm run audio:backlog -- plan --workbook "output/audio-backlog/backlog.xlsx" --bindings "output/audio-backlog/bindings.json" --balance 35000 --credit-factor 1 --reserve 3500 --report "output/audio-backlog/plan.json"

# Pas na generatie door de manager, bestandcontrole en beluisteren:
npm run audio:backlog -- import --workbook "output/audio-backlog/backlog-generated.xlsx" --bindings "output/audio-backlog/bindings.json" --receipts "output/audio-backlog/receipts.json" --assets-root "output/audio-backlog/generated" --reviewer "Sven" --report "output/audio-backlog/import.json"
```

P3 staat standaard uit. Voeg `--include-p3` alleen na beoordeling toe. De planner rekent conservatief per clip `ceil(kana-tekens × creditfactor)`, bewaart minstens 3.500 credits (of de hogere sheetbuffer) en stopt bij het eerste niet-passende geselecteerde canonieke item; goedkopere P2/P3-items kunnen een geblokkeerd P1-item niet passeren. Herhaalde bindings naar hetzelfde canonieke ID en dezelfde stemrol kosten maar één opname. Actuele bestaande bestanden worden vooraf overgeslagen.

Dit is een **offline raming**, geen controle van actuele accountbalans of facturatie. De externe generator moet de echte balans tijdens de batch bewaken, en vóór de buffer stoppen. Import zelf verbruikt nul credits.

## Generatiebewijs

Een planrij met `action: pending` bevat de gecontroleerde kana-input, `entryId`, `voiceRole`, `readingId`, `generationHash`, `voiceFingerprint` en `settings`. De manager gebruikt precies die canonieke input en instellingen en levert na geslaagde generatie dit lokale bewijs:

```json
{
  "assets": [{
    "audioId": "w-0001",
    "entryId": "vocab-パン",
    "voiceRole": "A",
    "voiceFingerprint": "SHA256-waarde-uit-het-plan",
    "generationHash": "generatiehash-uit-het-plan",
    "sha256": "SHA256-van-de-werkelijke-MP3-bytes",
    "actualCredits": 2,
    "generatedAt": "2026-10-31T15:00:00Z"
  }]
}
```

`actualCredits` in dit voorbeeld is geen prijsbelofte. Het bewijs bevat geen API-sleutel of onbewerkte stem-ID. Gewijzigde tekst, reading, stem, model of instellingen maken de generatiehash ongeldig. De bron-MP3 moet minimaal 100 bytes groot zijn, een MP3/ID3-header hebben en overeenkomen met de opgegeven bestandshash. Er wordt geen codecvalidatie of luisterbeoordeling door een bestandsheader verondersteld: `--reviewer` is de expliciete bevestiging dat de manager de opnamen en bindings heeft gecontroleerd.

## Bestaande waarborgen

Alle nieuwe bestanden en bewijzen worden gecontroleerd vóór de eerste schrijfactie. Paden blijven binnen de opgegeven importmap en appmap, ook bij symlinks. De importer vervangt geen bestaande canonieke opname of afwijkend bestaand bestand. Een actuele bestaande opname wordt hergebruikt zonder opnieuw te kopiëren of het manifest te herschrijven.

Voor gewone import geldt de bestaande goedgekeurde audiokwaliteitstest voor de actuele stemmen en instellingen. Een geïmporteerd item uit de kwaliteitstest blijft `reviewed: false` en maakt de oude kwaliteitspoort ongeldig. Beluister de complete testset en gebruik daarna het bestaande `audio:pipeline approve --reviewer`-commando; een backlogimport kan die goedkeuring niet vervangen. Importeer ontbrekende kwaliteitstestitems zo nodig apart vóór de gewone opnamen.

Na een echte import controleert dezelfde CLI het bestaande audiomanifest en vernieuwt de clientversie. De huidige player gebruikt daarna de canonieke ID’s, readings, reviewed-status en veilige lokale paden. Productiecode laadt geen backlog-JSON en raadpleegt geen Drive-sheet of ElevenLabs.

De import schrijft geen localStorage, rang, mastery, woordintroducties of Recall-historie. Er zijn tijdens deze implementatie geen productie-MP3’s geïmporteerd of gegenereerd, geen accountbalans opgevraagd en geen betaalde API-verzoeken uitgevoerd.

## Verificatie

`node --test tests/audio-backlog.test.cjs tests/audio-pipeline.test.cjs tests/audio.test.cjs tests/audio-course.test.cjs`: 48/48 geslaagd. Dit controleert selectie/budget, canonieke mismatches, generatiebewijzen, bestaande bestanden, kwaliteitspoort, herhaalbaarheid, A/B-playerintegratie, offline uitvoering zonder credentiallogging en het lezen van een echte XLSX/ZIP-fixture. De echte productie-import en luisterbeoordeling volgen pas na goedkeuring en generatie door de manager.
