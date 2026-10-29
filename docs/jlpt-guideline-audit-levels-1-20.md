# JLPT-richtlijn en dekkingsaudit Levels 1–20

Uitgevoerd: 29 oktober 2026. Opdracht: Drive-document van 28 oktober, inclusief de aanvulling van 10:03. Bron: de huidige repo, niet eerdere planningen. Dit rapport beschrijft curriculumdekking; het meet geen fictieve gebruiker.

## 1. Executive summary

- De repo bevat **15 speelbare levels, 67 lessen, 326 huidige leswoorden, 15 historische woord-IDs en 3 previewwoorden**. Levels 16–20 bestaan alleen als faseplanning/placeholders.
- Level 1–10 introduceert 156 leswoorden. Level 11–15 voegt 170 toe. Kana is stevig uitgewerkt; 163 kana-/extensie-eenheden worden centraal geregistreerd. De 15 `manifest.kanji`-items zijn getalsymbolen, geen bewijs van volledige kanji- of woordlezingen.
- Les → Dictionary → Recall gebruikt dezelfde `vocab-*` IDs. Recall is vocabulaire-first, met twee afzonderlijke schema's per woord en één gemengde sessie. Geen reguliere, zelfstandig geplande volledige zinnen gevonden. Vier verzoekchunks (`よんでください`, `きいてください`, `うめてください`, `かいてください`) zijn lexicale bouwstenen, geen vrij gegenereerde zinnen.
- **Exposure en Recall-beschikbaarheid zijn nu verschillend:** een werkelijk geïntroduceerd woord kan in Kennis staan, maar de Recall-gate verlangt een les-/examenrank of expliciet historische introductie. In de geïsoleerde audit: 0/326 na uitsluitend introductie; 326/326 na de bestaande toetsvoorwaarde. Dit is een productregelverschil, geen verloren SRS-data.
- Pure woordrondes van Level 4–10 voldoen aan exact 2N, één beurt per richting. Level 3 heeft klankdoelen, geen nieuwe lexicale woorden. Exams 3–10 blijven binnen 25–40 vragen en dekken hun structurele leerdoelen.
- **Er ontbreekt werkelijk taalinhoud**, niet uitsluitend betere toetsing. Onder meer brede basiswoordenschat, systematische vervoeging/adjectiefvormen, kanji als woordrepresentatie en zelfstandig luisterbegrip zijn niet robuust afgedekt. Daarnaast bestaan assessment- en metadatagaten.
- Een versieerbare **voorlopige** benchmark is toegevoegd: 660 vocabulairekandidaten, 80 grammaticavormen, 80 kanji en 7 lees-/luistercompetenties. Drie onafhankelijke uitgevers zijn vergeleken, maar de volledige derde itemlijst kon niet worden opgehaald. Bronpaginering moet eveneens worden gereconcilieerd. Dit is nadrukkelijk nog geen goedgekeurde volledige N5-noemer.
- Daarom toont Voortgang nu een compacte, eerlijke fundering: N5 **In opbouw**, N4/N3 **Nog niet in kaart**, één info-uitleg en optionele gekoppelde woordkennis. Geen verzonnen totaalpercentages.

## 2. Relevante architectuur

