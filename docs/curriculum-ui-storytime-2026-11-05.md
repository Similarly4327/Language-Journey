# Curriculum, UI en Storytime — 5 november 2026

## Uitgevoerd

- Levels 11–14 tonen twee oefeningen met dezelfde primaire startknop en een afzonderlijke status. De interne blokken A–D, woordvolgorde, bronvolgorde, IDs en opgeslagen deelresultaten zijn behouden. A/B heten in de interface oefening 1, C/D oefening 2; binnen een oefening staan kleine stappen. De naam `れんしゅう` verschijnt pas wanneer het bestaande woord `vocab-れんしゅう` daadwerkelijk bekend is.
- De bestaande uitzonderingen met `preparationMicroblocks` blijven bestaan: sommige lessen van 12–14 bereiden alle vier woordblokken vóór bron A voor. Hun tweede startknop opent nog steeds bron B. Deze bronafhankelijkheid is niet stilzwijgend herverdeeld; daardoor is de indeling van deze lessen nog niet volledig twee zelfstandige A+B/C+D oefeningen.
- Recall heeft een bewaarde, optionele keuze voor bekende kanjischrijfwijzen. Standaard staat deze uit, ook bij een oud profiel met kanjiblootstelling. Dezelfde woordkaarten en beide bestaande SRS-richtingen blijven gelden. De keuze verandert presentatie, niet beoordeling, introductie of planning. Gewone oefeningen behouden de bestaande bekende-woorden-/blootstellingscontrole. Doelwoorden en antwoordopties krijgen tijdens een vraag geen lees- of woordenboekhulp.
- Vier agendavragen waarin een Japanse tijd naar een digitale tijd gelezen moet worden, krijgen een aparte Japanse bron zonder digitale antwoordlabels. Dit gebeurt bij de bronopbouw; lestoets en examen gebruiken dezelfde bron. Andere agenda-, maand-, dagdeel- en digitale-klokvragen behouden hun functionele cijfers. De oorspronkelijke agenda als model blijft behouden.
- Level 11 heeft een direct te openen Storytime, los van de bestaande, vergrendelde bonus. Het verhaal staat in een eigen gegevensbestand. Ronde 1 toont Japans, ronde 2 Japans met Nederlands. De lezer bewaart de ronde, kan opnieuw beginnen en heeft geen vragen, rank, poort of Recall-bron. Bestaande avatarbeelden worden hergebruikt. De bij het profiel passende rol gebruikt de gedeelde profielhelper; de andere rol houdt Ren of Miku als fictieve naam.

## Werkelijke route en compatibiliteit

Er is geen afzonderlijke route met de naam “Kana Complete”. Het bestaande Level 2 heet Kana Mix en combineert al alle 46 hiragana en 46 katakana. Het heeft beide oefenrichtingen, twee bestaande examens en de bijbehorende mastery/resultaten. Er is daarom geen niet-bestaand level verwijderd of samengevoegd.

De toegepaste mapping is identiteit:

| Voorheen | Nu | Behouden sleutels |
| --- | --- | --- |
| Level 1 schriftbasis | Level 1 schriftbasis | alle kana-, cijfer-, rij- en examen-IDs |
| Level 2 Kana Mix | Level 2 Kana Mix | `mix-exam1`, `mix-exam2`, mix-fouten en kana-mastery |
| Levels 3–10 | dezelfde levels | les-IDs, ranks, stappen, woorden en historische resultaten |
| Levels 11–15 | dezelfde levels | interne A–D en A/B voortgang, bronnen en SRS |

Er zijn geen bestaande opslagvelden, ranks, woord-IDs of profielwaarden herschreven. Toegevoegd zijn `intro`, `recallKanjiEnabled` en Storytime-positie binnen de bestaande thematische sessie. De assetversie is vernieuwd.

## Sociaal introductiehoofdstuk vóór Level 7

Het volledige leeronderdeel is toegevoegd als **Kennismaken**, direct vóór het bestaande Level 7 in de route, en ook bereikbaar vanuit het Level 7-overzicht. Het gebruikt de eigen stabiele route #/course/japanese/learn/intro. Het is een aanvullende hoofdstukkaart, geen hernummering van de bestaande levels.

De vier lessen zijn intro-greetings, intro-goodbyes, intro-meeting en intro-thanks. Ze behandelen alle aangevraagde begroetingen, afscheid, naamvraag en kennismaking, plus どうぞ als nuttige partner van bedanken. Elf nieuwe uitdrukkingen hebben elk één canoniek catalogusartikel met kana, romaji, betekenis, bron, lescontext en expliciete uitspraak. De zelfintroductie gebruikt het bekende わたし は … です en de gedeelde profielhelper. Bij de mannelijke standaardreisgenoot is dat わたし は レン です; een gekozen eigen avatarnaam blijft behouden.

Elke les biedt korte uitleg, kana/romaji/betekenis, een model, beide oefenrichtingen en een kort gesprek. De zelfintroductie heeft een visuele verdeling in onderwerp, naam en afsluiting. Snelle checks openen meteen vragen. Lestoetsen en de eindtoets van 27 vragen gebruiken de bestaande quiz-, resultaat-, rank- en foutenlogica. De nieuwe rank-IDs zijn de vier les-IDs en intro-exam; geen oude ID is aangepast.

