# Audio Fundament V3 — implementatie en gebruik

7 oktober 2026. Status: fundament aangesloten in de app; echte Japanse opnamen nog niet gegenereerd. `ELEVENLABS_API_KEY`, `VOICE_A_ID` en `VOICE_B_ID` zijn niet ingesteld. Ontbrekende opnamen tonen geen speaker. Er is geen browser-TTS-fallback.

## Audit van de bestaande bron

| Onderdeel | Bestaande vorm | Audio-aansluiting |
| --- | --- | --- |
| Woorden | `manifest.vocabulary`: `id`, `japanese`, `reading`, `meaning`, `romaji`, `introducedAt`, `kanjiForm`; afgeleide `vocabCatalog`/`vocabById` | Dezelfde `vocab-*` ID; uitspraakmetadata op het originele woordobject en woordlinks uit de zichtbare modelanalyse, zonder ambigue homoniemen te raden. Geen nieuwe woordenlijst. |
| Voorbeelden | Lesmodellen met `sentence`, `meaning`, `parts`; verscheidene identieke Level 4 modellen | `manifest.sentences`, `model.sentenceId`. Identieke bestaande modellen delen een centrale zin. |
| Vragen | Gedeelde quizrenderer, gedeeltelijk centrale oefening-ID's, gedeeltelijk inline prompt/context/antwoord | Expliciete IDs waar beschikbaar; bestaande inline tekst alleen als alle canonieke matches dezelfde uitspraak hebben. Onbekende/ambigue tekst krijgt geen opname. |
| Dialoog | Eén bestaande begroeting in `manifest.dialogues.introduction` | `dialogue-introduction` → `sentence-introduction-greeting`, rol A. De service en tests ondersteunen opeenvolgende rollen A/B. Er is geen nieuwe cursusdialoog verzonnen. |
| Leesblokken | 54 centrale `manifest.readings` en 15 optionele `manifest.bonus`-teksten, `reading-*` ID, volledige tekst en begripsvragen | Eigen passage-opname, geen samengestelde woordclips. Eerste gecontroleerde uitspraak: `reading-l6-5`. |
| Dictionary/Kennis | Woorden uit de catalogus; aparte kana- en grammatica-ID's; enkele inline extra grammatica-artikelen | Dezelfde centrale woord-, kana- en grammatica-ID's. Kana-tegels openen de kana-entry; zij veranderen niet stil in een grammatica-artikel met een andere uitspraak. Oude `grammar-particle-*` artikel-ID's blijven aliases; `grammar-particle-he` verwijst naar de bestaande richtingregel `grammar-l12-1`. De oude artikel-/lesniveaus worden niet gewijzigd. |
| Recall | Cataloguswoorden en SRS per woord-ID/vertalingsrichting | Dezelfde opname als les/Dictionary. Geen nieuwe kaarten, gewijzigde eligibility of gewijzigde intervallen. |
| Gids | Geen aparte Japanse Gids-content aangetroffen; `phaseGuideHtml` bevat Nederlandse route-informatie | Geen Japanse uitspraak nodig voor deze Nederlandse navigatietekst. |

## Centrale uitspraakmetadata

`language-journey-content/audio-foundation.js` verrijkt de bestaande content vóór de browser- en Node-adapters worden gebruikt:

```js
pronunciation: {
  readingId: 'default',
  audioTextKana: 'わたし わ みず お のみます',
  status: 'specified' // of needs-review / context-only
}
```

De geschreven zin blijft `わたし は みず を のみます`. De kana-uitspraak van woorden komt uit het bestaande expliciete `reading`-veld. Level 4-zinnen gebruiken gecontroleerde metadata die exact aan de bestaande schrijftekst is gekoppeld. Andere modellen en passages worden niet automatisch geconverteerd. Zelfstandig は en へ behouden hun kana-klank; partikels gebruiken わ en え. を gebruikt de standaarduitspraak お. `っ`, `ッ` en `ー` krijgen geen misleidende geïsoleerde normale-kana-opname: die hebben uitspraakcontext nodig.

Zin-ID's benoemen een bestaand modelslot, bijvoorbeeld `sentence-l4-7-model-1`. Behoud deze IDs bij verdere redactionele migraties; voeg bij een nieuwe zin een nieuw slot/expliciete ID toe. Een gewijzigd model wordt door de batchhash ongeldig. Het wijzigen van de zichtbare kanji-weergave maakt geen tweede vocab-item.

