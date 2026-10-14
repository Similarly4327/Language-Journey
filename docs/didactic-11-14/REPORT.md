# Didactische audit en herziening — Level 11–14

14 oktober 2026. Scope: de twintig kernlessen, lestoetsen en examens; centrale dialoogfunctie ook toegepast op passende voorbeelden in Level 9/10. Geen documenten uit eerdere opdrachten gewijzigd, geen betaalde audiogeneratie, geen commit of push.

## Bevindingen vóór de herstructurering

De volledige beginsituatie staat per les en module in [audit-before.json](audit-before.json), vastgelegd vóór de inhoudswijzigingen. De belangrijkste bevindingen zijn vooraf gemeld:

- Level 11 les 1–5 introduceerden elk tien woorden. Eén voorbeeld per module bereidde niet alle nieuwe woorden in zincontext voor.
- Les 1 combineerde nuttige app-termen met Nederlandstalige meta-vragen over antwoorden. Les 2 liet lees-/zoekwoorden te weinig functioneel toepassen. Les 3 gebruikte onder andere werkwoordsvormen zonder expliciete voorbereiding. Les 4 vroeg vooral naar de uitleg van volgorde in plaats van die volgorde te laten volgen. Les 5 voegde tien nieuwe woorden toe vlak vóór het examen, waaronder luchthavenwoorden die beter bij aankomst passen.
- Module B was inhoudelijk vaak een tweede tekst met meerkeuzevragen, zonder duidelijk andere praktische presentatie.
- Lestoetsvragen verloren de brontekst bij omzetting naar de gedeelde quiz. Daardoor waren contextvragen niet altijd zelfstandig beantwoordbaar.
- De gedeelde Level-10-quiz had al goed → korte pauze → automatisch verder en fout → rood/groen → handmatig verder. De losse A/B-vragen hadden nog altijd een vervolgknop.
- Bestaande echte vraag/antwoordvoorbeelden gebruikten nog geen centrale tweepersoonsdialoog met gekozen avatar als lead.

## Geïmplementeerde opbouw

Alle nieuwe kernwoorden van A én B worden vóór verhaal A voorbereid: woordblokken van maximaal drie items, bestaande woordtraining in twee richtingen, vervolgens één korte zincontext per nieuw woord. Daarna verhaal A, begrip, praktische bron B en toepassing. Les 5 integreert eerder geleerde stof. `preparedAt` legt expliciet vast dat de bron pas na de volledige woord-/zinsvoorbereiding verschijnt; dit verruimt nooit de kennisgrens tot een volgende les.

Iedere les houdt vier toepassingsvragen en ieder level twintig examenvragen, verdeeld over alle vijf lessen. De bestaande gedeelde quiz blijft de lestoets-/examencomponent. De Japanse brontekst blijft nu bij de vraag. De A/B-vragen gebruiken de bestaande keuzerenderer en dezelfde centrale feedbackklok van 1500 ms als Level 10; geen afzonderlijke timer per level. Onthullen, dubbel tikken en verdergaan schrijven geen tweede antwoord. Fout blijft handmatig.

## Resultaat per les

Alle onderstaande lessen: 100% van de nieuwe kernwoorden heeft een voorbereide zin; vier Japanse toepassingsvragen; Lestoets via de gedeelde quiz. De volledige woorden, grammatica, hergebruik, bronnen, instructiegates en woordclassificatie staan in [audit-after.json](audit-after.json).

