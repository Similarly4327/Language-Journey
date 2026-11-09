# Levelindeling en bestaande voortgang

De stabiele les- en toets-ID's blijven onveranderd. De interne index hieronder is de bestaande nulgebaseerde `state.level`; zichtbare nummers volgen `level-contract.js`. Level 11 en hoger behouden hun nummer. De oorspronkelijke numerieke routes blijven als oude links werken; nieuwe links gebruiken de stabiele ID in `/learn/level-id/…` of `/learn/module-id/…`.

| Oude zichtbare level / interne index | Nieuwe zichtbare level | Inhoud en stabiele les-ID's | Aangewezen afsluiting | Nieuwe route-ID |
| --- | --- | --- | --- | --- |
| 1 / 0 | 1 | Schriftbasis: Hiragana, cijfers, Katakana; `hiragana-row-*`, `katakana-row-*`, `num-*` | `kana-complete-exam` | `kana-foundation` |
| 2 / 1 | 1 | Kana Mix: beide schriften en oefenrichtingen; bestaande `mix-exam1`, `mix-exam2` blijven als historie behouden | dezelfde `kana-complete-exam` | `kana-mix` (module) |
| 3 / 2 | 2 | Dakuten en Handakuten, `dak-*` | `dak-examA` | `level-3` |
| 4 / 3 | 3 | Eerste taalbasis, `l4-1`–`l4-10` | `l4-exam` | `level-4` |
| 5 / 4 | 4 | Kleine kana en lange klanken, `l5-1`–`l5-5` | `l5-exam` | `level-5` |
| 6 / 5 | 5 | Mensen en relaties, `l6-1`–`l6-5` | `l6-exam` | `level-6` |
| 7 / 6 | 6 | Hoeveelheden, `l7-1`–`l7-5` | `l7-exam` | `level-7` |
| Voorheen afzonderlijk hoofdstuk / 6, scherm `intro` | 7 | Kennismaken, `intro-greetings`, `intro-goodbyes`, `intro-meeting`, `intro-thanks` | `intro-exam` | `social-intro` |
| 8 / 7 | 8 | Tijd en agenda, `l8-1`–`l8-5`, `l8-minutes`, `l8-6` | `l8-exam` | `level-8` |
| 9 / 8 | 9 | Plaats en richting, `l9-1`–`l9-5` | `l9-exam` | `level-9` |
| 10 / 9 | 10 | Dagelijks Japans, `l10-1`–`l10-5` | `l10-exam` | `level-10` |

De precieze woorden, tekens, introductiepunten en oefeningen worden uit de bestaande contentmanifest afgeleid. Kana- en cijferlessen zijn gegenereerde rijen en stappen; ze zijn geen losse manifestlessen. Audio wordt opgezocht via de bestaande lokale audioverwijzingen en het audiomanifest, niet door een tweede woordenlijst. Progressie staat in `taal-japanse-leerapp-v1`: `state`, `ranks`, `itemMastery` en `vocabMastery` behouden hun bestaande sleutels. Dictionary en Recall blijven dezelfde `vocab-*`- en les-ID's gebruiken.

Voor het nieuwe kana-examen worden zowel kana → klank als klank → gevraagd schrift getoetst. Bij bestaande gebruikers tellen de twee oude volledige Kana Mix-examens samen als bewijs voor de nieuwe afsluiting; de nieuwe rank is dan maximaal de laagste van de twee oude ranks. Eén oud examen, afzonderlijke rijexamens of andere gedeeltelijke resultaten geven niet vanzelf de nieuwe totale rank. De oude records worden niet verwijderd of aangepast. De omzetting is idempotent en overschrijft een bestaand nieuw examenresultaat niet.

De eerdere introductie stond als extra kaart vóór oud Level 7, met een aparte route en een eigen `intro-exam`. De algemene Level 7-rank wees uitsluitend naar `l7-exam`, waardoor het introductie-examen geen levelbadge opleverde. Oud Level 1 en 2 vereisten bovendien verschillende afzonderlijke examens voor een algemene rank. De nieuwe contracten wijzen per zichtbaar level één afsluitende toets aan, inclusief `intro-exam` voor zichtbaar Level 7.
