# Controle vraagopmaak — 7 oktober 2026

## Oorzaak en herstel

De gedeelde .prompt-stijl gebruikte de Japanse displaymaat (52 px op mobiel) ook voor Nederlandse meerkeuzevragen. Gemengde Nederlandse context met enkele Japanse tekens kreeg bovendien de Japanse contextmaat van 27 px. De onthulknop vulde het hele verborgen antwoordvlak.

De gedeelde renderer bepaalt nu afzonderlijk de tekstrol van vraag en context. Nederlands gebruikt 18–20 px, Japans 26–32 px; introducties zijn compact. Alleen herkenbare gegenereerde lesdoel-instructies zijn ingekort tot het bijbehorende patroon. Geschreven situaties en noodzakelijke instructies blijven staan. De onthulknop is een gewone knop van ongeveer 49 px hoog. De bovenbalk schuift op vraag- en woordoefenschermen mee met de pagina.

De bronvragen, correcte antwoorden, decoys, leerdoelen, feedback en opslaglogica zijn niet aangepast.

## Uitgevoerde controles

- node --test: 80 geslaagd, 0 mislukt.
- Werkelijke browserrendering op 320, 375, 390 en 1280 CSS-pixels: Level 4-bank, Level 6/8/9-lesbanken, snelle checks en examenbanken. Alle gegenereerde vragen voor en na onthullen gecontroleerd op begrensde lettergrootte en horizontale overloop. Varianten: mc, meaning, fill, order, build en reading.
- Aparte woordoefeningen van levels 4, 6, 8 en 9: Nederlandse en Japanse stimuli, compacte onthulling, bovenbalk en overloop op dezelfde breedtes.
- Visuele controle van de exacte Level 9-vraag, Level 4-zinnenbouwer, Japanse leeszin met Nederlandse vraag en Level 9-woordoefening op 375 px. Voortgang staat onder de bovenbalk; antwoorden beginnen bij de quizvoorbeelden rond 260–322 px vanaf de schermbovenkant.
- Voor/na-beelden van de exacte Level 9-vraag op 320, 375 en 390 px, zowel met verborgen als met getoonde antwoorden, staan in deze map.

## Grenzen

Gecontroleerd in Edge/Chromium met mobiele viewports en een afzonderlijk testprofiel. Geen fysieke iPhone/Safari-controle. Niet gepubliceerd; geen Pages-deploy of publieke URL gecontroleerd.
