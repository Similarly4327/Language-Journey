(function(root){
  'use strict';
  const reference='https://www.irodori.jpf.go.jp/assets/data/Grammar_all.pdf';
  function apply(m){
    const update=(id,symbol,romaji,name,explanation,keywords,examples,extra={})=>{
      const entry=m.grammar.find(g=>g.id===id);if(!entry)throw Error('Missing grammar '+id);
      Object.assign(entry,{symbol,romaji,category:name,dictionaryMeaning:name,fullExplanation:explanation,synonyms:keywords,examples:examples.map(e=>e[0]),exampleTranslations:examples.map(e=>({translation:e[1]})),reference,referenceOnly:true,...extra});
    };
    update('grammar-ha','は','wa','Waar de zin over gaat','は markeert het topic en klinkt hier als wa. Het geeft niet zelf de betekenis “is”; de beschrijving volgt erna. Als los kana klinkt は als ha.',['topic','onderwerp','wa'],[['これ は ねこ です。','Dit is een kat.'],['これ は いぬ です。','Dit is een hond.'],['これ は みず です。','Dit is water.']]);
    update('grammar-desu','です','desu','Beleefde zinsafsluiting','です sluit een beschrijving beleefd af. De natuurlijke Nederlandse vertaling kan ben, is of zijn bevatten. Het is geen zelfstandig naamwoord.',['is','ben','zijn','copula'],[['これ は ねこ です。','Dit is een kat.'],['これ は いぬ です。','Dit is een hond.'],['これ は パン です。','Dit is brood.']]);
    update('grammar-no','の','no','Bezit of relatie tussen naamwoorden','X の Y verbindt twee naamwoorden: Y van X. De eigenaar of het referentiepunt staat vóór の. Posities zoals みせ の となり volgen later in Level 9; die functie heeft een eigen bronvermelding.',['van','bezit','mijn','relatie'],[['これ は わたし の ほん です。','Dit is mijn boek.'],['それ は ともだち の ほん です。','Dat is het boek van een vriend.'],['あれ は わたし の ねこ です。','Dat daar is mijn kat.']]);
    update('grammar-ka','か','ka','Een beleefde vraag maken','Zet か aan het einde van de bekende beschrijving met です. De eerdere woorden houden hun betekenis.',['vraag','vragen','vraagpartikel'],[['これ は ねこ です か。','Is dit een kat?'],['それ は ほん です か。','Is dat een boek?'],['あれ は ともだち の いぬ です か。','Is dat daar de hond van een vriend?']]);
    update('grammar-mo','も','mo','Ook: dezelfde beschrijving geldt','も betekent hier ook en vervangt は in het aangeleerde patroon. Het is niet zonder meer het Nederlandse voegwoord en. De constructie NもNも (“zowel … als”) is nog niet als lesdoel geïntroduceerd.',['ook','eveneens','toevoegen'],[['これ は ねこ です。それ も ねこ です。','Dit is een kat. Dat is ook een kat.'],['これ は ほん です。あれ も ほん です。','Dit is een boek. Dat daar is ook een boek.'],['これ は ともだち の いぬ です。それ も ともだち の いぬ です。','Dit is de hond van een vriend. Dat is ook de hond van een vriend.']]);
    update('grammar-wo','を','o','Wat je doet: het object','を markeert waarop de handeling gericht is en klinkt als o. Het is geen los woord met de vertaling het of de. Het werkwoord staat in deze basiszinnen achteraan.',['object','lijdend voorwerp','o','wo'],[['わたし は みず を のみます。','Ik drink water.'],['わたし は パン を たべます。','Ik eet brood.'],['ともだち は さかな を たべます。','Een vriend eet vis.']]);
    update('grammar-ni','に','ni','Bestemming: naar een plaats','De bestemming staat vóór に; いきます geeft het gaan aan. に kan in latere lespatronen ook tijd of het voertuig bij のります markeren. Die toepassingen staan apart, met hun eigen introductieles.',['naar','bestemming','richting'],[['わたし は えき に いきます。','Ik ga naar het station.'],['ともだち は みせ に いきます。','Een vriend gaat naar de winkel.'],['わたし は うち に いきます。','Ik ga naar huis.']]);
    const specs=[
      ['grammar-l6-3','だれ です か','dare desu ka','Naar een persoon vragen','wie'],
      ['grammar-l7-1','〜つ','tsu','Een aantal noemen','aantal'],
      ['grammar-l7-2','〜にん','nin','Mensen tellen','mensen teller'],
      ['grammar-l7-3','〜ひき','hiki','Kleine dieren tellen','dieren teller'],
      ['grammar-l7-4','〜ほん / 〜まい','hon / mai','Lange of platte dingen tellen','lang plat teller'],
      ['grammar-l7-5','〜ばんめ','banme','Een volgorde aangeven','eerste tweede rangtelwoord'],
      ['grammar-l8-1','dag + は','wa','De weekdag als onderwerp','dag maandag'],
      ['grammar-l8-2','なんようび です か','nanyoubi desu ka','Naar de weekdag vragen','welke dag'],
      ['grammar-l8-3','きょう / あした / きのう','kyou / ashita / kinou','Vandaag, morgen of gisteren vooraan','tijd vandaag morgen gisteren'],
      ['grammar-l8-4','〜がつ に','gatsu ni','In welke maand iets gebeurt','maand in tijd'],
      ['grammar-l8-5','〜じ / ごぜん / ごご','ji / gozen / gogo','Uren, ochtend en middag','tijd uur klok'],
      ['grammar-l8-minutes','なんじ / はん / ふん','nanji / han / fun','Hoe laat, halfuur en minuten','hoe laat half minuten'],
      ['grammar-l9-1','どこ です か','doko desu ka','Naar een plaats vragen','waar plaats'],
      ['grammar-l9-2','ひだり / みぎ / まっすぐ','hidari / migi / massugu','Een richting beschrijven','links rechts rechtdoor'],
      ['grammar-l9-3','N の まえ / うしろ / となり / なか','no','Een plaats ten opzichte van iets','voor achter naast binnen in'],
      ['grammar-l9-4','N の うえ / した / そと / ちかく','no','Op, onder, buiten of dichtbij','op boven onder buiten dichtbij'],
      ['grammar-l9-5','で','de','De plaats van een handeling','in op bij plaats handeling'],
      ['grammar-l10-1','を ください','o kudasai','Beleefd om iets vragen','alstublieft graag bestellen'],
      ['grammar-l10-3','と','to','Met iemand afspreken','met samen persoon'],
      ['grammar-l10-4','に のります','ni norimasu','In een vervoermiddel stappen','instappen voertuig in'],
      ['grammar-l11-home-1','〜てください','te kudasai','Een beleefde opdracht herkennen','te de verzoek lees luister schrijf vul'],
      ['grammar-l12-1','へ','e','Richting aangeven','naar richting he e'],
      ['grammar-l13-1','から … まで','kara made','Van beginpunt tot eindpunt','van vanaf tot route'],
      ['grammar-l14-1','が あります','ga arimasu','Iets is aanwezig','aanwezig er is reservering'],
      ['grammar-l13-price','〜えん','en','Een prijs in yen','prijs yen geld']
    ];
    for(const [id,symbol,romaji,name,search] of specs){const g=m.grammar.find(g=>g.id===id);Object.assign(g,{symbol,romaji,category:name,dictionaryMeaning:name,synonyms:search.split(' '),reference,referenceOnly:true});}
    const examples=(id,list,explanation,why='')=>{const g=m.grammar.find(g=>g.id===id);g.examples=list.map(e=>e[0]);g.exampleTranslations=list.map(e=>({translation:e[1]}));if(explanation)g.fullExplanation=explanation;if(why)g.exampleLimitNote=why};
    examples('grammar-l6-3',[['これ は だれ です か。','Wie is dit?'],['それ は だれ です か。','Wie is dat?'],['あれ は だれ です か。','Wie is dat daar?']]);
    examples('grammar-l7-1',[['パン は ひとつ です。','Het is één brood.'],['ほん は ふたつ です。','Het zijn twee boeken.'],['さかな は みっつ です。','Het zijn drie vissen.']]);
    examples('grammar-l7-2',[['かぞく は よにん です。','Het gezin bestaat uit vier personen.'],['ともだち は ふたり です。','Er zijn twee vrienden.'],['ひと は さんにん です。','Er zijn drie mensen.']]);
    examples('grammar-l7-3',[['ねこ は いっぴき です。','Er is één kat.'],['いぬ は にひき です。','Er zijn twee honden.'],['ねこ は さんびき です。','Er zijn drie katten.']]);
    examples('grammar-l7-5',[['ねこ は いちばんめ です。','De kat is eerste.'],['いぬ は にばんめ です。','De hond is tweede.'],['ともだち は さんばんめ です。','Een vriend is derde.']]);
    examples('grammar-l8-1',[['げつようび は みせ に いきます。','Maandag ga ik naar de winkel.'],['かようび は えき に いきます。','Dinsdag ga ik naar het station.'],['すいようび は ほん を よみます。','Woensdag lees ik een boek.']]);
    examples('grammar-l8-2',[['なんようび です か。','Welke dag is het?'],['きんようび は みせ に いきます。','Vrijdag ga ik naar de winkel.'],['にちようび は ほん を よみます。','Zondag lees ik een boek.']]);
    examples('grammar-l8-3',[['きょう ほん を よみます。','Vandaag lees ik een boek.'],['あした えき に いきます。','Morgen ga ik naar het station.']],'きょう en あした kunnen vooraan staan zonder に. きのう betekent gisteren; een volledige zin over een handeling van gisteren heeft een verleden tijd nodig. Die vorm wordt hier nog niet als patroon geoefend.','Twee voorbeelden: de verleden tijd die bij きのう hoort, is hier nog niet geïntroduceerd.');
    examples('grammar-l8-4',[['いちがつ に ほん を よみます。','In januari lees ik een boek.'],['さんがつ に えき に いきます。','In maart ga ik naar het station.'],['しちがつ に みせ に いきます。','In juli ga ik naar de winkel.']]);
    examples('grammar-l8-5',[['ごぜん しちじ です。','Het is zeven uur in de ochtend.'],['ごご いちじ です。','Het is één uur in de middag.'],['ごご しちじ です。','Het is zeven uur in de avond.']]);
    examples('grammar-l8-minutes',[['いま なんじ です か。','Hoe laat is het nu?'],['じゅうにじはん です。','Het is half één (12:30).'],['じゅうにじ ごふん です。','Het is vijf over twaalf.']]);
    examples('grammar-l9-1',[['みせ は どこ です か。','Waar is de winkel?'],['えき は ここ です。','Het station is hier.'],['うち は あそこ です。','Het huis is daar verderop.']]);
    examples('grammar-l9-2',[['みせ は ひだり です。','De winkel is links.'],['えき は みぎ です。','Het station is rechts.'],['うち は まっすぐ です。','Het huis is rechtdoor.']]);
    examples('grammar-l9-3',[['みせ は えき の まえ です。','De winkel is voor het station.'],['えき は うち の うしろ です。','Het station is achter het huis.'],['うち は みせ の となり です。','Het huis is naast de winkel.'],['ねこ は うち の なか です。','De kat is in het huis.']]);
    examples('grammar-l9-4',[['ねこ は ベッド の うえ です。','De kat is op het bed.'],['いぬ は ベッド の した です。','De hond is onder het bed.'],['ねこ は うち の そと です。','De kat is buiten het huis.'],['みせ は えき の ちかく です。','De winkel is dicht bij het station.']]);
    examples('grammar-l9-5',[['こうえん で パン を たべます。','Ik eet brood in het park.'],['うち で みず を のみます。','Ik drink thuis water.'],['がっこう で ほん を よみます。','Ik lees op school een boek.'],['レストラン で パン を たべます。','Ik eet brood in het restaurant.']],'で markeert hier waar de handeling gebeurt. Vergelijk に bij een bestemming. Dit is niet hetzelfde als で als vervoermiddel of een verbindende werkwoordsvorm; die functies mogen niet als één vertaling worden samengevoegd.');
    examples('grammar-l10-3',[['ともだち と あいます。','Ik spreek met een vriend af.'],['あした ともだち と あいます。','Morgen spreek ik met een vriend af.'],['ともだち と みせ で おちゃ を かいます。','Ik koop met een vriend thee in de winkel.']],'と markeert hier met wie je iets doet. De opsomming van twee naamwoorden met と is een andere functie en staat apart.');
    examples('grammar-l10-1',[['パン を ふたつ ください。','Twee broden, alstublieft.'],['みず を ひとつ ください。','Eén water, alstublieft.'],['ほん を ひとつ ください。','Eén boek, alstublieft.']]);
    examples('grammar-l10-4',[['でんしゃ に のります。','Ik neem de trein.'],['えき で でんしゃ に のります。','Op het station stap ik in de trein.'],['バス に のります。','Ik neem de bus.']]);
    examples('grammar-l13-1',[['くうこう から ホテル まで いきます。','Ik ga van de luchthaven naar het hotel.'],['えき から ホテル まで いきます。','Ik ga van het station naar het hotel.'],['ホテル から えき まで いきます。','Ik ga van het hotel naar het station.']]);
    examples('grammar-l14-1',[['よやく が あります。','Ik heb een reservering.'],['よやく が あります か。','Heeft u een reservering?']],'Met が あります zeg je dat iets aanwezig is. In deze situatie betekent よやく が あります: ik heb een reservering. Met か wordt het een vraag.','Bij de introductie zijn reserveringen de beschikbare, expliciet voorbereide context; geen extra nieuwe zelfstandige naamwoorden voor meer voorbeelden.');
    examples('grammar-l13-price',[['100えん です。','Het kost 100 yen.'],['300えん です。','Het kost 300 yen.'],['500えん です。','Het kost 500 yen.']]);
    examples('grammar-l12-1',[['くうこう へ いきます。','Ik ga richting de luchthaven.'],['えき へ いきます。','Ik ga richting het station.'],['みせ へ いきます。','Ik ga richting de winkel.']]);
    examples('grammar-l11-home-1',[['ぶん を よんでください。','Lees de zin.'],['タイトル を よんでください。','Lees de titel.']],'〜てください is een beleefde opdracht. In deze les herken je よんでください als geheel. De algemene verbindende te-vorm, een losse vertaling “en” en de verbuigingsregels zijn daarmee nog niet geleerd.',['Twee voorbeelden bij de introductie: luister-, schrijf- en invulopdrachten worden pas in les 11-3 geleerd.'].join(''));
    const request=m.grammar.find(g=>g.id==='grammar-l11-home-1');request.synonyms.push('て','で','でください','よんでください');request.romaji='te kudasai / de kudasai';request.fullExplanation+=' De verzoekvorm kent ook de variant でください, zoals in よんでください. Dit is geen zelfstandig voegwoord “en”.';
    const list={id:'grammar-noun-to',title:'Naamwoorden verbinden met と',symbol:'と',romaji:'to',category:'Naamwoorden verbinden: en',dictionaryMeaning:'Naamwoorden verbinden: en',shortExplanation:'N1 と N2 noemt twee dingen samen.',fullExplanation:'と verbindt hier twee naamwoorden: en. Dit is een andere functie dan met iemand afspreken. Het verbindt geen willekeurige complete werkwoordzinnen.',introducedAt:'11-2-B',availableFrom:'11-2-B',reference,referenceOnly:true,synonyms:['en','opsomming','verbinden','naamwoorden'],examples:['もじ と しるし を みます。','タイトル と ぶん を よんでください。','ことば と いみ を みます。'],exampleTranslations:[{translation:'Ik bekijk de letters en het teken.'},{translation:'Lees de titel en de zin.'},{translation:'Ik bekijk het woord en de betekenis.'}],dependencies:[]};
    m.grammar.push(list);m.lessons.find(l=>l.id==='l11-home-2').grammarIds.push(list.id);
    // The Level 12 arrival source actually uses ひこうき で にほん に つきました.
    m.grammar.push({id:'grammar-de-transport',title:'で als vervoermiddel',symbol:'で',romaji:'de',audioTextKana:'で',category:'Met een vervoermiddel reizen',dictionaryMeaning:'Met een vervoermiddel reizen',shortExplanation:'で markeert hier waarmee je reist.',fullExplanation:'Bij een vervoermiddel betekent で: met. In de aankomsttekst reis je met het vliegtuig. Dit is een andere functie dan de plaats van een handeling in Level 9; het is geen verbindende te-/de-vorm.',introducedAt:'12-1-A',availableFrom:'12-1-A',reference,referenceOnly:true,synonyms:['met','vervoermiddel','middel','per','bus','trein','vliegtuig'],examples:['ひこうき で にほん に つきました。','でんしゃ で えき に いきます。','バス で くうこう に いきます。'],exampleTranslations:[{translation:'Ik ben met het vliegtuig in Japan aangekomen.'},{translation:'Ik ga met de trein naar het station.'},{translation:'Ik ga met de bus naar de luchthaven.'}],dependencies:[]});
    m.lessons.find(l=>l.id==='l12-1').grammarIds.push('grammar-de-transport');
    // Remove only a duplicate reference row, never the canonical historical ID.
    m.grammar.find(g=>g.id==='grammar-l8-months-2').referenceAliasOf='grammar-l8-4';
    m.grammar.find(g=>g.id==='grammar-l11-1').referenceAliasOf='grammar-l14-1';
    for(const g of m.grammar.filter(g=>g.symbol))g.grammarKind=['grammar-ha','grammar-no','grammar-ka','grammar-mo','grammar-wo','grammar-ni','grammar-l9-5','grammar-l10-3','grammar-l12-1','grammar-noun-to','grammar-de-transport'].includes(g.id)?'Partikel':g.id==='grammar-desu'?'Copula / beleefde zinsafsluiting':g.id==='grammar-l11-home-1'?'Verbuiging / verzoekconstructie':'Grammaticaal patroon';
    for(const g of m.grammar.filter(g=>g.symbol)){
      if(!g.exampleLimitNote&&(g.examples?.length||0)<3)g.exampleLimitNote='Dit naslagitem gebruikt de beperkte voorbeelden uit de oorspronkelijke les. Er worden geen nieuwe woorden of nog niet behandelde vormen toegevoegd om de lijst op te vullen.';
      if(!g.exampleTranslations)g.exampleTranslations=(g.examples||[]).map(text=>({translation:m.lessons.flatMap(l=>l.models||[]).find(model=>model.sentence.replace(/[。]/g,'')===text.replace(/[。]/g,''))?.meaning||g.shortExplanation}));
    }
    m.grammarReferenceAudit={excluded:[{form:'〜ません / じゃない',reason:'Geen expliciete introductie in de actuele actieve lesstof; historische lesnamen zijn geen bewijs.'},{form:'NもNも',reason:'Nog geen afzonderlijk aangeleerde zowel … als-constructie.'},{form:'て / で als verbindende verbuiging',reason:'De cursus leert wel de verzoekvorm てください en de plaatsmarkering で, niet de algemene verbindingsregels.'}],reference};
    m.contentVersion='1.8.0';
  }
  const api={apply};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.LanguageJourneyGrammarReference=api;
})(typeof globalThis!=='undefined'?globalThis:this);