## Interface en playback

`audio/playback.js` levert één component (`buttonHtml`/`updateButton`) en één afspeelservice. De bestaande `speakerButtonHtml` is de gedeelde app-adapter. Knoppen zijn semantische buttons met een tikvlak van 44 × 44, naam, loading/playing/error en een schermlezerstatus. Rechtsboven wordt ruimte gereserveerd zodat tekst niet achter de speaker verdwijnt.

- Kana vanaf Level 1, dakuten, samengestelde kana, leswoorden en gecontroleerde modellen zijn aangesloten. Ook het korte antwoordgeluid gebruikt dezelfde afspeelservice.
- Quiz/Oefenen/check/examen en de thematische vraagroute kiezen één Japans stimulusblok. Thematische lees- en bonusteksten zijn via hun passage-ID voorbereid, zonder ongecontroleerde audio te tonen. Bij antwoordaudio vervalt de andere speaker op die vraag.
- Recall JP→NL heeft vooraf één speaker; NL→JP pas na het antwoord. Na feedback is er één speaker voor het Japanse woord.
- Dictionary en Kennis gebruiken dezelfde opname. Kennis-speakers spelen direct en openen geen artikel.
- Een tweede tik stopt; een andere speaker stopt en vervangt de vorige opname. Navigatie stopt zonder stil een vraag/kaart verder te schuiven.
- Goede feedback wacht tijdens expliciet beluisteren tot de opname klaar is. Een passage wordt niet na vijf seconden afgeknipt.
- Audioinstellingen en de optionele bestaande avatar-overlay blijven behouden. Stemrollen A/B zijn onafhankelijk van Ren/Miku en profielinstellingen.

