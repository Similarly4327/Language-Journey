# Uitspraakcorrecties — 10 oktober 2026

Bron: [Uitspraakfouten & correctielog](https://docs.google.com/spreadsheets/d/1EreIhTkk6WhTeJKjAAkS3MPQFRVgs_gSsO9uPi5Hqss/edit), tab Uitspraakfouten, rijen 2–6.

Definitieve goedkeuring op 10 oktober 2026: de gebruiker heeft de actuele set als beste versie gekozen en gevraagd deze te implementeren. Alle vijf opnamen van Miku en alle vijf van Ren zijn goedgekeurd; spreadsheet en lokaal log staan op Gecontroleerd. De bestaande appkoppelingen naar de vijf actuele Miku-woordopnamen zijn geverifieerd. Ren blijft als afzonderlijke stemrol in hetzelfde manifest beschikbaar. Er zijn bij deze goedkeuring geen nieuwe opnamen gegenereerd. De onderstaande luisterstappen beschrijven de eerdere correctierondes.

De vijf meldingen betreffen ここ, ちかく, はは, ちち en かいます. De bestaande kana-uitspraak was correct; de gemelde extra beginklanken en het lachgeluid waren niet aanwezig in de brontekst. Voor deze vijf woord-ID’s gebruikt de pipeline nu Turbo v2.5 met language_code ja en Japanse tekstnormalisatie, dezelfde instellingen als de eerder goedgekeurde koffie-opname. De labels, betekenissen, les-ID’s en voortgang blijven gelijk. De nieuwe opnamen zijn gekoppeld in het bestaande manifest; eerdere bestanden blijven beschikbaar voor vergelijking.

De gebruiker heeft de nieuwe Miku-opnamen van ここ, ちかく, ちち en かいます goedgekeurd. Deze vier bestanden zijn behouden. De eerste vervanging van はは werd afgekeurd omdat deze nog meer als lachen klonk. Een nieuwe proef gebruikt apart meegestuurde Japanse familiecontext en stability 0,9; alleen はは staat in de uit te spreken tekst. De afgekeurde opname blijft beschikbaar voor vergelijking. Deze nieuwe proef moet nog worden beluisterd.

Ren (karakter 2, stemrol B) heeft nu ook alle vijf woorden ingesproken. De spreadsheet bewaart de oorspronkelijke meldingen en bevat aparte bestandspaden, generatiehashes en statussen voor Miku en Ren. De vier goedgekeurde Miku-opnamen staan op Gecontroleerd; はは en alle Ren-opnamen staan op Aangepast, met luistercontrole nog open. Alleen een nieuwe foutmelding geeft aanleiding tot een nieuwe generatie.

Het JSON-log naast dit document bewaart zowel de oude als de nieuwe assetmetadata. Een herhaalde selectie zonder force wordt volledig overgeslagen:

```powershell
node --use-system-ca scripts/audio-pipeline.cjs plan --ids vocab-ここ,vocab-ちかく,vocab-はは,vocab-ちち,vocab-かいます --voice-role both
```

De 18 eerder goedgekeurde cursusproeven blijven geldig voor het standaard audioprofiel. Later toegevoegde avatarproeven blokkeren de woordcorrecties niet; de avataropnamen vereisen nog hun eigen actuele testset. De batch controleert daarbij nog steeds de oorspronkelijke handtekening, bestanden, stem en individuele goedkeuring.

Vergelijk oud en nieuw op /output/audio-corrections-2026-10-10.html. Elk woord heeft de vorige Miku-opname, de actuele Miku-opname en Ren. Kies een karakter en gebruik Luister naar alle vijf om die vijf clips achter elkaar af te spelen. De afspeelservice bewaart zowel playbackRate als defaultPlaybackRate, zodat 0,75× behouden blijft wanneer de browser een volgende MP3 laadt.

Verificatie: beide stemrollen hebben vijf geldige MP3’s, geen manifestfouten, andere recordings exact ongewijzigd, 40 gerichte tests geslaagd. Beide playlists speelden vijf clips achter elkaar in de browser met 0,75× en zonder afspeelfout. De mobiele pagina heeft 15 audioknoppen en geen horizontale overflow. Spreadsheetstatussen, bestandspaden en hashes zijn teruggelezen en gecontroleerd. De uitspraakkwaliteit wordt niet als beluisterd aangemerkt door deze technische controles.

API-referentie: [ElevenLabs Create speech](https://elevenlabs.io/docs/api-reference/text-to-speech/convert).