De nieuwe sessie gebruikt het extra opslagveld intro met revision, lessonId en step. Bij laden wordt alleen dit veld genormaliseerd naar geldige nieuwe IDs/stappen. Dat is idempotent en herschrijft geen oude les-, rank-, profiel-, fout- of SRS-gegevens. Oude Level 7-ranks geven geen kennis of Recall-toegang tot nieuwe uitdrukkingen; alleen een eigen intro-lesrank of intro-eindtoets geeft daarvoor Copper-toegang. Ook lesdoelen en nieuwe-woordselectie zijn expliciet op routeId afgebakend: bestaande Level 7-lessen/examens krijgen geen extra intro-doelen.

| Oude route | Route na toevoeging |
| --- | --- |
| Levels 1–6 | ongewijzigd |
| Geen kennismakingshoofdstuk | nieuwe kaart Kennismaken vóór Level 7; eigen route/IDs |
| Level 7 Hoeveelheden | hetzelfde Level 7, dezelfde vijf lessen en examens |
| Levels 8–15 | ongewijzigd |

Een letterlijk nieuw genummerd Level 7 vereist een aparte migratie van zichtbare nummers, links, avatar/currentLevel-semantiek en vaste Level 4/5/8-koppelingen. De aanvullende hoofdstukkaart levert nu de volledige gevraagde leerinhoud op de gewenste plek, zonder die brede hernummering. Een eventuele latere zichtbare hernummering blijft een aparte productkeuze; de inhoud is niet meer afwezig.

Bronnen: [IRODORI Starter les 1](https://www.irodori.jpf.go.jp/assets/data/starter/pdf/X_L01.pdf), [IRODORI Starter les 3](https://www.irodori.jpf.go.jp/assets/data/starter/pdf/X_L03.pdf) en [Japan Foundation Waku Waku, begroetingen](https://yg.jpf.go.jp/wp-content/uploads/2025/11/JP_-Waku-Waku-Nihongo202251125.pdf).

## Audio-inventaris

De feitelijke lokale manifestinventaris bevat 1.037 opnames; alle 1.037 zijn als reviewed gemarkeerd. Dat is geen bewijs dat elke opname actueel is: de bestaande audit meldt 49 fouten wegens verouderde koppelingen en 18 weesbestanden. Vergelijking met de ongewijzigde `HEAD`-curriculumbron geeft dezelfde 49 fouten en 18 weesbestanden, zonder nieuwe fouten. Geen bestanden zijn verwijderd of gegenereerd.

| Onderdeel | Gecontroleerd resultaat |
| --- | --- |
| Storytime `ただいま。` | geen exact geregistreerde lezing of opname |
| Storytime `おかえりなさい。` | geen exact geregistreerde lezing of opname |
| Storytime `みず を どうぞ。` | geen exact geregistreerde lezing of opname |
| Storytime `ありがとう。` | expliciete lezing via het nieuwe intro-model; opname ontbreekt |
| Japanse agenda zonder digitale labels | expliciete lezing toegevoegd als `sentence-agenda-japanese-time-source`; opname ontbreekt |

Het intro-model こんにちは。 hergebruikt de bestaande opname. Alle elf nieuwe canonieke uitdrukkingen hebben een expliciete lezing, maar nog geen eigen opname. Persoonlijke namen krijgen geen gegokte uitspraak of opname. Storytime werkt volledig zonder audio; alleen een exact gevonden, geregistreerde opname krijgt een afspeelknop. Er wordt geen stem of uitspraak geraden en er is geen audiobatch aangemaakt. De precieze Storytime-inventaris staat in `output/curriculum-nov5-audio-audit.json`; de algemene inventaris in `output/curriculum-nov5-course-audio-audit.json`.

## Controle en grenzen

- `npm run validate-content`: 0 fouten, 5 bestaande waarschuwingen (ongeroosterde Japan-kanji, catalogus-audiowaarschuwing en drie ongebruikte datumwoorden).
- `npm run curriculum:report`: uitgevoerd; 15 levels, 71 lessen, 355 woorden, 372 oefeningen. Storytime is bewust geen toetsles en telt niet als vocabulaire.
- `npm test`: 248/248 geslaagd; eindresultaat in `output/curriculum-nov5-tests.txt`.
- Aanvullende regressies controleren de twee Storytime-rondes en herladen zonder leermutaties, optionele kanji op dezelfde Recall-kaart, bronspecifieke agenda-aanpassing en labels na werkelijke woordintroductie. Intro-regressies bewaken bovendien beide richtingen voor elk item, profielnamen, gewone ranks/resultaten, alle oude hashlinks, oude L7-examenafbakening en idempotent laden.
- Bestaande 375px VM-tests controleren zichtbare bron/vraag vóór antwoordopties en bewaren van antwoorden. Een echte visuele 375px browsercontrole is nog open: Chrome ontbrak en de geïsoleerde Edge-start stopte vóór de pagina verscheen. Er is daarom geen nieuwe visuele screenshotcontrole geclaimd.

De vaste thuisuitingen zijn nagekeken bij [Japan Foundation Erin, les 3](https://www.erin.jpf.go.jp/materials/basic/download/erin_lesson03_basic_script.pdf) en [MEXT basisuitingen](https://www.mext.go.jp/a_menu/nihongo_kyoiku/kyoiku/nanmin_nihongokyoiku/kyozai_1/pdf/01.pdf). Voor de toegevoegde introductielessen is [IRODORI Starter les 1](https://www.irodori.jpf.go.jp/assets/data/starter/pdf/X_L01.pdf) de aangewezen cursusreferentie.