Dialogen gebruiken opeenvolgende **volledige regelopnamen**, met 220 ms pauze. Deze eenvoudige aanpak hergebruikt natuurlijke zinsopnamen, houdt stemmen vervangbaar en voorkomt overlap. Stoppen tijdens de pauze annuleert ook de volgende regel. De dialoog hergebruikt hetzelfde audio-element voor volgende regels; bronwissel op één element volgt het ontwerpprincipe uit [WebKits afspeeladvies](https://webkit.org/blog/7734/auto-play-policy-changes-for-macos/). Dit vervangt geen fysieke iPhone-test. Passages worden als volledige tekst gegenereerd.

## ElevenLabs-batchworkflow

Alle API-calls gebeuren uitsluitend in de lokale developer-CLI. Configuratie zonder secrets: `audio/config.json`; daadwerkelijke sleutel en stem-ID's: environment variables. De CLI gebruikt het officiële [Text to Speech convert-endpoint](https://elevenlabs.io/docs/api-reference/text-to-speech/convert). `eleven_multilingual_v2` ondersteunt volgens die documentatie geen `language_code`; daarom wordt uitsluitend expliciete kana gestuurd, zonder die parameter.

1. Stel `ELEVENLABS_API_KEY`, `VOICE_A_ID` en `VOICE_B_ID` veilig in de procesomgeving in. Zet ze niet in een repositorybestand of frontendscript.
2. Bekijk eerst de geplande testset:

   ```text
   npm run audio:batch -- --quality --dry-run
   ```

3. Genereer de kleine testset:

   ```text
   npm run audio:batch -- --quality
   ```

4. Beluister alle 14 opnamen in het manifest. Beoordeel verstaanbaarheid, mora-timing, klinkerlengte, kleine kana, zinsintonatie en Engels stresspatroon. De eerste set bevat onder andere お, こうえん, コーヒー, きゃ/きゅ/きょ, きって, ほん, じょせい, desu/masu-zinnen, de bestaande begroeting met beide stemmen en het kleine Level 6-leesblok. Testopnamen blijven tot goedkeuring onzichtbaar in de app.
5. Keur uitsluitend na werkelijk beluisteren goed:

   ```text
   npm run audio:batch -- --quality --approve-quality --reviewer "naam beoordelaar"
   ```

6. Sluit bijvoorbeeld de eerste les aan:

   ```text
   npm run audio:batch -- --lesson l4-1 --dry-run
   npm run audio:batch -- --lesson l4-1
   npm run assets:version
   npm run audio:audit -- --write
   ```

Selectie: `--ids vocab-ねこ,sentence-l4-1-model-1`, `--level 1`, `--range 1-5`, `--lesson l4-1` of `--quality`. Standaard worden ontbrekende/verouderde bestanden gegenereerd en actuele bestaande bestanden overgeslagen. `--missing` benoemt deze standaardmodus; `--regenerate` of `--force` forceert generatie voor de selectie. Er wordt niet automatisch alle content gegenereerd. Selectie van een individueel ID zonder geschikte uitspraak faalt; level-/lesselecties slaan dergelijke entries over en de audit noemt ze expliciet.

MP3's komen in `assets/audio/ja/{words,kana,grammar,sentences,passages}/`. `assets/audio/ja/manifest.js` koppelt entry-ID, reading-ID en stemrol aan het statische bestand. De hash omvat ID, schrijftekst, kana, stemfingerprint, model/instellingen en pipelineversie. De stem-ID zelf staat niet in het clientmanifest. Veranderde voices/uitspraak/configuratie maken de quality-gate opnieuw ongeldig. Een opnieuw gegenereerde quality-opname moet opnieuw worden beluisterd/goedgekeurd. Oude bestanden worden niet automatisch verwijderd: orphan-bestanden verschijnen in de audit.

De CLI schrijft ieder geslaagd bestand en manifest atomair; een fout verliest geen eerdere geslaagde jobs. Logregels bevatten content-ID's en HTTP-status, geen keys, stem-ID's, headers of providerresponsen.

## Controles en beperkingen

- `node --test`: 112 tests geslaagd, waaronder 13 nieuwe audiotests. Centrale IDs, partikels, onzekere lezingen, ontbrekende assets, SRS-behoud, beide richtingen, uitstel van antwoordaudio, afspelen/vervangen, annulering tijdens dialoogpauze, foutafhandeling, hashes, quality-gate en kana-only API-aanroepen gecontroleerd met fixtures/stubs.
- `npm run validate-content`: 0 fouten; 4 al bestaande curriculumwaarschuwingen en 1 compatibiliteitsmelding.
- `npm run audio:audit -- --write`: volledige dekking/ontbrekende metadata in [audit.json](audit.json), geen bestaande audiokoppelingsfouten of orphan-opnamen. Alle Japanse opnamen ontbreken momenteel daadwerkelijk.
- Echte browsercontrole in een geïsoleerde Edge-sessie op 320/375/390/1280 pixels: leswoorden, modelzin, Dictionary, beide Recall-richtingen en de gedeelde quiz zonder horizontale overflow; 44px-knoppen; stop/herstart/vervanging; eerste hiragana- en katakana-vragen gebruiken hun eigen kana-ID’s, ook na feedback. Recall NL→JP heeft vóór het antwoord geen speaker en daarna één; vrij oefenen schrijft geen SRS-kaarten. Kennis speelt direct zonder Dictionary te openen en deelt het artikel-ID. Mobiele screenshots in `output/playwright/audio-v3/` gebruiken expliciet mock-opnamen/playback; zij bewijzen layout, geen spraakkwaliteit.
- Geen live ElevenLabs-verzoek, menselijke uitspraakbeoordeling, fysieke iPhone/Safari-afspeeltest of Pages-deploy uitgevoerd. Een geslaagde browserfixture is geen bewijs van het iOS-audiogedrag van echte MP3's.
- 343 woorden hebben bestaande kana-readings. De audit houdt ongecontroleerde latere zinnen, leesblokken en grammatica afzonderlijk zichtbaar; ontbrekende uitspraak wordt niet gegokt. Er zijn 130 entries zonder gecontroleerde uitspraakmetadata en 529 afzonderlijke uitingen met metadata maar zonder opname. De drie contextafhankelijke tekens zijn afzonderlijk vermeld.

## Gewijzigde bestanden voor audio

`index.html`, `language-journey-content/content.js`, `language-journey-content/audio-foundation.js`, `audio/playback.js`, `audio/config.json`, `audio/quality-set.json`, `assets/audio/ja/manifest.js`, `scripts/audio-batch.cjs`, `scripts/audio-audit.cjs`, `package.json`, `tests/audio.test.cjs`, `tests/dictionary.test.cjs` en `tests/recall.test.cjs`. Dit document, de audit en browsercontroles zijn toegevoegd. Bestaande, nog niet gecommitte Recall-herstelwijzigingen zijn behouden. Geen gebruikersopslag gewist of gereset.
