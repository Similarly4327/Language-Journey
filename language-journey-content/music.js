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
  function apply(m){for(const [id,japanese,romaji,meaning,partOfSpeech,kanjiForm] of entries){const existing=m.vocabulary.find(w=>w.japanese===japanese&&w.coreOrContext!=='legacy'&&(w.kanjiForm===kanjiForm||w.meaning===meaning));if(existing){for(const group of groups){const index=group.indexOf(id);if(index>=0)group[index]=existing.id}continue}if(m.vocabulary.some(w=>w.id===id))continue;m.vocabulary.push({id,japanese,reading:japanese,romaji,meaning,meanings:[meaning],partOfSpeech,kanjiForm,kanjiIntroducedAt:'20-6',introducedAt:'20-5',availableFrom:'20-5',lessonId:'music-quintuplets',routeId:'music',themes:['music','feelings'],coreOrContext:'context',recallCore:true,audioId:null,source:'五等分の気持ち · vocabulary inventory',notes:'Vrijwillige muziekpilot; woordenboekvorm, geen liedtekst.'})}
    const massugu=m.vocabulary.find(w=>w.id==='vocab-まっすぐ');if(massugu)massugu.meanings=[...new Set([...(massugu.meanings||[massugu.meaning]),'oprecht'])];
    m.music={id:'music-quintuplets',title:'五等分の気持ち',groups:groups.map(group=>group.slice())}}
  const api={entries,groups,apply};if(typeof module!=='undefined'&&module.exports)module.exports=api;else(root.window||root).LanguageJourneyMusic=api;
})(typeof globalThis!=='undefined'?globalThis:this);