| Onderdeel | Werkelijke bron / gedrag |
|---|---|
| Curriculum | `language-journey-content/content.js`, met bestaande uitbreidingen `thematic-didactics.js`, `level11-integration.js`, `level9-exam.js`, `grammar-reference.js` |
| Canonieke woorden | `manifest.vocabulary` → `vocabCatalog` / `vocabById`; lessen verwijzen met `wordIds` / `exampleIds` |
| Exposure | `introducedVocabIds`, `vocabFirstSeen`, bestaande compatibele lesrank; migratiedeferrals worden gerespecteerd |
| Dictionary | `dictionaryById`, `knowledgeWordIsKnown`; toekomstige woorden zijn previews. Zoeken of een artikel openen introduceert niets |
| Grammatica | 41 bronrecords, inclusief hergebruik en aliases; 34 zichtbare, functionele artikelen. `knowledgeGrammarIsKnown` geeft exposure, geen bewezen functionele mastery |
| Recall | `flashcardProgress.cards['vocab-ID::jp-nl'/'nl-jp']`; `repetitions`, `intervalDays`, `dueAt`, `lastReviewedAt`, `lastGrade`, `lapses` |
| Recall-selectie | Geplande gemengde Recall volgt de bestaande beschikbaarheid. Handmatige lesselectie hoort in de huidige app bij Vrij oefenen |
| Vrij oefenen | Wijzigt de SRS-planning niet; deze implementatie wijzigt dat gedrag evenmin |
| Andere mastery | `itemMastery` (kana) en `vocabMastery` (vraagresultaten); woordenrank is geen vervanging voor actuele directionele Recall |
| Toetsevidence | Vraagmetadata bevat doelen/IDs; opslag bewaart vooral kana-/vocabresultaten, fouten en geaggregeerde les-/examenranks. Geen betrouwbare per-grammaticafunctie-/lees-/luisterhistorie |
| Opslag | Bestaande lokale opslag onder `taal-japanse-leerapp-v1`; geen account/cloud-aanname |

De machineleesbare inventaris staat in `docs/jlpt/inventory.json`. Die wordt uit dezelfde brondata en de echte appgenerators gemaakt met `npm run jlpt:audit`. Het is een gegenereerd auditresultaat, geen tweede te onderhouden curriculumdatabase.

## 3. Benchmarkmethode en bronnen

### Normatief kader

