# ElevenLabs modelonderzoek — 9 november 2026

**Uitgevoerd na gebruikerskeuze:** de gebruiker koos v4 op basis van de aangeboden luisterproef en vroeg daarna expliciet de volledige bibliotheek te herzien. Alle 2.894 productieopnamen zijn opnieuw gegenereerd met `eleven_v4`, expliciet Japans en beide bestaande stemmen. De productie-audit meldt nul fouten, ontbrekende lezingen of ontbrekende opnamen. Alle MP3-headers zijn gecontroleerd. Alleen de modelvoorkeur is door de gebruiker beoordeeld; niet iedere clip is afzonderlijk beluisterd. De bestaande oude bestanden zijn behouden en worden niet meer door het productiemanifest gebruikt.


## Waarom de app v2 gebruikte

`audio/config.json` bevat sinds commit `28f4aee` (7 oktober 2026) de vaste standaard `eleven_multilingual_v2`. De generatiecode in `scripts/audio-batch.cjs` neemt die waarde rechtstreeks over en gebruikt de Text to Speech API. De muziekbatch van 8 november heeft deze bestaande instelling hergebruikt. In de onderzochte configuratiegeschiedenis en pipelinehandleiding is geen v2/v4-vergelijking of afwijzing van v4 vastgelegd. De oorspronkelijke motivatie kan daardoor niet met zekerheid worden gereconstrueerd; een aangetoonde kosten-, stemcompatibiliteits- of kwaliteitsbeperking was het niet.

De huidige instelling heeft stability 0.65, similarity boost 0.75, style 0 en speaker boost aan. Multilingual v2 accepteert geen expliciete `language_code`; korte kana-opnamen gebruiken daardoor automatische taalherkenning. Tien items hebben inmiddels een Turbo v2.5-uitzondering met expliciet Japans. Januari (`vocab-いちがつ`) hoort daarbij; februari (`vocab-にがつ`) niet. Een uitspraakprobleem met januari bewijst dus niet op zichzelf een Multilingual-v2-probleem. De exacte hoorbare foutoorzaak is nog niet vastgesteld.

## Gecontroleerde beschikbaarheid

Op 9 november antwoordde de account-API succesvol op `/v1/models` en de beide gebruikte voice-endpoints. Zowel Sakura (rol A) als Ishibashi (rol B) heeft fine-tuning en een Japanse verificatie voor `eleven_v4` en `eleven_v4_turbo`. Het modeloverzicht meldt Japans en TTS voor beide modellen. Een echte v4-generatie met Sakura is daarna geslaagd (HTTP 200). Voor Ishibashi en v4 Turbo zijn alleen metadata gecontroleerd; geen productiecompatibiliteit geclaimd.

De officiële documentatie plaatst v4 op `/v1/text-to-dialogue`, met `inputs: [{text, voice_id}]`; v4 Turbo is beschreven via de Dialogue WebSocket. Alleen het modelnummer in onze huidige request wijzigen is daarom geen zorgvuldig uitgevoerde overstap.

Bronnen: [modellen](https://elevenlabs.io/docs/overview/models), [Create dialogue](https://elevenlabs.io/docs/api-reference/text-to-dialogue/convert).

## Kleine reproduceerbare proef

`node scripts/audio-model-comparison.cjs --generate` heeft acht clips gemaakt, buiten productie en zonder enige trimming, fade of herencoding. Herhalen slaat bestaande geslaagde verzoeken over. Vier identieke teksten, één stem (Sakura), output MP3 44.1 kHz/128 kbit:

| Tekst | v2 gerapporteerde credits | v4 gerapporteerde credits |
| --- | ---: | ---: |
| いちがつ | 2 | 2 |
| にがつ | 1 | 1 |
| ねこ | 1 | 1 |
| こたえ お えらびます。 (bestaande level-11-uitspraaktekst) | 5 | 5 |
| Totaal | 9 | 9 |

Credits zijn de daadwerkelijke `character-cost` responseheaders van deze proef, geen universele prijsgarantie. Account-/abonnementsverbruik uitlezen gaf HTTP 401 met de huidige API-sleutel; de sleutel is hiervoor niet uitgebreid.

v2 gebruikt de bestaande productie-instellingen en seed 1149; v4 gebruikt zijn ondersteunde Dialogue-invoer, expliciete taal `ja`, normalisatie `off`, seed 1149 en de standaard Dialogue-steminstellingen. Hetzelfde seednummer maakt twee verschillende modellen niet deterministisch gelijk. De v2-referentie voor januari gebruikt bewust de globale v2-standaard; de huidige app-opname gebruikt de genoemde Turbo-uitzondering en is een afzonderlijke referentie.

Resultaten: `output/audio-model-comparison-2026-11-09/report.json` en luisterpagina `index.html` in dezelfde map. Bij deze eerste proef was de volledige bibliotheek nog niet opnieuw gegenereerd. De gebruiker koos daarna v4; er is geen afzonderlijke menselijke kwaliteitsbeoordeling per bibliotheekclip vastgelegd. Subjectieve uitspraak, intonatie en eventuele extra aanzet zijn dus nog open en mogen niet uit HTTP 200, bestandsgrootte of modelnummer worden afgeleid.

## Besluit tot nu toe

Het aanhouden van v2 was een overgenomen standaard, zonder vastgelegde recente vergelijking met v4. Nieuwe v4-proefgeneratie is technisch mogelijk met onze huidige hoofdspreker en kostte voor deze set evenveel credits. Daarna koos de gebruiker v4 en gaf expliciet opdracht de gehele bibliotheek opnieuw te genereren. De modelbewuste adapter en een aan configuratie/stemmen gebonden overgangsautorisatie zijn geïmplementeerd. Die bewaart het onderscheid tussen een goedgekeurde modelproef en individuele beluistering.