| Les | Nieuwe kernwoorden | Na deze les kan de gebruiker… | Praktische bron B |
|---|---:|---|---|
| 11.1 | 10 | vraag, antwoord en goed/fout in de Japanse app herkennen | oefenscherm met ○/× |
| 11.2 | 10 | een leesinstructie volgen en een woord in een zin vinden | lespagina |
| 11.3 | 10 | luister-/invulinstructies volgen en een symbool aanwijzen | invulkaart |
| 11.4 | 10 | een korte instructievolgorde volgen en controleren | stappenplan |
| 11.5 | 3 | een vertrekplan met bekende dag, tijd en vervoerswoorden lezen | reisvoorbereidingsplan |
| 12.1 | 10 | aankomstterminal, uitgang en informatiepunt vinden | aankomstbord |
| 12.2 | 9 | paspoortcontrole en richting naar bagage herkennen | vloerbewegwijzering |
| 12.3 | 9 | bandnummer, kleur en grootte van bagage herkennen | bagagelabel |
| 12.4 | 8 | uitgang, ontmoetingsplek en vertrektijd vinden | ophaal-/vertrekbord |
| 12.5 | 1 | een aankomst van terminal tot ontmoetingsplek volgen | aankomstplan |
| 13.1 | 5 | een route en het juiste spoor herkennen | ticket |
| 13.2 | 5 | een enkele reis kiezen en aantal/prijs begrijpen | tarievenbord + loketdialoog |
| 13.3 | 8 | looproute, metro en eindhalte begrijpen | routekaart |
| 13.4 | 8 | vertrektijden, spoor en vertraging lezen | vertrekbord |
| 13.5 | 0 | een reis met trein, overstap en bus volgen | reiskaart + chauffeursdialoog |
| 14.1 | 9 | een reservering aangeven en incheckgegevens herkennen | registratieformulier + dialoog |
| 14.2 | 8 | kamer, verdieping en sleutelkaart herkennen | sleutelkaartinstructie |
| 14.3 | 9 | een handdoek lenen en voorzieningen/ontbijt vinden | hotelgids + dialoog |
| 14.4 | 8 | bagage in bewaring geven en openingstijden lezen | openingstijden + dialoog |
| 14.5 | 0 | kamer, ontbijt en voorzieningen combineren | hotelkaart + ontbijtdialoog |

Nieuwe grammatica blijft beperkt: 11.1 beleefde instructies herkennen; 12.1 richting へ; 13.1 begin/eindpunt から…まで; 13.2 getal + えん; 14.1 が あります. Afgeleide vormen zoals くろい, あかい, かります en みせてください worden expliciet voorbereid, zonder een volledig vervoegingsschema. Latere woorden zoals いろ staan niet ongemerkt in een vroegere vraag of distractor.

## Japanse UI en dialogen

De bestaande kennisgestuurde interface- en titelgates zijn behouden. `レベル`, `レッスン`, `しつもん`, `こたえ`, `ただしい`, `まちがい`, `もういちど`, lees-/luisterinstructies en `つぎ` verschijnen Japans zodra hun centrale woord-ID daadwerkelijk bekend is, ook binnen Level 11. Nieuwe grammatica blijft uitgelegd in het Nederlands. De expliciet gevraagde productterm blijft **Lestoets**.

Eén centrale dialoogregistratie, renderer en audio-rolmapping bedient Level 9.1, 9.5, 10.5 en natuurlijke interacties in 12.4, 13.2, 13.5, 14.1, 14.3, 14.4 en 14.5. Logische spreker A is steeds de gekozen avatar; B de andere avatar. Vrouwelijke lead → fysieke Voice A, mannelijke lead → fysieke Voice B. Beurtvolgorde blijft logisch A/B/A. Namen komen uit de bestaande profielhelper/defaults, niet uit vaste lesnamen. Losse woorden en borden krijgen geen geforceerde tweede stem.

## Opslag en compatibiliteit

- Opslagversie en bestaande stabiele woord-, les-, bron- en oefen-ID's blijven geldig. Er wordt geen lesrevision gezet die ranks ongeldig maakt.
- `thematicRevision`, `historicalIntroducedVocabIds` en `deferredVocabIntroductions` zijn additieve velden. Oude ranks bij verplaatste woorden behouden de verworven Recall-toegang. Nieuwe profielen krijgen daardoor geen toegang tot toekomstige woorden. SRS-records, due-tijden, richtingen, fouten en reviewtijden worden niet herschreven.
- “Japan” heeft het nieuwe ID `vocab-country-japan`. Het bestaande `vocab-にほん` blijft uitsluitend “twee lange voorwerpen”. Expliciete context voorkomt verwarring. Een oud luchthavenrank introduceert het nieuwe landwoord niet stilzwijgend: dit wacht op de echte woordintroductie. De validator staat alleen expliciet gekoppelde, inhoudelijk verschillende homografen toe.
- Oude onafgemaakte vragen met vervangen teksten keren veilig terug naar de les; afgeronde onderdelen, scores en ranks worden niet gewist. De nieuwe voorbereidingspositie kan worden opgeslagen/herladen.