De [officiële niveaubeschrijving](https://www.jlpt.jp/e/about/levelsummary.html), [vraagtypen](https://www.jlpt.jp/e/guideline/testsections.html) en [FAQ](https://www.jlpt.jp/e/faq/) bepalen competentiedomeinen en de begrenzing: er is geen uitputtende, huidige officiële woorden-/kanji-/grammaticalijst. Geen oude of commerciële lijst is hier absolute waarheid.

### Vergelijking onafhankelijke referenties

| Referentie | Vergelijking / vastgelegde provenance | Beperking |
|---|---|---|
| [JLPT Sensei vocab](https://jlptsensei.com/jlpt-n5-vocabulary-list/), [grammar](https://jlptsensei.com/jlpt-n5-grammar-list/), [kanji](https://jlptsensei.com/jlpt-n5-kanji-list/) | Gepagineerde feitelijke trefwoorden, lezingen en vormen; URL/hash per rechtstreeks verkregen vocabpagina. Web-readerfallback voor ontbrekende pagina's | Verschil tussen directe en geïndexeerde paginering; 638 unieke vocabvormen uit deze capture, geen claim dat dit de volledige uitgeverslijst is |
| [JapaneseTest4You vocab](https://japanesetest4you.com/jlpt-n5-vocabulary-list/) en [grammar](https://japanesetest4you.com/jlpt-n5-grammar-list/) | 546 herkende vocabvermeldingen, romaji en grammatica-ankers; URL/SHA-256 | Parser omvat niet gegarandeerd alle samengestelde/verzamelde varianten; homofonen mogen geen betekenisbewijs leveren |
| [MLC Japanese](https://www.mlcjapanese.co.jp/n5_04_01.html) | Geïndexeerde eigen publicatie: 802 woorden, opgebouwd uit 449 huidige workbook-items, 307 oude Level-4-items en 46 begroetingen | Volledige HTML/PDF niet bereikbaar in deze uitvoeromgeving. Alleen methodiek/omvang vergeleken; geen verzonnen item-overlap |

Tanos is eveneens onderzocht als aanvullende onafhankelijke historische bron, maar de eigen site/PDF was niet bereikbaar. Afgeleide websites die Tanos overnemen zijn niet als extra onafhankelijke stemmen geteld.

De voorlopige unie bevat 660 vocabulairekandidaten. Dat is **geen schatting van de complete N5-woordenschat**. Kernclassificatie vereist drie onafhankelijke, op itemniveau beschikbare uitgevers. Nu zijn de items `margin`; twee overeenkomstige uitgevers worden niet stilzwijgend `core`. Sensei-vocab/grammar/kanji tellen daarbij als één uitgever, niet als drie. `lj-extra` wordt ondersteund en uitgesloten van JLPT-percentages; niet-gemapt LJ-materiaal verhoogt niets.

Veiligheidsmarge: behoud de bredere, geverifieerde unie als margin; ga later niet alleen de kleine intersectie als denominator gebruiken. Reconcileer eerst varianten, woordbetekenissen, vervoegingen en de ontbrekende derde lijst. Geen exotische vulitems of lijsten uit modelgeheugen toegevoegd.

Exacte woordkoppelingen zijn gecontroleerd op schrijfwijze, lezing en betekenis. `はやい` is bewust niet automatisch zowel `早い` als `速い`. Beleefde vormen zoals `たべます` worden niet blind als volledig beheerst lemma `食べる` meegeteld. Dat is een metadata-/vormreview, niet automatisch een contentgat. Previewwoorden zonder lesintroductie tellen niet bij route-mijlpalen.

## 4. Audit Level 1–10

Nieuwe woorden zijn unieke huidige canonieke introducties, geen herhaalde vermeldingen of afleiders. Grammatica-aantallen omvatten centrale pedagogische records; niet ieder record introduceert een nieuw taalprincipe.

| Level | Werkelijke inhoud | Nieuwe woorden | Nieuwe grammaticarecords | Toets / bevinding |
|---|---|---:|---:|---|
| 1 | Hiragana, katakana, getallen; kana-/getalgenerators buiten `manifest.lessons` | 0 | 0 | 46 basistekens per schrift; 15 getalsymbolen centraal. Kana-mastery aanwezig, geen algemene kanji-mastery |
| 2 | Kana combineren, omgekeerde schriftrichting | 0 | 0 | Hergebruik van L1, geen nieuw lexicaal niveau. Klank/schrift is geen begrijpend lezen |
| 3 | Dakuten/handakuten, 50 klanktekens over twee schriften | 0 | 0 | Actief examen A: 30 klankvragen; oud examen B blijft alleen historische data |
| 4 | 10 lessen: beschrijven, aanwijzen, bezit, vraag, ook, handeling/object, bestemming | 20 | 7 | 40 pure woordbeurten; examen 30; alle structurele doelen geraakt. Sommige terugvertalingen tonen antwoord al in context |
| 5 | 5 lessen: kleine kana, combinaties, stop/uitspraak en lange klanken | 18 | 0 | 36 woordbeurten; examen 30, kana-doelen apart aanwezig. Geen lexicale review los van de schrijfregel nodig |
| 6 | Personen/familierelaties, wie, bestaande patronen combineren | 16 | 3 | 32 woordbeurten; examen 25. Sommige grammatica-records beschrijven alleen hergebruik |
| 7 | Dingen/personen/dieren tellen; lange/platte dingen; rangorde | 20 | 5 | 40 woordbeurten; examen 30. Functionele kleine subsets; geen claim alle tellers of uitzonderingen te kennen |
| 8 | 7 lessen: weekdagen, relatieve dagen, maanden, uren, minuten, agenda | 47 | 7 | 94 woordbeurten; examen 40. Ruime kana-/tijddekking, maar niet automatisch alle kalenderdata of kanji |
| 9 | Plaats, richting, positie, plaats van handeling | 20 | 5 | 40 woordbeurten; examen 30: 6/les, 17 context + 13 woordtargets. Recente variatie behouden |
| 10 | Dagelijkse toepassing: vragen/bestellen, tijd/plaats, samen, reizen | 15 | 5 | 30 woordbeurten; examen 30. Bruikbare chunks; niet gelijkstellen aan algemeen productief vervoegen |

**Woordrondes:** iedere unieke nieuwe ID exact eenmaal JP→NL en eenmaal NL→JP, geschud, geen teruglegging. De bestaande multi-seed tests blijven leidend. Level 3 is terecht niet van toepassing voor een lexicale 2N-ronde.

**Examens:** 3–10: respectievelijk 30, 30, 30, 25, 30, 40, 30, 30 vragen. Geen structurele doelen ontbreken in de gegenereerde steekproef. Niet ieder woord beide richtingen in ieder examen is juist: volledige herhaling gebeurt via woordrondes en Recall. Historische basisexamens L1 (46 per schrift) en L2 (92 gecombineerde tekens) zijn groter dan 40; die volgen een oudere volledige-schriftdekking. Dit is expliciet geen stilzwijgende algemene goedkeuring van >40 en is niet gewijzigd tijdens deze opdracht.

**Afleiders / raadwerk:** de reproduceerbare inspectie markeert 70 lescheckvragen met een letterlijk zichtbaar antwoord. Dat zijn niet 70 bewezen fouten. Handmatig gecontroleerde voorbeelden:

- `generated-l4-word-ねこ-spelling`: prompt “kat”, context “これは ねこ です”, antwoord “ねこ”. Dit bewijst herkenning/kopiëren, zwakker dan zelfstandig terughalen.
- `context-l10-1-word-vocab-ください`: het patroon in de context bevat `ください`, tevens het gevraagde woord. Assessmentgap: weggeven bij deze lexicale vraag.
- `exercise-l12-2-A-1`: informatie uit een aankomsttekst selecteren. Hier is letterlijke vindbaarheid functioneel en geen fout op zichzelf.
- `exercise-l13-3-A-1` en `exercise-l14-2-A-1`: route-informatie respectievelijk kamernummer vinden. Valide informatie-opzoekvragen, maar onvoldoende als enige bewijs van zelfstandig taalbegrip.

De automatische inspectie controleert ook ontbrekende/dubbele antwoordopties en een geïsoleerde Japanse antwoordoptie. De export bevat bron-ID, context, vraag, antwoord en keuzes voor review. De bestaande validators/tests bewaken uitgebreidere inhouds-/afleiderregels. Dit is geen claim dat een automatische scan alle semantische weggeefclues vindt.

**Antwoord op de hoofdvraag:** de basis is aanwezig en een deel wordt te eenzijdig getoetst, maar er ontbreekt ook substantiële N5-inhoud. Alleen vraagstelling verbeteren maakt van L1–10 geen volledige N5-route.

## 5. Audit Level 11–20

De lijn wijkt niet af van de gevraagde vakantievolgorde. Level 15 behoudt historische `l11-*` les-IDs; die mogen niet op grond van hun prefix worden gehernummerd. Level 11 is inmiddels een Japanse UI-/instructiebrug met een integratietoets, niet een tweede supermarkt.

| Level | Praktische uitkomst uit de huidige bronnen | Nieuw vocab | Grammatica / toepassing | Natuurlijke aanvulling, alleen voorstel |
|---|---|---:|---|---|
| 11 | Vraag/antwoordlabels, lees-/luister-/invulinstructies, volgorde; 4 lessen × A/B en integratie in les 5 | 40 | Naamwoorden met と, vaste てください-opdrachten; integratie van drie bronnen, 12 vragen | Instructiebegrip verdiepen; geen brede nieuwe vakantiegrammatica erin persen |
| 12 | Terminal/uitgang, paspoortcontrole, bagageband, kleur/grootte, ontmoetingsplek | 40 | Richting へ; vervoer met で; bord-/scènevragen | Korte echte aankomst-/omroepdialoog en begripvraag zonder zichtbare transcriptclue |
| 13 | Trein/bus/metro, kaartjes, spoor, overstap, bestemming, prijs, vertraging | 26 | から…まで, yenprijs, bestaande tijd/route | Functioneel vertrek-/aankomstcontrast en tijdsduren; geen losse vervoegingslijst |
| 14 | Reservering, gegevens, kamer/verdieping, voorzieningen, bagage, openingstijden | 34 | が あります als praktische structuur | Aan-/afwezigheid en kamerwensen; beleefde negatieve vorm alleen didactisch gedoseerd |
| 15 | Producten/labels, vinden, kiezen, kassa, bon/totaal | 30 | Hergebruik van beschikbaarheid, prijs en bekende patronen | Eenvoudig adjectiefcontrast en hoeveelheid/prijs in dialoog; basiskennis hergebruiken |
| 16 | Gepland: restaurant/eten; geen speelbare lesdata | — | Niet inventeerbaar | Bestellen, wensen, hoeveelheden; pas ontwerpen na aparte inhoudsopdracht |
| 17 | Gepland: Tokio/stad/navigatie | — | Niet inventeerbaar | Korte aanwijzingen, afstand en tijd functioneel combineren |
| 18 | Gepland: Kyoto/cultuur | — | Niet inventeerbaar | Plaatsgebonden tekst begrijpen; niet automatisch alle contextwoorden Recall maken |
| 19 | Gepland: vrije tijd/karaoke | — | Niet inventeerbaar | Uitnodigen, voorkeur, eenvoudig voorstel |
| 20 | Gepland: laatste reisdag/integratie | — | Niet inventeerbaar | Transfer over bekende situaties; geen nieuw “N5-vinkjeslevel” |

De gedetailleerde **25 werkelijke lesuitkomsten**, woord-/grammatica-/leesbron-IDs en vraagtargets staan per les in de JSON-export. L11–15 hebben zichtbare korte teksten, bord-/kaartinformatie en dialoogachtige scènes; uitspraak/audio kan bij zichtbare tekst worden gebruikt. Dat is nog geen zelfstandig luisterbegrip. Voor L12–15 zijn er vier contextvragen per Lestoets; de huidige thematische UI heeft geen afzonderlijk cumulatief levelexamen. L11 heeft zijn eigen integratie-examen. Dit ontbreken is gerapporteerd, niet via een nieuwe toetsroute opgelost.

Alle huidige corewoorden in deze levels hebben een Dictionary-/Recall-bronkoppeling. De bestaande gate en migratieregels blijven gelden. Voor Nederlands→Japans sluit Recall ambigu overlappende betekenissen soms uit; de opgeslagen andere richting wordt niet gewist. Dat is een richting-/assessmentreviewpunt, geen reden kunstmatig een tweede canoniek woord te maken.

## 6. Gaps naar type

| Type | Bewijs / betekenis | Kleinste volgende ingreep |
|---|---|---|
| A — kennis ontbreekt | 16–20 alleen planning; brede N5-woordenschat ontbreekt; geen systematische kanji-woordrepresentatie; beperkte algemene vervoeging/adjectiefparadigma's | Ontwerp eerst ontbrekende vakantielessen, daarna gericht fase 3; niet alles nieuw noemen als alleen een schrijflaag ontbreekt |
| B — kennis aanwezig, toetsing te zwak | L4 terugvertaling met doelwoord zichtbaar; L10 `ください` weggegeven; korte herhaalde vindvragen; lezen/luisteren niet afzonderlijk bewezen | Vervang alleen de betreffende clue/afleider of vraagvorm, binnen bestaand budget; behoud goede informatie-opzoekvragen |
| C — kennis aanwezig, Recall ontbreekt/onvolledig | Uitsluitend exposure ontgrendelt geplande Recall niet; beide richtingen niet altijd beschikbaar bij dubbelzinnige vertalingen | Beslis expliciet over introductie- versus toetsgate; verduidelijk betekenis met bestaande sense/contextdata, zonder SRS-reset |
| D — alleen metadata ontbreekt | Beleefde woordvorm versus lemma; grammatica-exposure is geen functionele mastery; numerieke kanji zijn geen alle-lezingenkennis; preview- en aliasrecords | Beoordeelde form/sense-koppelingen; minimale vraagtarget-evidence in bestaande vraagresultaten, geen parallel mastery-systeem |

Niet ieder ongemapt benchmarkitem is een bewezen contentgat. De inventaris houdt `knowledgeItemId:null` en gedeeltelijke koppelingen apart. Bestaande woorden met alleen een andere grammaticale vorm vragen eerst review. De drie previewdatawoorden `ついたち`, `ふつか`, `みっか` zijn zoekbaar maar geen huidige lesintroducties en tellen niet als behandeld door alleen catalogusaanwezigheid.

De dependencycontrole van vereiste vocab-ID's in oefeningen vond **0 verwijzingen naar latere lesgrenzen**. De bestaande contenttests controleren daarnaast didactische oppervlaktetokens, voorbeelden en revisies. Niet-gemarkeerde impliciete kennis in een tekst vraagt nog handmatige leestaalanalyse; de automatische uitkomst is geen algemene garantie op nul toekomstige taal.

## 7. Mijlpalen L10 / L15 / L20

| Mijlpaal | Werkelijk lesvocab cumulatief | Exacte voorlopige N5-woordkoppelingen | Ratio binnen voorlopige 660-kandidatenlijst | Verantwoord totaal-N5-percentage |
|---|---:|---:|---:|---|
| L10 | 156 | 87 | 13% | Niet berekenbaar |
| L15 | 326 | 125 | 19% | Niet berekenbaar |
| L20 | Geen data boven L15 | 125 in de bestaande repo | 19% van reeds geïmplementeerde inhoud; **geen L20-prognose** | Niet berekenbaar |

Dit zijn conservatieve **koppelingsratio's**, geen betrouwbare schatting van volledige N5-dekking en geen leerlingbeheersing. 128 exacte woordkoppelingen bestaan in het totale catalogusbestand; drie ervan zijn previewwoorden zonder huidige lesintroductie. Inflectie-/lemma- en meerwoordvormen zijn niet opgeblazen tot meerdere bekende lexemen. Een correcte latere vormreview kan de koppeling verhogen zonder nieuwe lesstof.

Grammatica: bij L10 5 volledige en 4 gedeeltelijke benchmarkvormkoppelingen; bij L15 5 volledige en 9 gedeeltelijke. Deze onvolledige vormmapping is **geen** grammatica-dekkingspercentage. Kanji: 13 overeenkomende getalsymbolen als gedeeltelijke representatie, geen algemene leesbeheersing. Lees-/luistercompetenties hebben nog geen goedgekeurde evidencekoppeling. Een gewogen overallpercentage zou daarom nu schijnprecisie zijn.

Er zijn 535 vocabkandidaten zonder exacte leskoppeling bij L15. Daarvan is niet automatisch ieder item nieuwe taal: eerst lemma/beleefde vormen, senses en woordgroepen beoordelen. Pas daarna kan het aantal echt nieuwe woorden versus representatie-/assessmentwerk betrouwbaar worden vastgesteld. De export houdt deze open set traceerbaar in plaats van een verzonnen exact aantal nieuwe lessen te produceren.

## 8. Fase 3 en tempo

**Geen bewijs voor “Level 30 = N5”, maar ook geen bewijs om nu Level 23–25 te beloven.** De helft van de vakantiefase is nog ongeschreven; de bestaande aantallen en domeingaten dragen geen uitspraak dat na L20 alleen automatisering resteert. Fase 3 begint inhoudelijk niet bij nul: kana, basispatronen en reistaal worden hergebruikt. Er is daarnaast echte nieuwe taal nodig.

Werkvolgorde voor tempo: schrijf L16–20 volgens hun reisfunctie → voltooi de N5-referentie-/lemmareview → bepaal resterende unieke kennis → combineer kanji-opbouw met bestaande woorden → versterk zelfstandige toepassing en luisterbegrip → bepaal het vroegst haalbare robuuste kantelpunt. Zodra N5 degelijk gedekt is, mag N4 beginnen; tien fase-3-levels zijn geen verplicht tijdrek.

“Ongeveer vier maanden → N5 binnen bereik” is op deze repo **niet te bevestigen**. De genoemde normale studieperiode kan als sanity check worden gebruikt, maar tijd levert geen kennisbewijs op. Eerst ontbreken L16–20 en de volledige benchmark/evidence. Dit is geen marketinggarantie en er is geen tijdslotlogica toegevoegd.

## 9. Technisch benchmarkmodel

`jlpt-benchmark.js`: `schemaVersion`, `version`, `capturedAt`, niveaus N5–N1, reviewstatus per domein, uitgever/provenance, canonieke `knowledgeItemId` of expliciet null, categorie, classificatie, `mappingScope` en bij kanji `representationScope`. De benchmark maakt geen vocabulaire-items, kaart-ID's of opslagrecords aan.

N4–N1 zijn `unbuilt`. Cumulatieve selectors nemen onderliggende benchmarkitems mee, maar geven geen percentage voor een ontbrekende hogere noemer. Overlap op hoger niveau kan later worden toegevoegd zonder eerst een lager niveau volledig stabiel te eisen. De validator voorkomt dat hetzelfde canonieke object dubbel als twee benchmarkitems wordt geboekt.

### Mapping huidige Recall-semantiek

Geen bestaande algemene “SRS strength 0–100” aanwezig. Daarom geen nieuwe score bedacht. De read-only selector gebruikt de bestaande Recall-categorie `repeated` (`repetitions >= 3`) als conservatieve **proxy**, in beide richtingen, met `lastGrade==='knew'` en een toekomstige vervaldatum. In de UI heet dit “herhaald in beide richtingen en nu niet aan de beurt”, niet “officieel beheerst”.

- Niet geïntroduceerd: `unseen`, ook als een vreemd/ouder SRS-record aanwezig is.
- Geïntroduceerd zonder voldoende beide-richtingenbewijs: `practicing`.
- Beide richtingen voldoen: interne selectorstatus `stable`.
- Eén bestaande richting verschuldigd: `needs-review`. Exposure blijft behouden.
- Ontbrekende domeinevidence: `evidence-unavailable`, nooit afgeleid uit vocab-Recall.

Vervaldatum overschrijden is in de huidige scheduler een herhaaladvies, geen continu geheugenvervalmodel. De selector doet niet alsof er een vergeten-percentage bestaat. Ambigue/uitgesloten richtingen worden niet kunstmatig als goed beoordeeld.

## 10. Voortgangsweergave en begrenzing

Kleine sectie onder de bestaande voortgangssamenvatting, drie rustige niveaucellen, één native toetsenbordbedienbare info-disclosure. Optioneel detail met feitelijke gekoppelde woordaantallen. De hoofdstatus blijft “In opbouw”/“Nog niet in kaart”. Geen extra pagina, geen nieuwe grafiek of instellingenstroom.

Alleen het vocabulairedomein heeft nu bruikbare actuele directionele evidence, en zelfs daarvoor is de benchmarknoemer nog niet gereviewd. Kanji, grammatica, lezen en luisteren hebben onvoldoende aparte beheersingsevidence voor percentages. **Geen overallpercentage wordt berekend**; de service ondersteunt domeinpercentages alleen na expliciete `reviewed`-status. Cross-domain weging/overall-evidence moet eerst inhoudelijk worden vastgelegd.

## 11. Migratie en compatibiliteit

Geen migratie, nieuwe localStorage-key of opgeslagen JLPT-score. Selectors zijn afgeleide, read-only functies. Geen Recall-reset, nieuwe scheduler, gewijzigde ranks, woordintroducties, navigatiehiërarchie, avatarinstellingen of laatste levelpositie. Basislessen en revisiegeschiedenis blijven intact. Assets zijn via het bestaande versiescript bijgewerkt; GitHub Pages blijft statisch werken. Geen runtime-LLM, backend of externe request nodig.

## 12. Tests en controles

- Volledige suite: **201/201 geslaagd**, inclusief bestaande Recall-, progressie-, L4-terughiërarchie-, woordenboek-, 2N- en examendekkingstests.
- Nieuwe tests: canonieke IDs, ongeldige/orphan mappings, dubbeltellingen, future leakage, onvoldoende provenance, exposure vóór mastery, richtingonderscheid, vervallen schema's, cumulativiteit, nullpercentages bij ontbrekende domeinen, read-only render en herladen.
- `validate-content`: 0 fouten; 4 bestaande waarschuwingen: optionele opgenomen audio voor 326 corewoorden en drie ongebruikte previewwoorden.
- `curriculum:report` uitgevoerd; auditexport via `npm run jlpt:audit`.
- Edge visueel en functioneel op **1280×900, 390×844 en 320×740**: geen horizontale overflow of JS-fouten; info met toetsenbord te openen; informatievlak blijft binnen viewport; woorddetail toont directioneel SRS-bewijs. Screenshots/results onder `output/playwright/jlpt/`.
- Dit is browseremulatie, geen controle op een fysiek iPhone-/Androidapparaat. Geen uitspraak dat een volledige JLPT-benchmark inhoudelijk is goedgekeurd.

## 13. Concrete implementatievolgorde en beslispunten

**Deze opdracht uitgevoerd:** canonieke audit/inventaris → voorlopige benchmark met provenance → read-only selectors → validators/tests → eerlijke compacte Voortgangsfundering. Geen curriculumherschrijving uitgevoerd.

Gewijzigde/toegevoegde bestanden:

| Bestand | Functie |
|---|---|
| `index.html` | Compacte sectie, info/detail en read-only adapter; bestaande assetversies vernieuwd |
| `language-journey-content/jlpt-benchmark.js` | Gegenereerde versieerbare data; geen les-/woordregistratie |
| `language-journey-content/jlpt-guideline.js` | Pure selectors en mappingvalidator |
| `scripts/jlpt-audit.cjs` | Werkelijke appgenerators + canonieke auditexport; faalt bij mapping-/dependencyfouten |
| `scripts/build-jlpt-benchmark.cjs` | Benchmark reproduceceren uit vastgelegde feitelijke referenties |
| `scripts/import-jlpt-references.py` | Optionele broncapture naar tijdelijke cache; geen runtime-afhankelijkheid |
| `scripts/jlpt-ui-qa.cjs` | Geïsoleerde browsercontrole met eigen tijdelijke server/profiel |
| `tests/jlpt.test.cjs`, `tests/app-probe.cjs` | Nieuwe regressies; bestaande testprobe toegankelijk maken voor read-only inspectie |
| `package.json` | `jlpt:audit` en `jlpt:benchmark` |
| `docs/jlpt/reference-capture.json` | Feitelijke trefwoorden/lezingen, bronlinks en hashes; geen overgenomen lesproza |
| `docs/jlpt/inventory.json` | Gegenereerde inventaris met per-les-dekking, vraagtargets, reviewflags en mijlpalen |
| Dit rapport; `output/playwright/jlpt/` | Bevindingen, beperkingen en visueel bewijs |

Reproduceren: `npm run jlpt:benchmark` → `npm run jlpt:audit` → `npm run assets:version` → `npm test`. Voor nieuwe internetcaptures is de Python-importer expliciet opt-in; bewaar alleen feitelijke referentievelden en review nieuwe mappings voordat een draft ooit `reviewed` wordt.

**Volgende inhoudelijke stappen, nog niet uitgevoerd:**

1. Volledige derde onafhankelijke itemreferentie verkrijgen en bronnen/paginering reconciliëren; betekenis-/vormmapping beoordelen. Daarna pas core/margin en N5-noemers formeel vastzetten.
2. De gemarkeerde echte cluevragen gericht vervangen. Goede bord-/informatievragen behouden; nieuwe zelfstandige begripvragen binnen bestaand budget toevoegen.
3. Productbesluit: geplande Recall vanaf echte introductie of pas na toets? Bij wijziging uitsluitend de eligibility-selector aanpassen en bestaande schedules/IDs behouden. Niets resetten.
4. Minimale `targetGoalId`-/reading-/listening-evidence toevoegen aan de bestaande antwoordregistratie, zonder tweede mastery-database. Oudere aggregate scores niet terugrekenen naar nooit opgeslagen itemresultaten.
5. Vakantielevels 16–20 afzonderlijk ontwerpen; kanji als representaties van bestaande woorden introduceren; ontbrekende N5-taal natuurlijk verdelen tussen vakantiecontext en fase 3.
6. Pas na representatieve evidence een overallmodel/weging laten beoordelen en echte percentages publiceren. Geen besluit over een hard eindlevel nodig.

Er is nu geen destructieve wijziging die goedkeuring nodig heeft. De bovenstaande product-/inhoudskeuzes vragen een nieuwe concrete opdracht of review vóór uitvoering van fase C. Audio/ElevenLabs en de eerdere reviewspreadsheet zijn bij deze opdracht niet gewijzigd.
