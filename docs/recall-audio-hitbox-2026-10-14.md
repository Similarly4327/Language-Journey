# Recall: antwoordklik onderschept door speaker — 14 oktober 2026

## Root cause

De gedeelde `.answer-option-row > .audio-speaker` gebruikt `position: static`. Recall vergroot daarnaast de tikruimte met `#flashcardView .audio-speaker::after { position: absolute; inset: -6px; }`.

Zonder een gepositioneerde speaker werd dit pseudo-element aan de omliggende kaart verankerd. De hitbox van de laatst gerenderde speaker lag over het antwoordgebied. De centrale audio-capturehandler ontving daardoor een echte speakerklik en stopte terecht de verdere eventafhandeling; de antwoordhandler werd niet bereikt. Dit was geen verkeerde array-index of closure in de audiobinding.

Reproductie vóór de fix, via `document.elementFromPoint` en een echte muisklik: midden op antwoord `ねこ` werd `vocab-パン` geraakt, de laatste optie. De playbackservice speelde de bijbehorende fixture af; `feedback` bleef `null` en er kwam geen SRS-beoordeling.

## Gerichte fix

In `index.html` heeft de Recall-speaker nu `position: relative`, zodat de bestaande 6 px extra tikruimte aan die individuele knop vastzit. De speaker bij de Japanse vraag blijft expliciet `position: absolute` op zijn bestaande plek rechtsboven.

Geen wijzigingen aan eventhandlers, antwoordregistratie, Recall/SRS-engine, feedbacktimers, content/audio-ID's, manifest, playbackservice of audiobestanden. De antwoord- en speakerbuttons blijven afzonderlijke siblingbuttons. De werkmap bevat ook wijzigingen uit andere taken; die horen niet bij deze bugfix.

## Regressietest en resultaten

`scripts/recall-audio-hitbox-ui.js` is de herhaalbare Playwright-interactietest. Open een lokale preview met playwright-cli en voer uit:

```text
playwright-cli -s=recall-hitbox run-code --filename=scripts/recall-audio-hitbox-ui.js
```

De test gebruikt nieuwe, geïsoleerde browsercontexten en uitsluitend fixture-opslag. Hij raakt geen persoonlijk browserprofiel of voortgang.

- 40 geslaagde scenario's op desktop en mobiele touch: alle vier antwoorden via tekst, binnenrand en witruimte; dubbele klikken; vier afzonderlijke speakers met eigen stabiele ID en asset; audio gevolgd door een ander antwoord; toetsenbordfocus, Enter en Spatie; omgekeerde vertaalrichting; overslaan, pauzeren en hervatten.
- Per device een gemengde geplande sessie volledig afgerond: zes beoordelingen, waarvan vier goed en twee fout, inclusief de bestaande herhalingen. Iedere daadwerkelijke antwoordkeuze wijzigde exact één SRS-key één keer. Luisteracties wijzigden SRS of de sessietellers niet.
- Per device een gemengde Vrij Oefenen-sessie volledig afgerond: vier antwoorden, waaronder twee fout; geen SRS-wijzigingen.
- Ontbrekende audio en gesimuleerde playbackfouten: antwoorden blijven selecteerbaar en de sessie bereikt het eindscherm.
- Bestaande automatische overgang na goed antwoord en de handmatige volgende-knop na fout antwoord gebruikt; geen testworkaround die direct de Recall-engine laat doorgaan.
- Geen JavaScript-fouten. 80 bestaande Recall/audio-tests geslaagd.

Bewijs: `output/playwright/recall-audio-hitbox/baseline.json`, `results.json` en de mobiele/desktop-screenshots.

De browsercontrole gebruikte Chromium met mobiele touch-emulatie en gesimuleerde audio via de bestaande playbackservice. Echte iOS Safari en hoorbare afspeelkwaliteit van fysieke opnames zijn niet opnieuw geverifieerd.