## Audio: voorbereid, niet opnieuw gegenereerd

[audio-regeneration.json](audio-regeneration.json) is een read-only plan van de bestaande Audio Fundament v3-pipeline: **185 actuele, 40 verouderde en 303 ontbrekende clipvarianten**, geen ontbrekende lokale bestanden en geen ongespecificeerde lezingen in deze selectie. De selectie omvat de gewijzigde levels, nieuwe vraagzinnen en dialoogregels uit Fase 1. Beide fysieke stemmen staan klaar voor elke dialoogregel, zodat beide avatarselecties werken.

Verouderde audio wordt niet bij een nieuwe tekst afgespeeld. Een dialoog met ontbrekende stemclips toont “Audio wordt voorbereid” en valt niet terug op één stem of runtime-TTS. Er zijn nul betaalde aanvragen uitgevoerd. De dialogen zijn dus technisch en inhoudelijk aangesloten; alle nieuwe gesprekken hoorbaar maken vereist nog generatie en controle van de geplande downloads.

## Controles en reproduceerbaarheid

- `node --test`: **175 geslaagd, 0 mislukt**. Inclusief Level 1–10-regressies, woorddekking, gedeelde quiz, beide Recall-richtingen, SRS, opslagmigratie, eindvraag, foutfeedback, dubbele beantwoording en timerannulering.
- `node language-journey-content/validate.cjs`: **0 fouten**. De vier bestaande waarschuwingen betreffen de oude optionele-audioregistratie en drie al bestaande ongebruikte datumwoorden; de actuele audioclipstatus staat in het afzonderlijke plan.
- `node scripts/thematic-didactic-audit.cjs`: geen toekomstige of onvoorbereide vormen gevonden in de herziene verhalen, vragen en antwoordopties; geen ontbrekende zinsvoorbereiding.
- `node scripts/thematic-audio-plan.cjs`: plan maken zonder netwerk of credentials.
- Mobiele browser: alle twintig lessen door woordblokken, zinsvoorbereiding en A/B-presentatie bekeken; feitelijke klikflow getest voor onthullen, goed automatisch, fout handmatig, laatste goed automatisch en verlaten tijdens de timer. Breedtes 390 en 320 px, zonder horizontale overflow. Zie `scripts/thematic-mobile-qa.js`, `output/playwright/didactic-results.json` en de drie `didactic-*.png`-screenshots.
- Geen PWA-/offline-cachemechanisme toegevoegd of gewijzigd; audio blijft uitsluitend via bestaande lokale/static downloads werken. Client-scriptversies zijn centraal vernieuwd.

Belangrijkste aangepaste productieonderdelen: `index.html`, `language-journey-content/thematic-didactics.js`, `content.js`, `audio-foundation.js`, `validate.cjs`, `audio/playback.js` en `scripts/audio-batch.cjs`. Tests, audit- en previewhulpmiddelen staan afzonderlijk naast de app.

## Taalbronnen en grenzen

De korte nieuwe combinaties zijn voor deze cursus geformuleerd met het bestaande vocabulaire, niet overgenomen als volledige brontekst. Grammatica en praktische situaties zijn gecontroleerd aan [Japan Foundation IRODORI Grammar](https://www.irodori.jpf.go.jp/assets/data/Grammar_all.pdf), [Starter les 7](https://www.irodori.jpf.go.jp/assets/data/starter/pdf/X_L07.pdf) en [Starter les 13](https://www.irodori.jpf.go.jp/assets/data/starter/pdf/X_L13.pdf). Geen onbehandelde beleefdheidsvormen uit gevorderde hotelgesprekken toegevoegd. Het einddoel is eenvoudige herkenning en functionele toepassing, geen vrije conversatie of vloeiendheid.
