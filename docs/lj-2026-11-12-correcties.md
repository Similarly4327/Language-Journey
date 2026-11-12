# Correcties Recall, lestoets en weergave — 12 november 2026

- Recall: antwoordaudio zocht in de oorspronkelijke catalogus en sloeg kanjiopties over. De gedeelde audiokoppeling gebruikt nu het volledige, bekende woord en zijn centrale ID; bij dubbelzinnige lezingen zonder context wordt geen uitspraak gegokt. Bestaande audiobestanden en de bestaande afspeelknop blijven in gebruik.
- Getallen: numerieke antwoordopties vielen buiten de bestaande gecentreerde kaartstijl. Ze gebruiken nu dezelfde stijl als Japanse tekst. De echte Level 12-terminalvraag is op mobiel en desktop gecontroleerd.
- Lestoets: de weg na oefening B keerde alleen terug naar de les, terwijl de afzonderlijke knop de officiële toets startte. Beide ingangen gebruiken nu dezelfde lestoets met les-ID en bestaande scoregrens. De vervolgstap blijft verborgen als opslaan mislukt; dubbele resultaatverwerking is afgevangen. De oude gemelde felicitatie zonder rang kon in de huidige code niet letterlijk worden gereproduceerd.
- Medailles: de gedeelde rangweergave en Nederlandse Recall-teksten tonen Koper, Zilver, Goud en Platina; de opgeslagen Engelstalige enumwaarden blijven ongewijzigd.

Gewijzigde appbestanden: index.html en locales/nl.js. Ondersteunende controle: scripts/audio-course-coverage.cjs. Testbestanden: tests/app-probe.cjs, tests/audio-course.test.cjs, tests/kanji-exposure.test.cjs, tests/medal-labels.test.cjs, tests/thematic-lesson-completion.test.cjs en tests/thematic-numeric-alignment.test.cjs.

Verificatie: 324 tests geslaagd; contentvalidatie 0 fouten en 4 bestaande waarschuwingen; audiodekking 806/806 met uitspraakmetadata. De toets is met een geïsoleerd testprofiel op mobiel afgerond en de opgeslagen rang gecontroleerd na herladen. De automatische ingang, onvoldoende score, herhaling, dubbele verwerking en opslagfout zijn met gerichte tests gecontroleerd. Er is geen aparte buildstap in dit project; de versie van clientbestanden is opnieuw gegenereerd.
