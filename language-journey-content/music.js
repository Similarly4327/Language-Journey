/* Optional music pilot: lexical inventory only; no lyrics are stored. */
(function(root){
  'use strict';
  const entries=[
    ['vocab-music-yorokobi','よろこび','yorokobi','vreugde','noun','喜び'],
    ['vocab-music-kanashimi','かなしみ','kanashimi','verdriet','noun','悲しみ'],
    ['vocab-music-kimochi','きもち','kimochi','gevoel','noun','気持ち'],
    ['vocab-music-unmei','うんめい','unmei','lot','noun','運命'],
    ['vocab-music-daisuki','だいすき','daisuki','heel erg leuk vinden','na-adjective','大好き'],
["vocab-music-okiru","おきる","okiru","wakker worden","verb","起きる"],
["vocab-music-kimi","きみ","kimi","jij (informeel)","pronoun","君"],
["vocab-music-shiru","しる","shiru","weten","verb","知る"],
["vocab-music-wakariau","わかりあう","wakariau","elkaar begrijpen","verb","分かり合う"],
["vocab-music-tsuiteiku","ついていく","tsuite iku","meegaan; volgen","verb","ついて行く"],
["vocab-music-kirai","きらい","kirai","niet leuk vinden","na-adjective","嫌い"],
["vocab-music-suki","すき","suki","leuk vinden","na-adjective","好き"],
["vocab-music-iradachi","いらだち","iradachi","ergernis","noun","苛立ち"],
["vocab-music-aisuru","あいする","aisuru","liefhebben","verb","愛する"],
["vocab-music-kankei","かんけい","kankei","relatie; verband","noun","関係"],
["vocab-music-soba","そば","soba","nabijheid; naast","noun",null],
["vocab-music-oshieru","おしえる","oshieru","vertellen; onderwijzen","verb","教える"],
["vocab-music-amaeru","あまえる","amaeru","op iemands genegenheid rekenen","verb","甘える"],
["vocab-music-deau","であう","deau","ontmoeten","verb","出会う"],
["vocab-music-guuzen","ぐうぜん","guuzen","toeval","noun","偶然"],
["vocab-music-kiseki","きせき","kiseki","wonder","noun","奇跡"],
["vocab-music-tsukuriwarai","つくりわらい","tsukuriwarai","gemaakte glimlach","noun","作り笑い"],
["vocab-music-minuku","みぬく","minuku","doorzien","verb","見抜く"],
["vocab-music-kizuku","きづく","kizuku","opmerken","verb","気づく"],
["vocab-music-kawaru","かわる","kawaru","veranderen","verb","変わる"],
["vocab-music-fukuzatsu","ふくざつ","fukuzatsu","ingewikkeld","na-adjective","複雑"],
["vocab-music-tsuzuku","つづく","tsuzuku","doorgaan","verb","続く"],
["vocab-music-wasureru","わすれる","wasureru","vergeten","verb","忘れる"],
["vocab-music-omoide","おもいで","omoide","herinnering","noun","思い出"],
["vocab-music-fueru","ふえる","fueru","toenemen","verb","増える"],
["vocab-music-shinjiru","しんじる","shinjiru","geloven; vertrouwen","verb","信じる"],
["vocab-music-mune","むね","mune","borst","noun","胸"],
["vocab-music-kodou","こどう","kodou","hartslag","noun","鼓動"],
["vocab-music-takanaru","たかなる","takanaru","sneller kloppen","verb","高鳴る"],
["vocab-music-jishin","じしん","jishin","zelfvertrouwen","noun","自信"],
["vocab-music-yume","ゆめ","yume","droom","noun","夢"],
["vocab-music-yawaragu","やわらぐ","yawaragu","verzachten","verb","和らぐ"],
["vocab-music-kakureru","かくれる","kakureru","zich verbergen","verb","隠れる"],
["vocab-music-itsumademo","いつまでも","itsumademo","voor altijd; steeds","adverb",null],
["vocab-music-sukoshi","すこし","sukoshi","een beetje","adverb","少し"],
["vocab-music-benkyou","べんきょう","benkyou","studie; studeren","noun","勉強"],
["vocab-music-dandan","だんだん","dandan","geleidelijk","adverb",null],
["vocab-music-itsutsu","いつつ","itsutsu","vijf dingen","noun","五つ"]
  ];
  const ids=[...entries.map(entry=>entry[0]),'vocab-あなた','vocab-まっすぐ','vocab-いみ','vocab-ことば','vocab-ひとつ','vocab-ふたつ','vocab-みっつ','vocab-よっつ'];
  const groups=Array.from({length:Math.ceil(ids.length/3)},(_,i)=>ids.slice(i*3,i*3+3));
  // Character senses: Japan Kanji Aptitude Testing Foundation, KanjiPedia.
  // Whole-word readings checked against the existing inventory and dictionary entries.
  // These are teaching notes for existing word IDs, never extra vocabulary entries.
  const componentSources={'気':'0001184900','持':'0002874500','運':'0000366800','命':'0006674800','大':'0004474400','好':'0002163400','分':'0006175200','合':'0002341000','苛':'0000664400','立':'0007104000','関':'0001108800','係':'0001761200','出':'0003214000','会':'0000756800','偶':'0001690000','然':'0004145300','奇':'0001201600','跡':'0003972400','作':'0002561800','笑':'search?k=%E7%AC%91&kt=1&sk=leftHand','見':'0001896200','抜':'0005698600','複':'0006120000','雑':'0002605500','思':'0002765700','鼓':'0002072700','動':'0005267200','高':'0002250300','鳴':'0006693400','自':'0002850500','信':'0003599100','勉':'0006289600','強':'0001515000'};
  const componentRows={
    'vocab-music-kimochi':[['気','き','gevoel of stemming'],['持','も','houden of dragen']],
    'vocab-music-unmei':[['運','うん','samenloop of geluk'],['命','めい','lotsbestemming']],
    'vocab-music-daisuki':[['大','だい','heel erg'],['好','す','leuk vinden']],
    'vocab-music-wakariau':[['分','わ','begrijpen'],['合','あ','samen of wederzijds']],
    'vocab-music-iradachi':[['苛','いら','ergernis'],['立','だ','opkomen of ontstaan']],
    'vocab-music-kankei':[['関','かん','betrokkenheid'],['係','けい','verbinding']],
    'vocab-music-deau':[['出','で','naar buiten komen'],['会','あ','ontmoeten']],
    'vocab-music-guuzen':[['偶','ぐう','toevallig'],['然','ぜん','zo of op die manier']],
    'vocab-music-kiseki':[['奇','き','wonderlijk'],['跡','せき','spoor']],
    'vocab-music-tsukuriwarai':[['作','つく','maken'],['笑','わら','lachen']],
    'vocab-music-minuku':[['見','み','zien'],['抜','ぬ','doordringen']],
    'vocab-music-fukuzatsu':[['複','ふく','meerdere lagen'],['雑','ざつ','door elkaar']],
    'vocab-music-omoide':[['思','おも','denken'],['出','で','naar buiten komen']],
    'vocab-music-kodou':[['鼓','こ','slaan of kloppen'],['動','どう','beweging']],
    'vocab-music-takanaru':[['高','たか','hoog of sterk'],['鳴','な','klinken']],
    'vocab-music-jishin':[['自','じ','zichzelf'],['信','しん','vertrouwen']],
    'vocab-music-benkyou':[['勉','べん','zich inspannen'],['強','きょう','sterk of krachtig']]
  };
  // Short fragments from the user-supplied song transcript; spoken TTS only.
  // These are sentence activities, not vocabulary or Recall entries.
  const contexts=[
    {id:'sentence-music-quintuplets-know-you',text:'君を知りたいよ。',kana:'きみをしりたいよ。',translation:'Ik wil jou beter leren kennen.',note:'しりたい drukt een wens uit: de spreker wil de ander leren kennen.',question:'Wat zegt de spreker hier?',answer:'De spreker wil de ander beter leren kennen.',choices:['De spreker wil de ander beter leren kennen.','De spreker wil de ander vergeten.','De spreker vraagt waar iemand woont.'],wordIds:['vocab-music-kimi','vocab-music-shiru']},
    {id:'sentence-music-quintuplets-changing-feelings',text:'気持ちが変わる。',kana:'きもちがかわる。',translation:'Gevoelens veranderen.',note:'きもち gaat over wat iemand voelt; かわる zegt dat dit anders wordt.',question:'Wat verandert er?',answer:'Iemands gevoelens.',choices:['Iemands gevoelens.','De tijd op de klok.','De plaats van een station.'],wordIds:['vocab-music-kimochi','vocab-music-kawaru']},
    {id:'sentence-music-quintuplets-memory',text:'思い出を忘れない。',kana:'おもいでをわすれない。',translation:'Ik vergeet de herinneringen niet.',note:'わすれない is de ontkennende vorm: iets niet vergeten.',question:'Wat betekent わすれない in deze zin?',answer:'Niet vergeten.',choices:['Niet vergeten.','Opnieuw ontmoeten.','Hard leren.'],wordIds:['vocab-music-omoide','vocab-music-wasureru']}
  ];
  const components=Object.fromEntries(Object.entries(componentRows).map(([id,rows])=>[id,rows.map(([character,reading,meaning])=>({character,reading,meaning,source:componentSources[character].startsWith('search?')?'https://www.kanjipedia.jp/'+componentSources[character]:'https://www.kanjipedia.jp/kanji/'+componentSources[character]}))]));
  function apply(m){for(const [id,japanese,romaji,meaning,partOfSpeech,kanjiForm] of entries){const existing=m.vocabulary.find(w=>w.japanese===japanese&&w.coreOrContext!=='legacy'&&(w.kanjiForm===kanjiForm||w.meaning===meaning));if(existing){for(const group of groups){const index=group.indexOf(id);if(index>=0)group[index]=existing.id}continue}if(m.vocabulary.some(w=>w.id===id))continue;m.vocabulary.push({id,japanese,reading:japanese,romaji,meaning,meanings:[meaning],partOfSpeech,kanjiForm,kanjiIntroducedAt:'20-6',introducedAt:'20-5',availableFrom:'20-5',lessonId:'music-quintuplets',routeId:'music',themes:['music','feelings'],coreOrContext:'context',recallCore:true,audioId:null,source:'五等分の気持ち · vocabulary inventory',notes:'Vrijwillige muziekpilot; woordenboekvorm.'})}
    const massugu=m.vocabulary.find(w=>w.id==='vocab-まっすぐ');if(massugu)massugu.meanings=[...new Set([...(massugu.meanings||[massugu.meaning]),'oprecht'])];
    m.music={id:'music-quintuplets',title:'五等分の気持ち',groups:groups.map(group=>group.slice()),contexts:contexts.map(item=>({...item,choices:item.choices.slice(),wordIds:item.wordIds.slice()}))};
    m.didacticUtterances=m.didacticUtterances||[];for(const item of contexts)if(!m.didacticUtterances.some(line=>line.id===item.id))m.didacticUtterances.push({id:item.id,text:item.text,audioTextKana:item.kana,meaning:item.translation,level:20,lessonId:'music-quintuplets'});
  }
  const api={entries,groups,components,contexts,apply};if(typeof module!=='undefined'&&module.exports)module.exports=api;else(root.window||root).LanguageJourneyMusic=api;
})(typeof globalThis!=='undefined'?globalThis:this);

