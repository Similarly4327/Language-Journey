# Opslagfixtures voor Recall-herstel

Deze fixtures bevatten representatieve opslagvormen uit de vorige codeversie, met synthetische data. Ze zijn geen export van de persoonlijke Safari-opslag van de gebruiker.

De bestanden zijn vóór implementatie gemaakt en blijven ongewijzigd, zodat migratie en behoud van beide SRS-richtingen reproduceerbaar worden getest:

- lesson-copper: Copper op bronles l4-1.
- exam-copper: Copper uitsluitend op l4-exam.
- string-version: dezelfde examendata met versie als tekst.
- retired-source: Copper op l8-months-2, de voormalige tweede maandenles.
- reviews-without-copper: eerder bekeken woord en SRS-data, geen Copper-bewijs.
- zero: geen voortgang.

De app bewaart vóór migratie de originele lokale JSON onder de bestaande opslagkey met suffix `:before-recall-recovery-20261007`. De i-uitleg biedt een backupdownload van actuele en oorspronkelijke ruwe opslag. Ongeldige/onbekende opslagformaten worden niet overschreven.
