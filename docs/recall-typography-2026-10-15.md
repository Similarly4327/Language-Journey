# Recall-typografie — 15 oktober 2026

De gedeelde `.jp-word`-stijl forceerde Japanse woorden op één regel en zette horizontaal scrollen aan. Lange Japanse woorden konden daardoor buiten beeld vallen. De stijl breekt nu binnen de kaart af. Recall gebruikt voor de vraag een kleinere responsieve maat: Nederlands 22–28 px en Japans 30–40 px. Antwoordopties gebruiken 17–19 px, met Nederlandse woordafbreking. De kaartinhoud vult de beschikbare breedte; de bestaande aparte ruimte voor een speaker blijft behouden.

De wijziging aan `.jp-word` werkt ook door in lessen, thematische oefeningen, toetsen, crash course en Dictionary, omdat die gedeelde helper daar dezelfde klasse rendert. Alleen lange woorden kunnen daar nu binnen de beschikbare breedte afbreken. Vraagkoppen, zinnen en de stijlen voor crash course blijven ongemoeid.

De browsercontrole staat in `scripts/recall-typography-ui.js`. Chromium met touch-emulatie controleerde op 320 px en 375 px en desktop op 1440 px beide Recall-richtingen, korte en lange Japanse en Nederlandse woorden, antwoordblur, onthulde antwoorden, eigen answer-audio, audio bij de Japanse vraag en lange tekst in de feedback. Alle 27 metingen slaagden: geen horizontale documentoverloop, afgekapt woord of overlap met audio. De screenshots en meetresultaten staan onder `output/playwright/recall-typography/`. Echte iOS Safari is niet getest.

`npm test` draaide 175 tests: 167 slaagden en 8 faalden. De fouten gaan over niet-bestaande audioreadings en ontbrekende metadata in de gelijktijdig gewijzigde Level 11-integratie (`language-journey-content/content.js`, `language-journey-content/level11-integration.js`), plus een versiehash die door die gewijzigde content niet meer overeenkomt. Deze wijzigingen staan buiten deze typografiewijziging.
