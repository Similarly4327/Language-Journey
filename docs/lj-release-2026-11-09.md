# Language Journey — uitvoering 9 november 2026

## Verwerkte opdrachten

- [Anime & Muziek: selecteerbare lessen en hervatten](https://docs.google.com/document/d/1vkYQNTHXXjF8wA2G37Duy3qqAJb3h4rLcTuZzLPSCv0)
- [Lesinformatie, 私, levels 7/11 en ElevenLabs](https://docs.google.com/document/d/1shpdAmLNDxmS8BC7XvFjlRcZ3o5tlejWU-Qyh79MGkY)
- [Levelcontract en curriculumherstel](https://docs.google.com/document/d/1oyQNM_zotGsnb-H8m5BHk1d6uyRuZ047qFesF_yvXcE)

## Appwijzigingen

De 17 bestaande muziekwoordgroepen hebben selecteerbare gewone leskaarten, echte opgeslagen ranks en een hervatknop. De drie bestaande contextfragmenten zijn eveneens selecteerbaar. Hervatten bewaart het groepje/fragment, niet de exacte vraag binnen een sessie. Kanji blijft binnen Woorden leren. Het lied heeft twee hoofdblokken en beïnvloedt gewone levelranks niet.

Een gedeeld informatievenster toont deze les en de rest van het level, met canonieke Dictionary-links, kana-lezingen en previewstatus. Ook bestaande nummer-IDs zijn als getallen opzoekbaar. Het venster bewaart de les-DOM, scroll en vraag; automatische voortgang wacht zolang het openstaat. Beschermde quizdoelen blijven vóór beoordeling verborgen. Een Dictionary-artikel opent boven het informatievenster en keert ernaar terug.

De zichtbare indeling is: 1 = oude levels 1+2; 2–6 = oude 3–7; 7 = Kennismaken; 8–10 en 11+ behouden hun nummer. Stabiele les-, woord- en opslag-IDs blijven intact. Oude numerieke links blijven geldig; nieuwe links gebruiken stabiele level-IDs. Eén gecombineerd kana-examen toetst beide richtingen. Twee volledig behaalde oude Kana Mix-examens migreren conservatief op de laagste bewezen rank; ontbrekende onderdelen krijgen geen gratis beheersing. Het introductie-examen telt nu voor zijn eigen algemene levelbadge. Voortgang telt het samengevoegde level één keer; avatar en profiel tonen de zichtbare nummering. Zie [de volledige mapping](level-mapping-2026-11-09.md).

私 wordt zichtbaar uitgelegd in voorbereidingsblok B van level 11 les 1 en direct met een herkenningsvraag geoefend. Dit is schrijfwijze van het bestaande `vocab-わたし`, geen extra lexeme. Recall vereist afzonderlijk herkenningsbewijs, blootstelling en een behaalde lesrank. De woordkaart houdt kana en haar oude planning; de kanjikaart heeft level 11 les 1 als bron en eigen kanjivoortgang. Oude niet-onderbouwde kanji-reviews worden in curriculumHistory bewaard. Het leesfragment en optionele Storytime zijn uitgebreid met bijbehorende vragen en audio.

## Volledige v4-bibliotheek

V2 was sinds 7 oktober een overgenomen vaste configuratie. Er was geen vastgelegde vergelijking met v4. Accountmetadata bevestigde Japanse v4-compatibiliteit van Sakura en Ishibashi; echte v4-proeven slaagden. De gebruiker koos v4 en autoriseerde daarna volledige hergeneratie. De adapter gebruikt de Dialogue API met expliciet Japans. Zie [onderzoek en proefinstellingen](elevenlabs-model-review-2026-11-09.md).

Alle **2.894** benodigde bestanden zijn met v4 voor beide stemmen gegenereerd, samen 84.660.635 bytes. Dekking: 398 woorden, 666 zinnen, 72 passages, 119 getallen, 160 zelfstandige kana-klanken, 22 grammatica-uitdrukkingen en 10 avatarreacties; alle 14 dialogen hebben de benodigde regels. Negentien instructielabels en drie schrijftekens gebruiken passende bestaande gesproken context, zonder verzonnen zelfstandige uitspraak. De negen nieuw gespecificeerde grammaticalezingen zijn ook gegenereerd. Oude MP3's zijn behouden; het huidige manifest verwijst naar v4.

Modelkeuze en taal staan per nieuwe opname in het manifest. De gebruiker beoordeelde de aangeboden modelproef. Niet alle 2.894 clips zijn individueel beluisterd: `individuallyListened:false` legt deze grens expliciet vast. De hoofdletter `reviewed` betreft toelating via de goedgekeurde modelproef, geen claim van individuele beluistering.

## Verificatie

- Volledige testsuite: **302 geslaagd, 0 mislukt**. De laatste correctie van het introductiemoment naar blok B is daarna met 27 gerichte tests gecontroleerd.
- Inhoudsvalidatie: **0 fouten, 4 bestaande waarschuwingen**: oningeplande 日本-schrijfwijze en drie ongekoppelde datumwoorden.
- Audio-audit: **0 fouten, 0 ontbrekende lezingen, 0 ontbrekende opnamen, 0 waarschuwingen**. Alle 2.894 bestanden hebben een geldige MP3-header.
- De 806 gecontroleerde Japanse cursusteksten hebben expliciete lezingen.
- Browsercontrole bij 375 px: directe muzieklesselectie, hervatpositie, gedeeld i-overzicht en Dictionary erboven. In de definitieve lokale app is het afspelen van v4 via een echte lesknop bevestigd.
- Bestaande/nieuwe profielen, ranks, idempotente migratie, Recall-bronnen en duurzame Copper worden door de gerichte integratietests gecontroleerd. De volledige 184-vragen-kana-afsluiting is niet handmatig in de browser doorgeklikt.

De publicatie wordt na de commit via GitHub Pages gecontroleerd. Promptdocumenten worden pas na die controle naar de bestaande Compleet-map verplaatst.
