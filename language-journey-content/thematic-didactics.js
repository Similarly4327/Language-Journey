(function(root){
  'use strict';
  // Authoring patch for the canonical registry, before adapters and Audio Fundament v3 attach.
  // References: JPF IRODORI Starter L7/L13 and Grammar_all.pdf. Existing lexical IDs stay intact.
  const revisions={};
  const question=(prompt,answer,...other)=>({prompt,answer,choices:[answer,...other]});
  const part=(text,translation,audioTextKana,questions,kind='notice')=>({text,translation,audioTextKana,questions,resourceKind:kind});
  Object.assign(revisions,{
    'l11-home-1':{
      canDo:'Een Japanse vraag, antwoord en goed/fout-aanduiding in de app herkennen.',
      A:part('レベル 11、レッスン 1 です。これは しつもん です。こたえ を えらびます。','Dit is Level 11, les 1. Dit is een vraag. Ik kies het antwoord.','レベル じゅういち、レッスン いち です。これわ しつもん です。こたえ お えらびます。',[question('こたえ を えらびます。','het antwoord kiezen','de vraag lezen','opnieuw luisteren'),question('これは しつもん です。','Dit is een vraag.','Dit is een antwoord.','Dit is een les.')]),
      B:part('もんだい：これは パン です。\nただしい こたえ：○\nまちがい：×\nまちがい を もういちど みます。','Opgave: dit is brood. Juist antwoord: cirkel. Fout: kruis. Ik bekijk de fout nog eens.','もんだい、これわ パン です。ただしい こたえ、まる。まちがい、ばつ。まちがい お もういちど みます。',[question('ただしい こたえ は？','○','×','→'),question('まちがい を もういちど みます。','de fout nog eens bekijken','het juiste antwoord kiezen','de les beginnen')],'app-screen')
    },
    'l11-home-2':{
      canDo:'Een korte Japanse leesinstructie volgen en een woord in een zin vinden.',
      A:part('せつめい を よみます。これは ぶん です。ことば の いみ を みつけます。','Ik lees de uitleg. Dit is een zin. Ik vind de betekenis van het woord.','せつめい お よみます。これわ ぶん です。ことば の いみ お みつけます。',[question('ぶん を よみます。','de zin lezen','de zin schrijven','naar de zin luisteren'),question('ことば の いみ を みつけます。','de betekenis vinden','woorden in volgorde zetten','nog een keer luisteren')]),
      B:part('ページ 1\nタイトル：パン\nよんでください：これ は パン です。\nことば：パン\nしるし：○','Pagina 1. Titel: brood. Lees: dit is brood. Woord: brood. Teken: cirkel.','ページ いち。タイトル、パン。よんでください。これ わ パン です。ことば、パン。しるし、まる。',[question('ことば は？','パン','ねこ','みず'),question('よんでください。','Lees de zin.','Kies het geluid.','Schrijf het nummer.')],'lesson-page')
    },
    'l11-home-3':{
      canDo:'Luister- en invulinstructies begrijpen en het juiste woord of symbool aanwijzen.',
      note:'きいてください is de luisterinstructie. In een mededeling herken je ききます: ik luister. Je hoeft de vormverandering nog niet zelf te maken.',
      A:part('おんせい を きいてください。ゆっくり ききます。おと を くりかえします。','Luister naar de audio. Ik luister langzaam. Ik herhaal het geluid.','おんせい お きいてください。ゆっくり ききます。おと お くりかえします。',[question('おんせい を きいてください。','Luister naar de audio.','Lees de titel.','Kies de afbeelding.'),question('ゆっくり ききます。','langzaam luisteren','snel schrijven','alles lezen')]),
      B:part('ことば：おと\nくうらん：＿＿\nうめてください。\nきごう：まる ○\nこたえ を かいてください。','Woord: geluid. Open vak: __. Vul in. Symbool: cirkel. Schrijf het antwoord (hier met een tik).','ことば、おと。くうらん。うめてください。きごう、まる。こたえ お かいてください。',[question('くうらん を うめてください。ことば は？','おと','パン','いぬ'),question('まる は？','○','×','→')],'fill-card')
    },
    'l11-home-4':{
      canDo:'Een korte volgorde van Japanse instructies volgen en controleren.',
      A:part('じゅんばん です。さいしょ に ぶん を よみます。つぎ は こたえ です。ことば を ならべます。これで おわり です。','Dit is de volgorde. Eerst lees ik de zin. Daarna komt het antwoord. Ik zet de woorden in volgorde. Dat is het einde.','じゅんばん です。さいしょ に ぶん お よみます。つぎ わ こたえ です。ことば お ならべます。これで おわり です。',[question('さいしょ は？','ぶん を よみます。','ことば を ならべます。','これで おわり です。'),question('つぎ は？','こたえ','ぶん','おわり')]),
      B:part('さいしょ：れんしゅう を はじめます。\nつぎ：ぜんぶ よみます。\nあと：こたえ を かくにん します。\nつぎ：れんしゅう を すすめます。','Eerst begin ik de oefening. Daarna lees ik alles. Vervolgens controleer ik het antwoord. Dan ga ik verder met de oefening.','さいしょ、れんしゅう お はじめます。つぎ、ぜんぶ よみます。あと、こたえ お かくにん します。つぎ、れんしゅう お すすめます。',[question('ぜんぶ よみます。','alles lezen','alleen de titel lezen','het geluid herhalen'),question('こたえ を かくにん します。','het antwoord controleren','de les beginnen','woorden in volgorde zetten')],'instruction-plan')
    },
    'l11-home-5':{
      canDo:'Een eenvoudig vertrekplan lezen met bekende dag-, tijd- en vervoerswoorden.',
      reuse:{A:['vocab-りょこう','vocab-じゅんび','vocab-ひこうき'],B:['vocab-えき','vocab-でんしゃ','vocab-ちず']},
      integrationModels:[['ごぜん しちじ に えき に いきます。','ごぜん しちじ に えき に いきます。','Ik ga om zeven uur in de ochtend naar het station.']],
      A:part('あした は げつようび です。りょこう の じゅんび です。これは わたし の ちず です。ごぜん しちじ に えき に いきます。でんしゃ に のります。つぎ は ひこうき です。','Morgen is het maandag. Dit is de reisvoorbereiding. Dit is mijn kaart. Om zeven uur in de ochtend ga ik naar het station. Ik neem de trein. Daarna komt het vliegtuig.','あした わ げつようび です。りょこう の じゅんび です。これわ わたし の ちず です。ごぜん しちじ に えき に いきます。でんしゃ に のります。つぎ わ ひこうき です。',[question('あした は？','げつようび','きんようび','にちようび'),question('ごぜん しちじ に どこ に いきます か。','えき','みせ','こうえん')]),
      B:part('りょこう の じゅんび\nさいしょ：ちず を みます。\nげつようび 7:00：えき に いきます。\nつぎ：でんしゃ に のります。\nおわり：こたえ を かくにん します。','Reisvoorbereiding. Eerst: de kaart bekijken. Maandag 7:00: naar het station. Daarna: de trein nemen. Tot slot: het antwoord controleren.','りょこう の じゅんび。さいしょ、ちず お みます。げつようび しちじ、えき に いきます。つぎ、でんしゃ に のります。おわり、こたえ お かくにん します。',[question('さいしょ は？','ちず を みます。','でんしゃ に のります。','こたえ を かくにん します。'),question('えき に いきます。なんじ です か。','7:00','10:00','19:00')],'travel-plan')
    }
  });
  Object.assign(revisions,{
    'l12-1':{canDo:'Op een aankomstbord terminal, uitgang en informatiepunt vinden.',
      A:part('ひこうき で にほん に つきました。ここ は くうこう です。とうちゃく ターミナル は 2 です。','Ik ben met het vliegtuig in Japan aangekomen. Hier is de luchthaven. De aankomstterminal is 2.','ひこうき で にほん に つきました。ここ わ くうこう です。とうちゃく ターミナル わ に です。',[question('とうちゃく ターミナル は？','2','1','3'),question('どこ に つきました か。','にほん','えき','こうえん')]),
      B:part('あんないばん\nとうちゃく：ターミナル 2\nでぐち →\nあんないじょ ←\nいりぐち ↑\nひょうじ を みます。','Informatiebord. Aankomst: terminal 2. Uitgang rechts. Informatiebalie links. Ingang rechtdoor. Ik bekijk de aanduidingen.','あんないばん。とうちゃく、ターミナル に。でぐち、みぎ。あんないじょ、ひだり。いりぐち、まっすぐ。ひょうじ お みます。',[question('でぐち は？','みぎ','ひだり','うえ'),question('あんないじょ は？','ひだり','みぎ','した')],'sign')},
    'l12-2':{canDo:'De paspoortcontrole en de richting naar de bagage herkennen.',
      A:part('こちら は にゅうこく てつづき です。パスポート は ここ です。ゆっくり すすみます。ここ で ならびます。','Deze kant is de immigratieprocedure. Het paspoort is hier. Ik ga langzaam verder. Hier sta ik in de rij.','こちら わ にゅうこく てつづき です。パスポート わ ここ です。ゆっくり すすみます。ここ で ならびます。',[question('こちら は？','にゅうこく てつづき','りょこう の じゅんび','でんしゃ の じかん'),question('パスポート は？','ここ','えき','みせ')]),
      B:part('ゆか の ゆうどう\nにゅうこく →\nにもつ ↓\nこちら に すすみます。','Vloerbewegwijzering. Immigratie rechts. Bagage beneden. Ik ga deze kant op.','ゆか の ゆうどう。にゅうこく、みぎ。にもつ、した。こちら に すすみます。',[question('にもつ は？','した','うえ','ひだり'),question('にゅうこく は？','みぎ','ひだり','うえ')],'floor-guide')},
    'l12-3':{canDo:'Het juiste bagagebandnummer lezen en een tas aan kleur en grootte herkennen.',
      note:'くろ is de kleur zwart; vóór かばん zie je くろい. Zo wordt あか vóór かばん: あかい. Herken deze twee vormen in de voorbeelden.',
      A:part('ベルト の ばんごう は 5 です。5ばん の ベルト です。ベルト で にもつ を うけとります。','Het nummer van de bagageband is 5. Het is band nummer 5. Bij de band neem ik mijn bagage in ontvangst.','ベルト の ばんごう わ ご です。ごばん の ベルト です。ベルト で にもつ お うけとります。',[question('ベルト の ばんごう は？','5','3','2'),question('ベルト で うけとります。','にもつ','パスポート','ちず')]),
      B:part('にもつ\nおおきい かばん：くろい\nちいさい かばん：あかい\nわたし の かばん は おおきい です。くろい かばん です。','Bagage. Grote tas: zwart. Kleine tas: rood. Mijn tas is groot. Het is een zwarte tas.','にもつ。おおきい かばん、くろい。ちいさい かばん、あかい。わたし の かばん わ おおきい です。くろい かばん です。',[question('わたし の かばん の いろ は？','くろ','あか'),question('わたし の かばん は？','おおきい','ちいさい')],'baggage-label')},
    'l12-4':{canDo:'Na de aankomst de uitgang, ontmoetingsplek en vertrektijd vinden.',
      A:part('にゅうこく てつづき は しゅうりょう です。にもつ は ここ です。でぐち は みぎ です。そと に いきます。しゅっぱつ は ごご いちじはん です。','De immigratieprocedure is klaar. De bagage is hier. De uitgang is rechts. Ik ga naar buiten. Het vertrek is om half twee in de middag.','にゅうこく てつづき わ しゅうりょう です。にもつ わ ここ です。でぐち わ みぎ です。そと に いきます。しゅっぱつ わ ごご いちじはん です。',[question('でぐち は？','みぎ','ひだり','した'),question('にゅうこく てつづき は？','しゅうりょう','じゅんび','もういちど')]),
      B:part('おむかえ：A\nまちあわせ：A\nタクシー・バス のりば →\nまどぐち：ホテル\nしゅっぱつ：13:30\nここ で まちます。','Ophalen: A. Afspraakplek: A. Taxi- en bushalte rechts. Balie: hotel. Vertrek 13:30. Ik wacht hier.','おむかえ、エー。まちあわせ、エー。タクシー、バス のりば、みぎ。まどぐち、ホテル。しゅっぱつ、ごご いちじはん。ここ で まちます。',[question('おむかえ は？','A','B','C'),question('しゅっぱつ は？','13:30','13:00','15:30')],'pickup-board')},
    'l12-5':{canDo:'Een eenvoudige aankomst van terminal tot ontmoetingsplek zelfstandig volgen.',
      integrationModels:[['パスポート と にもつ を かくにん します。','パスポート と にもつ お かくにん します。','Ik controleer paspoort en bagage.']],
      A:part('にほん に つきました。ここ は くうこう です。ひこうじょう も くうこう の ことば です。パスポート を かくにん します。5ばん の ベルト で にもつ を うけとります。でぐち は みぎ です。そと の A で ともだち が まちます。','Ik ben in Japan aangekomen. Hier is de luchthaven. ひこうじょう is ook een woord voor vliegveld. Ik controleer het paspoort. Bij band 5 haal ik mijn bagage op. De uitgang is rechts. Buiten bij A wacht mijn vriend.','にほん に つきました。ここ わ くうこう です。ひこうじょう も くうこう の ことば です。パスポート お かくにん します。ごばん の ベルト で にもつ お うけとります。でぐち わ みぎ です。そと の エー で ともだち が まちます。',[question('にもつ は？','5ばん の ベルト','2ばん の ベルト','3ばん の ベルト'),question('ともだち は どこ です か。','そと の A','ターミナル 2','あんないじょ')]),
      B:part('とうちゃく：ターミナル 2\nにゅうこく：しゅうりょう\nにもつ：ベルト 5\nでぐち →\nおむかえ：A\nホテル：でんしゃ','Aankomst: terminal 2. Immigratie: klaar. Bagage: band 5. Uitgang rechts. Ophalen: A. Hotel: trein.','とうちゃく、ターミナル に。にゅうこく、しゅうりょう。にもつ、ベルト ご。でぐち、みぎ。おむかえ、エー。ホテル、でんしゃ。',[question('でぐち は？','みぎ','ひだり','した'),question('ホテル に いきます。','でんしゃ','バス','タクシー')],'arrival-plan')},
    'l13-1':{canDo:'Een route van luchthaven naar hotel en het juiste spoor op een ticket herkennen.',
      A:part('くうこう から ホテル まで いきます。でんしゃ に のります。えき で おります。ホテル に つきます。','Ik ga van de luchthaven naar het hotel. Ik neem de trein. Ik stap uit bij het station. Ik kom bij het hotel aan.','くうこう から ホテル まで いきます。でんしゃ に のります。えき で おります。ホテル に つきます。',[question('どこ から いきます か。','くうこう','ホテル','みせ'),question('どこ に つきます か。','ホテル','こうえん','あんないじょ')]),
      B:part('きっぷ\nいきさき：ホテル\nばんせん：3\nのりかえ：えき','Ticket. Bestemming: hotel. Spoor: 3. Overstappen: station.','きっぷ。いきさき、ホテル。ばんせん、さん。のりかえ、えき。',[question('ばんせん は？','3','2','5'),question('いきさき は？','ホテル','くうこう','みせ')],'ticket')},
    'l13-2':{canDo:'Een enkele reis kiezen, het aantal kaartjes aangeven en een eenvoudige prijs lezen.',
      note:'Een prijs is een getal + えん: ごひゃくえん = 500 yen. ひとつ ください ken je al: één graag. De getallen blijven dezelfde bouwstenen.',
      A:part('きっぷ を ひとつ ください。かたみち です。おとな です。500えん です。','Eén kaartje graag. Een enkele reis. Voor een volwassene. Het kost 500 yen.','きっぷ お ひとつ ください。かたみち です。おとな です。ごひゃくえん です。',[question('おとな の きっぷ は？','500えん','300えん','100えん'),question('かたみち は？','enkele reis','heen en terug','overstappen')]),
      B:part('まどぐち\nおとな：500えん\nこども：300えん\nきっぷ を ひとつ ください。\nタクシー：うんてんしゅ','Loket. Volwassene: 500 yen. Kind: 300 yen. Eén kaartje graag. Taxi: chauffeur.','まどぐち。おとな、ごひゃくえん。こども、さんびゃくえん。きっぷ お ひとつ ください。タクシー、うんてんしゅ。',[question('こども の きっぷ は？','300えん','500えん','100えん'),question('きっぷ を ひとつ ください。','één kaartje','twee kaartjes','drie kaartjes')],'fare-board')},
    'l13-3':{canDo:'Een korte looproute en informatie over metro en eindhalte begrijpen.',
      A:part('まっすぐ いきます。かいだん の まえ で ひだり に まがります。えき は そこ です。','Ik ga rechtdoor. Vóór de trap sla ik linksaf. Het station is daar.','まっすぐ いきます。かいだん の まえ で ひだり に まがります。えき わ そこ です。',[question('どこ で まがります か。','かいだん の まえ','ホテル の なか','でんしゃ の なか'),question('どちら に まがります か。','ひだり','みぎ','まっすぐ')]),
      B:part('ちか：ちかてつ いりぐち ↓\nちじょう：でぐち →\nバス おりば：ホテルまえ\nしゅうてん：ホテルまえ','Ondergronds: metro-ingang beneden. Bovengronds: uitgang rechts. Uitstaphalte bus: Hotelmae. Eindhalte: Hotelmae.','ちか、ちかてつ いりぐち、した。ちじょう、でぐち、みぎ。バス おりば、ホテルまえ。しゅうてん、ホテルまえ。',[question('ちじょう の でぐち は？','みぎ','ひだり','した'),question('しゅうてん は？','ホテルまえ','くうこう','えき')],'route-map')},
    'l13-4':{canDo:'Vertrektijden vergelijken en bestemming, spoor en vertraging op een bord lezen.',
      note:'じ en ふん zijn de bekende uur- en minutenbouwstenen. Op een bord is ホテルいき een kort label: richting hotel. Herken いき hier bij het bekende いきます.',
      A:part('しゅっぱつ の じかん を みます。でんしゃ は 10じ15ふん に でます。バス は 11じ に でます。でんしゃ の しゅっぱつ は はやい です。バス は おそい です。','Ik bekijk de vertrektijd. De trein vertrekt om 10:15. De bus vertrekt om 11:00. De trein vertrekt vroeg. De bus is later.','しゅっぱつ の じかん お みます。でんしゃ わ じゅうじ じゅうごふん に でます。バス わ じゅういちじ に でます。でんしゃ の しゅっぱつ わ はやい です。バス わ おそい です。',[question('でんしゃ の しゅっぱつ は？','10:15','11:00','10:50'),question('しゅっぱつ が はやい の は？','でんしゃ','バス')]),
      B:part('ホテルいき\nしゅっぱつ：10:15\nばん：3\nおくれ：0ふん','Richting hotel. Vertrek: 10:15. Nummer: 3. Vertraging: 0 minuten.','ホテルいき。しゅっぱつ、じゅうじ じゅうごふん。ばん、さん。おくれ、ゼロふん。',[question('おくれ は？','0ふん','15ふん','30ふん'),question('ばん は？','3','2','5')],'departure-board')},
    'l13-5':{canDo:'Een complete eenvoudige reis met trein, overstap en bus naar het hotel volgen.',
      integrationModels:[['えき で バス に のりかえ です。','えき で バス に のりかえ です。','Op het station is de overstap naar de bus.']],
      A:part('くうこう から ホテル まで いきます。きっぷ は 500えん です。10じ15ふん に でんしゃ に のります。えき で おります。つぎ は バス です。11じ に バス に のります。ホテルまえ で おります。ホテル に つきます。','Ik ga van de luchthaven naar het hotel. Het kaartje kost 500 yen. Om 10:15 neem ik de trein. Ik stap uit bij het station. Daarna komt de bus. Om 11:00 neem ik de bus. Ik stap uit bij Hotelmae. Ik kom bij het hotel aan.','くうこう から ホテル まで いきます。きっぷ わ ごひゃくえん です。じゅうじ じゅうごふん に でんしゃ に のります。えき で おります。つぎ わ バス です。じゅういちじ に バス に のります。ホテルまえ で おります。ホテル に つきます。',[question('でんしゃ の あと は？','バス','タクシー','ひこうき'),question('ホテルまえ で？','おります','のります','よみます')]),
      B:part('くうこう → えき\nでんしゃ：3ばんせん 10:15\nえき → ホテルまえ\nバス：11:00\nおりば：ホテルまえ\nしゅうてん：ホテルまえ','Luchthaven naar station. Trein: spoor 3, 10:15. Station naar Hotelmae. Bus: 11:00. Uitstaphalte en eindhalte: Hotelmae.','くうこう から えき。でんしゃ、さんばんせん、じゅうじ じゅうごふん。えき から ホテルまえ。バス、じゅういちじ。おりば、ホテルまえ。しゅうてん、ホテルまえ。',[question('バス は なんじ です か。','11:00','10:15','13:30'),question('おりば は？','ホテルまえ','くうこう','あんないじょ')],'journey-card')}
  });
  Object.assign(revisions,{
    'l14-1':{canDo:'Een reservering aangeven en de juiste gegevens voor het inchecken herkennen.',
      A:part('ホテル に ひとばん とまります。フロント に いきます。よやく が あります。なまえ を かくにん します。','Ik verblijf één nacht in het hotel. Ik ga naar de receptie. Ik heb een reservering. Ik controleer de naam.','ホテル に ひとばん とまります。フロント に いきます。よやく が あります。なまえ お かくにん します。',[question('ホテル に とまります。','ひとばん','ひとつ','ひとり'),question('よやく が あります。','Ik heb een reservering.','Ik zoek de uitgang.','Ik heb een kaartje.')]),
      B:part('よやくばんごう：215\nなまえ：＿＿\nパスポート を みせてください。\nかくにん を おねがいします。','Reserveringsnummer: 215. Naam: __. Laat uw paspoort zien. Graag controleren.','よやくばんごう、にひゃくじゅうご。なまえ。パスポート お みせてください。かくにん お おねがいします。',[question('みせてください。','パスポート','きっぷ','ちず'),question('よやくばんごう は？','215','305','500')],'check-in-form')},
    'l14-2':{canDo:'Kamernummer en verdieping vinden en een sleutelkaart herkennen.',
      A:part('へや の ばんごう は 305 です。3かい です。エレベーター で 3かい に いきます。','Het kamernummer is 305. Het is op de derde verdieping. Ik ga met de lift naar de derde verdieping.','へや の ばんごう わ さんびゃくご です。さんがい です。エレベーター で さんがい に いきます。',[question('へや の ばんごう は？','305','215','500'),question('へや は？','3かい','1かい','2かい')]),
      B:part('へや：305\nかぎ：カード\nカード を つかいます。\nドア は ひらきます。','Kamer 305. Sleutel: kaart. Ik gebruik de kaart. De deur gaat open.','へや、さんびゃくご。かぎ、カード。カード お つかいます。ドア わ ひらきます。',[question('かぎ は？','カード','きっぷ','ちず'),question('カード を つかいます。ドア は？','ひらきます','しめます')],'key-card')},
    'l14-3':{canDo:'Een handdoek lenen en toilet, ontbijt en hotelvoorzieningen vinden.',
      note:'タオル が あります: er is een handdoek. Bij かりる herken je in de beleefde zin かります. Herken deze vorm nu; een volledig werkwoordschema is niet nodig.',
      A:part('トイレ は こちら です。タオル が あります。タオル を かります。','Het toilet is deze kant op. Er is een handdoek. Ik leen een handdoek.','トイレ わ こちら です。タオル が あります。タオル お かります。',[question('かります。','タオル','ホテル','トイレ'),question('トイレ は？','こちら','ちか','くうこう')]),
      B:part('じどうはんばいき →\nかいだん ↑\nきんえん\nあさごはん：7:00\nみず が ひつよう です。ちかく の みせ を さがします。','Drankautomaat rechts. Trap omhoog. Niet roken. Ontbijt: 7:00. Ik heb water nodig. Ik zoek een winkel in de buurt.','じどうはんばいき、みぎ。かいだん、うえ。きんえん。あさごはん、しちじ。みず が ひつよう です。ちかく の みせ お さがします。',[question('きんえん','niet roken','uitgang','open'),question('あさごはん は？','7:00','10:00','19:00')],'hotel-guide')},
    'l14-4':{canDo:'Bagage in bewaring geven en openings- en sluitingstijden lezen.',
      note:'あずけます: de gast geeft iets in bewaring. あずかります: de medewerker bewaart het. できます betekent dat iets kan; leer dit als korte bekende vorm, zonder een nieuw lang zinsbouwpatroon.',
      A:part('にもつ を あずけます。おねがいします。フロント で あずかります。あとで にもつ を うけとります。ここ で れんしゅう が できます。','Ik geef mijn bagage in bewaring. Alstublieft. Bij de receptie neemt men die in bewaring. Later haal ik de bagage op. Hier kun je oefenen.','にもつ お あずけます。おねがいします。フロント で あずかります。あとで にもつ お うけとります。ここ で れんしゅう が できます。',[question('にもつ を あずけます。','de gast geeft bagage in bewaring','de gast haalt bagage op','de chauffeur verkoopt een kaartje'),question('あとで にもつ を？','うけとります','よみます','かきます')]),
      B:part('フロント\nあさ 7じ から よる 10じ まで あいています。\nよる 10じ に しめます。','Receptie. Open van zeven uur in de ochtend tot tien uur in de avond. Sluit om tien uur in de avond.','フロント。あさ しちじ から よる じゅうじ まで あいています。よる じゅうじ に しめます。',[question('あさ なんじ から？','7:00','10:00','22:00'),question('よる なんじ に しめます か。','22:00','7:00','10:00')],'opening-hours')},
    'l14-5':{canDo:'Een eenvoudige hotelkaart gebruiken voor kamer, ontbijt en voorzieningen.',
      integrationModels:[['あさごはん は しちじ です。','あさごはん わ しちじ です。','Het ontbijt is om zeven uur.'],['よやくばんごう を かくにん します。','よやくばんごう お かくにん します。','Ik controleer het reserveringsnummer.']],
      A:part('ホテル に つきます。ひとばん とまります。フロント で よやく を かくにん します。へや は 3かい です。カード を つかいます。あさごはん は しちじ です。みず が ひつよう です。じどうはんばいき は みぎ です。','Ik kom bij het hotel aan en verblijf één nacht. Bij de receptie controleer ik de reservering. De kamer is op de derde verdieping. Ik gebruik de kaart. Het ontbijt is om zeven uur. Ik heb water nodig. De drankautomaat is rechts.','ホテル に つきます。ひとばん とまります。フロント で よやく お かくにん します。へや わ さんがい です。カード お つかいます。あさごはん わ しちじ です。みず が ひつよう です。じどうはんばいき わ みぎ です。',[question('へや は？','3かい','1かい','2かい'),question('あさごはん は？','7:00','10:00','22:00')]),
      B:part('ホテル\nよやくばんごう：215\nへや：305・3かい\nあさごはん：7:00\nみず：じどうはんばいき →\nちかく の みせ ←','Hotelkaart. Reservering 215. Kamer 305, derde verdieping. Ontbijt 7:00. Water: drankautomaat rechts. Winkel in de buurt links.','ホテル。よやくばんごう、にひゃくじゅうご。へや、さんびゃくご、さんがい。あさごはん、しちじ。みず、じどうはんばいき、みぎ。ちかく の みせ、ひだり。',[question('みず は どこ です か。','じどうはんばいき','かいだん','エレベーター'),question('ちかく の みせ は？','ひだり','みぎ','うえ')],'hotel-card')}
  });
  const examples={
    'レベル':['これは レベル 11 です。','これわ レベル じゅういち です。','Dit is Level 11.'],
    'レッスン':['これは レッスン 1 です。','これわ レッスン いち です。','Dit is les 1.'],
    'しつもん':['これは しつもん です。','これわ しつもん です。','Dit is een vraag.'],
    'こたえ':['これは こたえ です。','これわ こたえ です。','Dit is een antwoord.'],
    'えらびます':['こたえ を えらびます。','こたえ お えらびます。','Ik kies een antwoord.'],
    'れんしゅう':['これは れんしゅう です。','これわ れんしゅう です。','Dit is een oefening.'],
    'ただしい':['こたえ は ただしい です。','こたえ わ ただしい です。','Het antwoord is juist.'],
    'まちがい':['これは まちがい です。','これわ まちがい です。','Dit is een fout.'],
    'もういちど':['もういちど こたえ を みます。','もういちど こたえ お みます。','Ik bekijk het antwoord nog eens.'],
    'みつけます':['ことば の いみ を みつけます。','ことば の いみ お みつけます。','Ik vind de betekenis van het woord.'],
    'よんでください':['ぶん を よんでください。','ぶん お よんでください。','Lees de zin.'],
    'きいてください':['おんせい を きいてください。','おんせい お きいてください。','Luister naar de audio.'],
    'ゆっくり':['ゆっくり ぶん を よみます。','ゆっくり ぶん お よみます。','Ik lees de zin langzaam.'],
    'くりかえします':['おと を くりかえします。','おと お くりかえします。','Ik herhaal het geluid.'],
    'うめてください':['くうらん を うめてください。','くうらん お うめてください。','Vul het open vak in.'],
    'かいてください':['こたえ を かいてください。','こたえ お かいてください。','Schrijf het antwoord. In de oefening kies je het met een tik.'],
    'まる':['きごう は まる です。','きごう わ まる です。','Het symbool is een cirkel.'],
    'じゅんばん':['これは じゅんばん です。','これわ じゅんばん です。','Dit is de volgorde.'],
    'ならべます':['ことば を ならべます。','ことば お ならべます。','Ik zet de woorden in volgorde.'],
    'さいしょ':['さいしょ に ぶん を よみます。','さいしょ に ぶん お よみます。','Eerst lees ik de zin.'],
    'つぎ':['つぎ は こたえ です。','つぎ わ こたえ です。','Daarna komt het antwoord.'],
    'おわり':['これで おわり です。','これで おわり です。','Dit is het einde.'],
    'ぜんぶ':['ぜんぶ よみます。','ぜんぶ よみます。','Ik lees alles.'],
    'あと':['れんしゅう の あと です。','れんしゅう の あと です。','Het is na de oefening.'],
    'すすめます':['れんしゅう を すすめます。','れんしゅう お すすめます。','Ik ga verder met de oefening.'],
    'はじめます':['れんしゅう を はじめます。','れんしゅう お はじめます。','Ik begin met de oefening.'],
    'かくにん':['こたえ を かくにん します。','こたえ お かくにん します。','Ik controleer het antwoord.'],
    'りょこう':['これは りょこう の じゅんび です。','これわ りょこう の じゅんび です。','Dit is de voorbereiding van de reis.'],
    'じゅんび':['これは りょこう の じゅんび です。','これわ りょこう の じゅんび です。','Dit is de voorbereiding van de reis.'],
    'ひこうき':['これは ひこうき です。','これわ ひこうき です。','Dit is een vliegtuig.'],
    'にほん':['ここ は にほん です。','ここ わ にほん です。','Hier is Japan.'],
    'くうこう':['ここ は くうこう です。','ここ わ くうこう です。','Hier is de luchthaven.'],
    'とうちゃく':['とうちゃく は ごご いちじ です。','とうちゃく わ ごご いちじ です。','De aankomst is om één uur in de middag.'],
    'ターミナル':['ここ は ターミナル です。','ここ わ ターミナル です。','Hier is de terminal.'],
    'つきました':['にほん に つきました。','にほん に つきました。','Ik ben aangekomen in Japan.'],
    'こちら':['でぐち は こちら です。','でぐち わ こちら です。','De uitgang is deze kant op.'],
    'しゅっぱつ':['しゅっぱつ は ごご いちじ です。','しゅっぱつ わ ごご いちじ です。','Het vertrek is om één uur in de middag.'],
    'にもつ':['これは わたし の にもつ です。','これわ わたし の にもつ です。','Dit is mijn bagage.'],
    'にゅうこく':['これは にゅうこく てつづき です。','これわ にゅうこく てつづき です。','Dit is de immigratieprocedure.'],
    'てつづき':['これは にゅうこく てつづき です。','これわ にゅうこく てつづき です。','Dit is de immigratieprocedure.'],
    'すすみます':['こちら に すすみます。','こちら に すすみます。','Ik ga deze kant op.'],
    'ならびます':['ここ で ならびます。','ここ で ならびます。','Ik sta hier in de rij.'],
    'うけとります':['にもつ を うけとります。','にもつ お うけとります。','Ik neem mijn bagage in ontvangst.'],
    'ばんごう':['ばんごう は 5 です。','ばんごう わ ご です。','Het nummer is vijf.'],
    'おおきい':['おおきい かばん です。','おおきい かばん です。','Het is een grote tas.'],
    'ちいさい':['ちいさい かばん です。','ちいさい かばん です。','Het is een kleine tas.'],
    'くろ':['くろい かばん です。','くろい かばん です。','Het is een zwarte tas. くろ wordt vóór かばん: くろい.'],
    'あか':['あかい かばん です。','あかい かばん です。','Het is een rode tas. あか wordt vóór かばん: あかい.'],
    'しゅうりょう':['てつづき は しゅうりょう です。','てつづき わ しゅうりょう です。','De procedure is afgerond.'],
    'まちます':['でぐち で ともだち を まちます。','でぐち で ともだち お まちます。','Ik wacht bij de uitgang op een vriend.'],
    'ホテル':['ホテル に いきます。','ホテル に いきます。','Ik ga naar het hotel.'],
    'つきます':['ホテル に つきます。','ホテル に つきます。','Ik kom bij het hotel aan.'],
    'のりかえ':['えき で のりかえ です。','えき で のりかえ です。','Op het station is de overstap.'],
    'いきさき':['いきさき は ホテル です。','いきさき わ ホテル です。','De bestemming is het hotel.'],
    'ばんせん':['3ばんせん です。','さんばんせん です。','Het is spoor drie.'],
    'えん':['500えん です。','ごひゃくえん です。','Het kost 500 yen.'],
    'かたみち':['きっぷ は かたみち です。','きっぷ わ かたみち です。','Het kaartje is een enkele reis.'],
    'おとな':['おとな の きっぷ です。','おとな の きっぷ です。','Het is een kaartje voor een volwassene.'],
    'うんてんしゅ':['タクシー の うんてんしゅ です。','タクシー の うんてんしゅ です。','Het is de taxichauffeur.'],
    'まがります':['ひだり に まがります。','ひだり に まがります。','Ik sla linksaf.'],
    'かいだん':['かいだん は みぎ です。','かいだん わ みぎ です。','De trap is rechts.'],
    'ちか':['ちか に いきます。','ちか に いきます。','Ik ga ondergronds.'],
    'ちじょう':['ちじょう に いきます。','ちじょう に いきます。','Ik ga naar bovengronds.'],
    'ちかてつ':['ちかてつ に のります。','ちかてつ に のります。','Ik neem de metro.'],
    'おりば':['おりば は ホテルまえ です。','おりば わ ホテルまえ です。','De uitstapplek is Hotelmae.'],
    'しゅうてん':['しゅうてん は ホテルまえ です。','しゅうてん わ ホテルまえ です。','De eindhalte is Hotelmae.'],
    'ホテルまえ':['ホテルまえ で おります。','ホテルまえ で おります。','Ik stap uit bij de halte voor het hotel.'],
    'でます':['でんしゃ は じゅうじ に でます。','でんしゃ わ じゅうじ に でます。','De trein vertrekt om tien uur.'],
    'はやい':['でんしゃ の しゅっぱつ は はやい です。','でんしゃ の しゅっぱつ わ はやい です。','Het vertrek van de trein is vroeg.'],
    'おそい':['バス の しゅっぱつ は おそい です。','バス の しゅっぱつ わ おそい です。','Het vertrek van de bus is laat.'],
    'じ':['じゅうじ です。','じゅうじ です。','Het is tien uur; じ is de al bekende uurbouwsteen.'],
    'ふん':['じゅうごふん です。','じゅうごふん です。','Het is vijftien minuten; ふん is de bekende minutenbouwsteen.'],
    'じかん':['しゅっぱつ の じかん です。','しゅっぱつ の じかん です。','Het is de vertrektijd.'],
    'おくれ':['おくれ は 0ふん です。','おくれ わ ゼロふん です。','De vertraging is nul minuten.'],
    'ばん':['ばんごう は 3ばん です。','ばんごう わ さんばん です。','Het nummer is drie.'],
    'フロント':['フロント に いきます。','フロント に いきます。','Ik ga naar de receptie.'],
    'よやく':['よやく が あります。','よやく が あります。','Ik heb een reservering.'],
    'あります':['よやく が あります。','よやく が あります。','Er is een reservering. が wijst aan wat er is.'],
    'なまえ':['なまえ を かいてください。','なまえ お かいてください。','Schrijf de naam. In de oefening kies je een veld met een tik.'],
    'みせます':['パスポート を みせます。','パスポート お みせます。','Ik laat mijn paspoort zien.'],
    'よやくばんごう':['これは よやくばんごう です。','これわ よやくばんごう です。','Dit is het reserveringsnummer.'],
    'おねがいします':['かくにん を おねがいします。','かくにん お おねがいします。','Graag de bevestiging/controleren, alstublieft.'],
    'とまります':['ホテル に ひとばん とまります。','ホテル に ひとばん とまります。','Ik verblijf één nacht in het hotel.'],
    'ひとばん':['ホテル に ひとばん とまります。','ホテル に ひとばん とまります。','Ik verblijf één nacht in het hotel.'],
    'へや':['へや は 3かい です。','へや わ さんがい です。','De kamer is op de derde verdieping.'],
    'かい':['へや は 3かい です。','へや わ さんがい です。','3かい lees je さんがい: derde verdieping.'],
    'エレベーター':['エレベーター で 3かい に いきます。','エレベーター で さんがい に いきます。','Ik ga met de lift naar de derde verdieping.'],
    'かぎ':['これは へや の かぎ です。','これわ へや の かぎ です。','Dit is de kamersleutel.'],
    'カード':['これは へや の カード です。','これわ へや の カード です。','Dit is de kaart voor de kamer; hier is het de sleutelkaart.'],
    'つかいます':['カード を つかいます。','カード お つかいます。','Ik gebruik de kaart.'],
    'ひらきます':['ドア は ひらきます。','ドア わ ひらきます。','De deur gaat open.'],
    'トイレ':['トイレ は こちら です。','トイレ わ こちら です。','Het toilet is deze kant op.'],
    'かりる':['タオル を かります。','タオル お かります。','Ik leen een handdoek. In deze beleefde zin wordt かりる: かります.'],
    'タオル':['タオル が あります。','タオル が あります。','Er is een handdoek.'],
    'ひつよう':['みず が ひつよう です。','みず が ひつよう です。','Water is nodig; ik heb water nodig.'],
    'さがします':['ちかく の みせ を さがします。','ちかく の みせ お さがします。','Ik zoek een winkel in de buurt.'],
    'あさごはん':['あさごはん は しちじ です。','あさごはん わ しちじ です。','Het ontbijt is om zeven uur.'],
    'あずけます':['にもつ を あずけます。','にもつ お あずけます。','Ik geef bagage in bewaring: de gast spreekt.'],
    'あずかります':['にもつ を あずかります。','にもつ お あずかります。','Ik bewaar de bagage: de medewerker spreekt.'],
    'できます':['ここ で れんしゅう が できます。','ここ で れんしゅう が できます。','Hier kun je oefenen. できます betekent: het kan.'],
    'あとで':['あとで にもつ を うけとります。','あとで にもつ お うけとります。','Ik haal de bagage later op.'],
    'あさ':['あさ に フロント に いきます。','あさ に フロント に いきます。','Ik ga in de ochtend naar de receptie.'],
    'よる':['よる に フロント に いきます。','よる に フロント に いきます。','Ik ga in de avond naar de receptie.'],
    'あいています':['フロント は あいています。','フロント わ あいています。','De receptie is open. Herken あいています voorlopig als één vorm.'],
    'しめます':['ドア を しめます。','ドア お しめます。','Ik doe de deur dicht.']
  };
  function apply(m){
    const findLesson=(level,order)=>m.lessons.find(l=>l.level===level&&l.order===order),word=id=>m.vocabulary.find(w=>w.id===id),oldSources={};
    for(const w of m.vocabulary){const match=w.introducedAt?.match(/^(1[1-5])-(\d)-([AB])$/),l=match&&findLesson(Number(match[1]),Number(match[2]));if(l)oldSources[w.id]={level:l.level,lessonId:l.id,part:match[3],introducedAt:w.introducedAt}}
    const moves={
      'しゅっぱつ':'12-4-A','にもつ':'12-2-B','くうこう':'12-1-A','あんないじょ':'12-1-B','ひょうじ':'12-1-B','でぐち':'12-1-B','のりば':'12-4-B',
      'ひこうじょう':'12-5-A','こちら':'12-2-A','パスポート':'12-2-A','でます':'13-4-A','ホテル':'12-4-B','まちます':'12-4-B',
      'つきます':'13-1-A','のりかえ':'13-1-B','うんてんしゅ':'13-2-B','おりば':'13-3-B','しゅうてん':'13-3-B','ホテルまえ':'13-3-B','じかん':'13-4-A',
      'とまります':'14-1-A','ひとばん':'14-1-A','あさごはん':'14-3-B','ひつよう':'14-3-B','さがします':'14-3-B','できます':'14-4-A','えん':'13-2-A','ばん':'12-3-A'
    };
    for(const [jp,point] of Object.entries(moves)){const w=word(`vocab-${jp}`);w.introducedAt=w.availableFrom=point;w.lessonId=findLesson(Number(point.split('-')[0]),Number(point.split('-')[1])).id}
    // にほん already has a counter ID (two long objects): Japan is a distinct sense.
    if(!word('vocab-country-japan'))m.vocabulary.push({id:'vocab-country-japan',japanese:'にほん',reading:'にほん',romaji:'nihon',meaning:'Japan',meanings:['Japan'],partOfSpeech:'proper-noun',themes:['travel'],coreOrContext:'core',introducedAt:'12-1-A',availableFrom:'12-1-A',kanjiForm:null,kanjiIntroducedAt:null,audioId:null,source:'https://www.irodori.jpf.go.jp/assets/data/starter/pdf/X_L13.pdf'});
    word('vocab-country-japan').distinctSenseOf='vocab-にほん';
    word('vocab-country-japan').recallHint='Reiscontext: ひこうき で にほん に つきました。';
    word('vocab-にほん').recallHint='Telcontext: aantal lange voorwerpen.';
    m.didacticMigration={revision:1,wordSources:Object.fromEntries(Object.entries(oldSources).filter(([id,source])=>word(id).introducedAt!==source.introducedAt))};
    m.didacticSurfaceForms=[
      ['えらんでください','えらびます','11-1-B'],['します','かくにん','11-4-B'],['ききます','きいてください','11-3-A'],['これで','おわり','11-4-A'],
      ['くろい','くろ','12-3-B'],['あかい','あか','12-3-B'],['かります','かりる','14-3-A'],['みせてください','みせます','14-1-B'],['いき','いきます','13-4-B'],
      ['から','くうこう','13-1-A'],['まで','ホテル','13-1-A'],['が','あります','14-1-A'],['へ','いきます','12-1-A']
    ].map(([form,jp,introducedAt])=>({form,wordId:`vocab-${jp}`,introducedAt}));
    const adjective=['ただしい','おおきい','ちいさい','はやい','おそい','ひつよう'],adverb=['もういちど','ゆっくり','あとで'];
    adjective.forEach(jp=>word(`vocab-${jp}`).partOfSpeech='adjective');adverb.forEach(jp=>word(`vocab-${jp}`).partOfSpeech='adverb');
    for(const w of m.vocabulary)if(Number(w.introducedAt?.split('-')[0])>=11&&w.japanese.endsWith('ください'))w.partOfSpeech='request-phrase';word('vocab-かりる').partOfSpeech='verb';
    const firstGrammar=m.grammar.find(g=>g.id==='grammar-l11-home-1');firstGrammar.examples=['ただしい こたえ を えらんでください。'];firstGrammar.audioTextKana='てください';
    const range=m.grammar.find(g=>g.id==='grammar-l13-1');Object.assign(range,{title:'から … まで',symbol:'から … まで',shortExplanation:'から is het beginpunt; まで is het eindpunt. くうこう から ホテル まで: van de luchthaven tot het hotel. Je combineert dit met bekende vervoerswoorden.',fullExplanation:'Van A naar B: A から B まで. Richting へ ken je al; から en まで geven samen de grenzen van de route aan.',examples:['くうこう から ホテル まで']});
    const hotel=m.grammar.find(g=>g.id==='grammar-l14-1');Object.assign(hotel,{title:'N が あります',symbol:'が あります',shortExplanation:'Met N が あります zeg je dat iets er is. よやく が あります: er is een reservering / ik heb een reservering. Met か maak je er een vraag van. が wijst hier aan wat er is.',fullExplanation:'Gebruik een bekend zelfstandig naamwoord vóór が あります. In een vraag komt か achteraan: よやく が あります か。',examples:['よやく が あります。','よやく が あります か。']});
    range.audioTextKana='から まで';hotel.audioTextKana='が あります';
    const direction=m.grammar.find(g=>g.id==='grammar-l12-1');direction.examples=['でぐち へ いきます。'];
    for(const pattern of m.patterns){const grammar=m.grammar.find(g=>pattern.dependencies?.includes(g.id)&&['grammar-l11-home-1','grammar-l12-1','grammar-l13-1','grammar-l14-1'].includes(g.id));if(grammar)Object.assign(pattern,{title:grammar.title,template:grammar.symbol,examples:grammar.examples.slice()})}
    m.grammar.push({id:'grammar-l13-price',title:'Getal + えん',symbol:'えん',audioTextKana:'えん',introducedAt:'13-2-A',availableFrom:'13-2-A',shortExplanation:revisions['l13-2'].note,fullExplanation:revisions['l13-2'].note,examples:['500えん です。']});
    findLesson(13,2).grammarIds.push('grammar-l13-price');
    const choose=m.instructions.find(i=>i.id==='next-step');Object.assign(choose,{textJa:'つぎ',requiredVocabIds:['vocab-つぎ'],introducedAt:'11-4-A'});
    const level11=m.levels.find(l=>l.number===11);level11.nextDestinationVocabularyId='vocab-りょこう';
    for(const l of m.lessons.filter(l=>l.level>=11&&l.level<=14)){
      const data=revisions[l.id];if(!data)throw new Error('Missing didactic revision '+l.id);
      for(const p of l.applications){
        const at=`${l.level}-${l.order}-${p.part}`,newIds=m.vocabulary.filter(w=>w.introducedAt===at&&w.coreOrContext!=='legacy').map(w=>w.id);
        const previous=p.wordIds.filter(id=>{const w=word(id);return w&&point(w.introducedAt)<=point(at)});
        p.wordIds=[...new Set([...(data.reuse?.[p.part]||previous),...newIds])];
        const source=structuredClone(data[p.part]),reading=m.readings.find(r=>r.id===p.readingId);
        // Keep practical labels identical to the canonical taught words.
        for(const [from,to] of [['おむかえ','でむかえ'],['まちあわせ','まちあい'],['じどうはんばいき','じはんき']]){
          source.text=source.text.split(from).join(to);source.audioTextKana=source.audioTextKana.split(from).join(to);
          for(const q of source.questions){q.prompt=q.prompt.split(from).join(to);q.answer=q.answer.split(from).join(to);q.choices=q.choices.map(c=>c.split(from).join(to))}
        }
        if(l.id==='l12-5'&&p.part==='A'){source.text=source.text.replace('ともだち が まちます','ともだち は まちます');source.audioTextKana=source.audioTextKana.replace('ともだち が まちます','ともだち わ まちます')}
        if(l.id==='l12-3'&&p.part==='B')source.questions[0].prompt='わたし の かばん：くろ？ あか？';
        if(l.id==='l13-3'&&p.part==='A')source.questions[1].prompt='まがります。みぎ？ ひだり？';
        if(l.id==='l13-4'&&p.part==='A')source.questions[1].prompt='はやい しゅっぱつ は？';
        if(l.id==='l12-2'&&p.part==='A')source.questions[0].choices[2]='れんしゅう の あと';
        if(l.id==='l14-2'&&p.part==='B')source.questions[1].choices[1]='つかいます';
        if(l.id==='l14-4'&&p.part==='A')source.questions[1].choices[2]='みます';
        if(l.id==='l12-1'&&p.part==='A'){source.text+='でぐち へ いきます。';source.translation+=' Ik ga richting de uitgang.';source.audioTextKana+='でぐち え いきます。'}
        if(l.id==='l12-5'&&p.part==='A'){source.text=source.text.replace('ひこうじょう も くうこう の ことば です。','ここ は ひこうじょう です。');source.audioTextKana=source.audioTextKana.replace('ひこうじょう も くうこう の ことば です。','ここ わ ひこうじょう です。');source.translation=source.translation.replace('ひこうじょう is ook een woord voor vliegveld.','Dit is een vliegveld (ひこうじょう).')}
        Object.assign(reading,{text:source.text,translation:source.translation,audioTextKana:source.audioTextKana,requiredVocabIds:p.wordIds,question:source.questions[0].prompt,answer:source.questions[0].answer,choices:source.questions[0].choices});
        p.questions=source.questions.map((q,index)=>({...q,sourceId:`exercise-${p.id}-${index+1}`}));p.resourceKind=p.part==='B'?source.resourceKind:'story';p.label=data.labels?.[p.part]||p.label;
        p.grammarHint=data.note||m.grammar.find(g=>l.grammarIds.includes(g.id))?.shortExplanation||'Combineer bekende woorden met は, の, を, に en で. De voorbeelden bereiden deze tekst voor.';
      }
      l.wordIds=[...new Set(l.applications.flatMap(p=>p.wordIds))];
      for(const p of l.applications)Object.assign(m.readings.find(r=>r.id===p.readingId),{preparedAt:`${l.level}-${l.order}-B`,requiredVocabIds:l.wordIds});
      // Exercises keep stable IDs, but never retain the old payload/dependencies.
      for(const p of l.applications)for(const [i,q] of p.questions.entries()){
        const e=m.exercises.find(e=>e.id===`exercise-${p.id}-${i+1}`);if(e)Object.assign(e,{payload:['order',q.prompt,q.answer,q.choices],context:m.readings.find(r=>r.id===p.readingId).text,requiredVocabIds:l.wordIds,requiredGrammarIds:l.grammarIds,contextVocabIds:[]});
      }
      const current=m.vocabulary.filter(w=>w.introducedAt?.startsWith(`${l.level}-${l.order}-`)&&w.coreOrContext!=='legacy');
      l.models=[];
      for(const w of current){
        const example=examples[w.japanese]||[`これは ${w.japanese} です。`,`これわ ${w.reading} です。`,`Dit is ${w.meaning}.`];
        let model=l.models.find(model=>model.sentence===example[0]);
        if(!model){model={id:`sentence-prepare-${w.id}`,sentence:example[0],audioTextKana:example[1],meaning:example[2],linkedWordIds:[],parts:[]};l.models.push(model)}
        model.linkedWordIds.push(w.id);
      }
      if(data.integrationModels)for(const [index,example] of data.integrationModels.entries())l.models.push({id:`sentence-${l.id}-integration-${index+1}`,sentence:example[0],audioTextKana:example[1],meaning:example[2],linkedWordIds:[],parts:[]});
      if(l.id==='l12-1')l.models.push({id:'sentence-l12-1-direction',sentence:'でぐち へ いきます。',audioTextKana:'でぐち え いきます。',meaning:'Ik ga richting de uitgang. へ geeft de richting aan en klinkt als e.',linkedWordIds:['vocab-でぐち'],parts:[]});
      l.didactics={revision:1,canDo:data.canDo,integration:l.order===5,titleJa:data.titleJa,titleWordIds:data.titleWordIds||[],flow:['words','word-practice','sentences','story-A','comprehension-A','practical-B','application-B','Lestoets'],newWordIds:current.map(w=>w.id)};
      l.goal=data.canDo;
    }
    const spoken={
      'ただしい こたえ は？':'ただしい こたえ わ？','まちがい を もういちど みます。':'まちがい お もういちど みます。','ことば は？':'ことば わ？','よんでください。':'よんでください。','ゆっくり ききます。':'ゆっくり ききます。','くうらん を うめてください。ことば は？':'くうらん お うめてください。ことば わ？','まる は？':'まる わ？','さいしょ は？':'さいしょ わ？','つぎ は？':'つぎ わ？','あした は？':'あした わ？',
      'ごぜん しちじ に どこ に いきます か。':'ごぜん しちじ に どこ に いきます か。','ちず を みます。':'ちず お みます。','でんしゃ に のります。':'でんしゃ に のります。','えき に いきます。なんじ です か。':'えき に いきます。なんじ です か。',
      'どこ から いきます か。':'どこ から いきます か。','どこ に つきます か。':'どこ に つきます か。','ばんせん は？':'ばんせん わ？','いきさき は？':'いきさき わ？','おとな の きっぷ は？':'おとな の きっぷ わ？','500えん':'ごひゃくえん','300えん':'さんびゃくえん','100えん':'ひゃくえん','かたみち は？':'かたみち わ？','こども の きっぷ は？':'こども の きっぷ わ？',
      'どこ で まがります か。':'どこ で まがります か。','かいだん の まえ':'かいだん の まえ','ホテル の なか':'ホテル の なか','でんしゃ の なか':'でんしゃ の なか','まがります。みぎ？ ひだり？':'まがります。みぎ？ ひだり？','ちじょう の でぐち は？':'ちじょう の でぐち わ？','しゅうてん は？':'しゅうてん わ？',
      'でんしゃ の しゅっぱつ は？':'でんしゃ の しゅっぱつ わ？','はやい しゅっぱつ は？':'はやい しゅっぱつ わ？','おくれ は？':'おくれ わ？','0ふん':'ゼロふん','15ふん':'じゅうごふん','30ふん':'さんじゅっぷん','ばん は？':'ばん わ？','でんしゃ の あと は？':'でんしゃ の あと わ？','ホテルまえ で？':'ホテルまえ で？','バス は なんじ です か。':'バス わ なんじ です か。','おりば は？':'おりば わ？',
      'ホテル に とまります。':'ホテル に とまります。','みせてください。':'みせてください。','よやくばんごう は？':'よやくばんごう わ？','へや の ばんごう は？':'へや の ばんごう わ？','へや は？':'へや わ？','3かい':'さんがい','1かい':'いっかい','2かい':'にかい','かぎ は？':'かぎ わ？','カード を つかいます。ドア は？':'カード お つかいます。ドア わ？','かります。':'かります。','トイレ は？':'トイレ わ？','あさごはん は？':'あさごはん わ？','あとで にもつ を？':'あとで にもつ お？','かきます':'かきます','あさ なんじ から？':'あさ なんじ から？','よる なんじ に しめます か。':'よる なんじ に しめます か。','みず は どこ です か。':'みず わ どこ です か。','ちかく の みせ は？':'ちかく の みせ わ？',
      'とうちゃく ターミナル は？':'とうちゃく ターミナル わ？','どこ に つきました か。':'どこ に つきました か。','でぐち は？':'でぐち わ？','あんないじょ は？':'あんないじょ わ？','こちら は？':'こちら わ？','にゅうこく てつづき':'にゅうこく てつづき','りょこう の じゅんび':'りょこう の じゅんび','でんしゃ の じかん':'でんしゃ の じかん','パスポート は？':'パスポート わ？','にもつ は？':'にもつ わ？','にゅうこく は？':'にゅうこく わ？','ベルト の ばんごう は？':'ベルト の ばんごう わ？','ベルト で うけとります。':'ベルト で うけとります。','わたし の かばん：くろ？ あか？':'わたし の かばん、くろ？ あか？','わたし の かばん は？':'わたし の かばん わ？','にゅうこく てつづき は？':'にゅうこく てつづき わ？','でむかえ は？':'でむかえ わ？','しゅっぱつ は？':'しゅっぱつ わ？','5ばん の ベルト':'ごばん の ベルト','2ばん の ベルト':'にばん の ベルト','3ばん の ベルト':'さんばん の ベルト','ともだち は どこ です か。':'ともだち わ どこ です か。','そと の A':'そと の エー','ターミナル 2':'ターミナル に'
    };
    spoken['れんしゅう の あと']='れんしゅう の あと';
    m.didacticUtterances=Object.entries(spoken).map(([text,audioTextKana],i)=>{
      const lesson=m.lessons.filter(l=>l.didactics).sort((a,b)=>a.level-b.level||a.order-b.order).find(l=>l.applications.some(p=>p.questions.some(q=>[q.prompt,...q.choices].includes(text))));
      return{id:`sentence-didactic-question-${i+1}`,text,audioTextKana,level:lesson?.level||11,lessonId:lesson?.id||null};
    });
    // Authored conversations, shared by Phase 1 and Phase 2. A/B are logical turns,
    // not fixed male/female roles; the audio service maps them to the selected lead.
    const dialogue=(lessonId,partName,lines)=>({id:`dialogue-${lessonId}-${partName}`,lessonId,level:m.lessons.find(l=>l.id===lessonId).level,part:partName,speakerPolicy:'avatars',lines:lines.map(([text,kana,meaning],i)=>({sentenceId:`sentence-dialogue-${lessonId}-${partName}-${i+1}`,text,audioTextKana:kana,meaning,speakerRole:i%2?'B':'A'}))});
    m.didacticDialogues=[
      dialogue('l9-1','example',[['えき は どこ です か。','えき わ どこ です か。','Waar is het station?'],['えき は あそこ です。','えき わ あそこ です。','Het station is daar.']]),
      dialogue('l9-5','example',[['どこ で たべます か。','どこ で たべます か。','Waar eet je?'],['こうえん で パン を たべます。','こうえん で パン お たべます。','Ik eet brood in het park.']]),
      dialogue('l10-5','example',[['どこ に いきます か。','どこ に いきます か。','Waar ga je heen?'],['えき に いきます。','えき に いきます。','Ik ga naar het station.']]),
      dialogue('l12-4','B',[['のりば は どこ です か。','のりば わ どこ です か。','Waar is de halte?'],['のりば は みぎ です。','のりば わ みぎ です。','De halte is rechts.']]),
      dialogue('l13-2','B',[['きっぷ を ひとつ ください。','きっぷ お ひとつ ください。','Eén kaartje graag.'],['500えん です。','ごひゃくえん です。','Dat is 500 yen.']]),
      dialogue('l13-5','B',[['ホテルまえ は つぎ です か。','ホテルまえ わ つぎ です か。','Is Hotelmae de volgende halte?'],['つぎ は ホテルまえ です。','つぎ わ ホテルまえ です。','De volgende halte is Hotelmae.']]),
      dialogue('l14-1','B',[['よやく が あります。','よやく が あります。','Ik heb een reservering.'],['パスポート を みせてください。','パスポート お みせてください。','Laat uw paspoort zien.'],['おねがいします。','おねがいします。','Alstublieft.']]),
      dialogue('l14-3','B',[['タオル は あります か。','タオル わ あります か。','Zijn er handdoeken?'],['タオル が あります。','タオル が あります。','Er zijn handdoeken.']]),
      dialogue('l14-4','B',[['にもつ を あずけます。おねがいします。','にもつ お あずけます。おねがいします。','Mijn bagage in bewaring, alstublieft.'],['にもつ を あずかります。','にもつ お あずかります。','Ik bewaar uw bagage.']]),
      dialogue('l14-5','B',[['あさごはん は なんじ です か。','あさごはん わ なんじ です か。','Hoe laat is het ontbijt?'],['しちじ です。','しちじ です。','Om zeven uur.']])
    ];
    for(const d of m.didacticDialogues){const lesson=m.lessons.find(l=>l.id===d.lessonId);if(d.part==='example'){lesson.dialogueId=d.id;lesson.models[0].dialogueId=d.id}else lesson.applications.find(p=>p.part===d.part).dialogueId=d.id}
    m.contentVersion='1.6.0';
  }
  function point(value){const match=String(value).match(/^(\d+)-(\d+)(?:-([AB]))?$/);return match?Number(match[1])*10000+Number(match[2])*10+(match[3]==='A'?1:match[3]==='B'?2:9):Infinity}
  const api={apply,revisions,question,part};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.LanguageJourneyThematicDidactics=api;
})(typeof globalThis!=='undefined'?globalThis:this);
