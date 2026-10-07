# Herstel Recall na Remake — 7 oktober 2026

## Reproductie en diagnose

De persoonlijke iPhone/Safari-opslag is niet beschikbaar. De tests gebruiken vooraf bewaarde representatieve JSON-fixtures in `tests/fixtures/recall-recovery`, plus echte oudere code uit commits 3d51699 en 7859083.

Gereproduceerd vóór herstel:

1. Nieuwe Recall-HTML met oude locale/curriculum-assets: interne keys zoals flashcards.mixedHelp, flashcards.poolWords en flashcards.freeTitle, en nul woorden ondanks Copper op l4-1. De september-locale-URL bleef gelijk en content.js had geen versie. De oude catalogus mist recallCore/sourceFound, waardoor de centrale gate terecht geen oncontroleerbare entry toeliet maar de UI een onjuiste nul-uitleg gaf.
2. Een string als opslagversie (`"8"`) werd niet als een ondersteunde versie ingelezen. De parser viel terug op een lege state.
3. Copper op de voormalige tweede maandenles (`l8-months-2`) bleef opgeslagen, maar de betreffende woorden werden na samenvoegen aan l8-4 gekoppeld en verborgen.
4. Het historische winkelexamen l11-exam werd wel naar l15-exam gekopieerd, maar kon ook nieuwe Level 11-woorden vrijgeven. Dit is nu gescheiden; het oorspronkelijke resultaat blijft in curriculumHistory en de backup bewaard.

Onderscheid na herstel:

- Geen Copper-bron: Recall blijft nul; bekeken woorden zijn geen alternatief.
- Copper bestaat: bronles, level-examen, erkende historische bronles en migratie worden gevolgd. Onbekende bronnen geven een expliciete koppelingsmelding, zonder willekeurig woorden vrij te geven.
- Oude SRS-kaarten zonder Copper: blijven intern bewaard, tellen nog niet mee, en worden weer zichtbaar zodra de juiste bron Copper krijgt.

## Codewijzigingen

- index.html: samen versieerde assets; veilige snapshot vóór migratie; conservatieve normalisatie van versie, ranknaam en IDs; behoud van onbekende rankrecords; bescherming tegen overschrijven bij onleesbare/onbekende opslag.
- flashcardEligible blijft de centrale Copper-gate. Historische bronlessen gelden alleen voor hun exacte geregistreerde woord-IDs, zodat een oude deel-les niet de hele nieuwe les vrijgeeft.
- recallAvailabilityReason onderscheidt nieuwe gebruiker, eerdere voortgang, geblokkeerde reviews, oude assets, opslagfout en bronfout.
- Recall-hoofdscherm verklaart pool / aan de beurt / nieuw / later gepland. Het i-icoon opent drie korte uitlegblokken over Auto, Vrij oefenen en twee richtingen/SRS, plus de relevante nulreden. Het icoon blijft in de rechterbovenhoek.
- Download voortgangsbackup exporteert de actuele en oorspronkelijke lokale JSON zonder de voortgang te wijzigen.
- locales/nl.js, en.js en de.js bevatten alle nieuwe uitleg en nulmeldingen. De bestaande Nederlandse fallback wordt getest.
- scripts/version-client-assets.cjs berekent één inhoudsafhankelijke revisie voor JS/CSS. Run dit script na assetwijzigingen. Een regressietest faalt wanneer inhoud en versie-URL uit elkaar lopen; hierdoor kan een volgende deploy deze versie-update niet ongemerkt vergeten.
- tests/recall.test.cjs, tests/content.test.cjs en opslagfixtures dekken herstel, migratie, fallback en behoud van data.

Geen SRS-reset, geen woordintroductie als vrijgavebewijs, geen blacklist, geen wijziging aan de normale SRS-intervallen.

## Uitgevoerde controles

- Volledige Node-testset: 99 tests.
- Browserreproductie oude assets: 0 woorden + letterlijke keys vóór herstel; na normale reload 5 vrijgespeelde woorden, 9 nieuwe kaarten en 1 later geplande kaart. De bestaande dueAt, repetitions, intervalDays en lapses blijven gelijk.
- 18 mobiele browsergevallen: Nederlands, Engels, Duits × 320/375/390 px × met/zonder Copper; normale reload, geen letterlijke keys, geen horizontale overloop, i-uitleg opent/sluit, SRS blijft behouden.
- Bronles Copper, examen Copper, stringversie, retired month source, historische winkel-examenroute, bekende woorden zonder Copper, latere Copper-vrijgave, nul voortgang, Auto aan/uit, oude reviews in beide richtingen en onbekend opslagformaat.
- Backupdownload gecontroleerd op behoud van de lokale JSON.
- Voor/na-beelden en taalvarianten staan in output/playwright/recall-recovery.

## Nog op het echte toestel te controleren

Niet gepubliceerd. Browsercontrole is uitgevoerd in Edge/Chromium met een geïsoleerd testprofiel. Een bestaande Safari-sessie op de fysieke iPhone is niet toegankelijk vanuit deze Windows-omgeving.

Na een geslaagde deployment: normale Safari-herlaadbeurt; controleren dat nieuwe asset-URLs worden geladen, geen keys zichtbaar zijn, de pool overeenkomt met de Copper-bronnen, beide richtingen dezelfde eerdere planning behouden en i-uitleg/backupdownload werken. Websitegegevens hoeven niet gewist te worden. Voor de exacte gebruikersdiagnose is de persoonlijke voortgangsbackup nog nodig.

Definitieve volledige testrun: **99/99 geslaagd**, 0 mislukt. git diff --check: geen fouten.
