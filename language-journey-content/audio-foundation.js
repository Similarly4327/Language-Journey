(function(root){
  'use strict';
  const kanaOnly=text=>typeof text==='string'&&/[ぁ-んァ-ヶ]/u.test(text)&&/^[ぁ-んァ-ヶー\s。、！？!?・]+$/u.test(text)&&!['っ','ッ','ー'].includes(text.trim());
  // Reviewed against the existing lesson breakdowns; never a global は→わ replacement.
  const modelReadings={
    'これは ねこ です':'これわ ねこ です',
    'それは ほん です':'それわ ほん です',
    'あれは いぬ です':'あれわ いぬ です',
    'わたし は ひと です':'わたし わ ひと です',
    'わたし は ともだち です':'わたし わ ともだち です',
    'これは わたし の ほん です':'これわ わたし の ほん です',
    'それは ともだち の ほん です':'それわ ともだち の ほん です',
    'これは ねこ です か':'これわ ねこ です か',
    'それは ほん です か':'それわ ほん です か',
    'それも ねこ です':'それも ねこ です',
    'わたし は みず を のみます':'わたし わ みず お のみます',
    'わたし は パン を たべます':'わたし わ パン お たべます',
    'わたし は さかな を みます':'わたし わ さかな お みます',
    'わたし は ほん を よみます':'わたし わ ほん お よみます',
    'わたし は みせ に いきます':'わたし わ みせ に いきます',
    'わたし は えき に いきます':'わたし わ えき に いきます'
  };
  // Same verified particle meanings/readings as Dictionary (IRODORI Grammar_all.pdf).
  const particleReadings={'grammar-ha':'わ','grammar-wo':'お','grammar-no':'の','grammar-ka':'か','grammar-mo':'も','grammar-ni':'に','grammar-desu':'です','grammar-l12-1':'え'};
  function numberKana(n){
    const digits=['ゼロ','いち','に','さん','よん','ご','ろく','なな','はち','きゅう','じゅう'];
    if(n<=10)return digits[n];
    if(n<100)return(n<20?'':digits[Math.floor(n/10)])+'じゅう'+(n%10?digits[n%10]:'');
    if(n<1000)return['','ひゃく','にひゃく','さんびゃく','よんひゃく','ごひゃく','ろっぴゃく','ななひゃく','はっぴゃく','きゅうひゃく'][Math.floor(n/100)]+(n%100?numberKana(n%100):'');
    if(n<10000)return['','せん','にせん','さんぜん','よんせん','ごせん','ろくせん','ななせん','はっせん','きゅうせん'][Math.floor(n/1000)]+(n%1000?numberKana(n%1000):'');
    return n===10000?'いちまん':null;
  }
  function numberSymbol(n){
    const digits=['〇','一','二','三','四','五','六','七','八','九'];
    if(n<10)return digits[n];if(n<100)return(n<20?'':digits[Math.floor(n/10)])+'十'+(n%10?digits[n%10]:'');
    if(n<1000)return(n<200?'':digits[Math.floor(n/100)])+'百'+(n%100?numberSymbol(n%100):'');
    if(n<10000)return(n<2000?'':digits[Math.floor(n/1000)])+'千'+(n%1000?numberSymbol(n%1000):'');
    return n===10000?'一万':null;
  }
  function attach(api){
    const manifest=api.manifest,entries=[],byId={},aliases={};
    const courseReadings=typeof module!=='undefined'&&module.exports?require('./audio-course-readings.js'):root.LanguageJourneyCourseReadings||[];
    const readingsByText=new Map(courseReadings.map(([text,kana])=>[text,kana]));
    const add=(entry,kind,displayText,kana,source={})=>{
      if(byId[entry.id])throw new Error('Duplicate audio content ID: '+entry.id);
      entry.pronunciation={readingId:'default',audioTextKana:kanaOnly(kana)?kana:null,status:['っ','ッ','ー'].includes(displayText)?'context-only':kanaOnly(kana)?'specified':'needs-review'};
      const ref={id:entry.id,kind,entry,displayText,pronunciation:entry.pronunciation,...source};
      entries.push(ref);byId[ref.id]=ref;return ref;
    };
    for(const word of manifest.vocabulary){
      add(word,'word',word.japanese,word.reading,{level:Number(word.introducedAt?.split('-')[0])||4,lessonId:api.vocabById[word.id]?.lessonId});
      if(api.vocabById[word.id])api.vocabById[word.id].pronunciation=word.pronunciation;
    }
    for(const grammar of manifest.grammar){
      add(grammar,'grammar',grammar.symbol||grammar.title,particleReadings[grammar.id]||grammar.audioTextKana,{level:Number(grammar.introducedAt?.split('-')[0])||4});
      if(particleReadings[grammar.id]&&!['grammar-desu','grammar-l12-1'].includes(grammar.id))aliases[grammar.id.replace('grammar-','grammar-particle-')]=grammar.id;
    }
    aliases['grammar-particle-he']='grammar-l12-1';
    manifest.audioKana=[];
    const addKana=(id,form,level,lessonId)=>{if(byId[id])return;const entry={id,form};manifest.audioKana.push(entry);add(entry,'kana',form,form==='を'?'お':form==='ヲ'?'オ':form,{level,lessonId})};
    for(const script of ['hiragana','katakana'])for(const row of manifest.kana[script])for(const [form] of row)addKana(`kana-${script}-${form}`,form,1);
    for(const pattern of manifest.kana.dakutenPatterns)for(const script of ['hiragana','katakana'])for(const [form] of script==='hiragana'?pattern.newH:pattern.newK)addKana(`kana-${script}-${form}`,form,3);
    for(const lesson of api.smallLessons)for(const [form] of lesson.newItems)addKana(['っ','ッ'].includes(form)?`kana-small-${form}`:form==='ー'?'writing-long-vowel-mark':`kana-combo-${form}`,form,5,lesson.id);
    manifest.sentences=[];const sentenceByText=new Map();
    for(const lesson of manifest.lessons)for(const [index,model] of (lesson.models||[]).entries()){
      let entry=sentenceByText.get(model.sentence);
      if(!entry){const tokens=[...new Set((model.parts||[]).flatMap(part=>part[0].split(/\s+/)))],linkedWordIds=tokens.flatMap(token=>{const matches=manifest.vocabulary.filter(word=>word.coreOrContext!=='legacy'&&(word.japanese===token||word.kanjiForm===token));return matches.length===1?[matches[0].id]:[]});entry={id:`sentence-${lesson.id}-model-${index+1}`,displayText:model.sentence,meaning:model.meaning,sourceLessonIds:[],linkedWordIds:[...new Set(linkedWordIds)]};manifest.sentences.push(entry);sentenceByText.set(model.sentence,entry);add(entry,'sentence',entry.displayText,model.audioTextKana||readingsByText.get(model.sentence)||(lesson.level===4?modelReadings[model.sentence]:null),{level:lesson.level,lessonId:lesson.id})}
      entry.sourceLessonIds.push(lesson.id);model.sentenceId=entry.id;
    }
    const greeting={id:'sentence-introduction-greeting',displayText:'こんにちは。',meaning:'Hallo.'};
    manifest.sentences.push(greeting);add(greeting,'sentence',greeting.displayText,'こんにちわ。',{level:4,lessonId:'l4-3'});
    manifest.dialogueBlocks=[{id:'dialogue-introduction',lines:[{sentenceId:greeting.id,speakerRole:'A'}],level:4,lessonId:'l4-3'}];
    manifest.dialogues.introduction[0].sentenceId=greeting.id;
    for(const block of manifest.dialogueBlocks){byId[block.id]={id:block.id,kind:'dialogue',entry:block,displayText:block.lines.map(line=>byId[line.sentenceId].displayText).join('\n'),level:block.level,lessonId:block.lessonId};entries.push(byId[block.id])}
    for(const passage of [...manifest.readings,...(manifest.bonus||[])]){
      const reviewed=passage.audioTextKana||readingsByText.get(passage.text);
      add(passage,'passage',passage.text,reviewed,{level:Number(passage.introducedAt?.split('-')[0]),lessonId:passage.lessonId});
    }
    manifest.avatarCelebrations=[
      {id:'avatar-celebration-01',japaneseText:'よくできたね！',audioTextKana:'よくできたね！',meaning:'Goed gedaan!',audioProfile:'celebration'},
      {id:'avatar-celebration-02',japaneseText:'やったね！',audioTextKana:'やったね！',meaning:'Yes, het is gelukt!',audioProfile:'celebration'},
      {id:'avatar-celebration-03',japaneseText:'すごい！',audioTextKana:'すごい！',meaning:'Geweldig!',audioProfile:'celebration'},
      {id:'avatar-celebration-04',japaneseText:'いいね！',audioTextKana:'いいね！',meaning:'Mooi!',audioProfile:'celebration'},
      {id:'avatar-celebration-05',japaneseText:'その調子！',audioTextKana:'そのちょうし！',meaning:'Ga zo door!',audioProfile:'celebration'},
      {id:'avatar-celebration-06',japaneseText:'ばっちり！',audioTextKana:'ばっちり！',meaning:'Helemaal goed!',audioProfile:'celebration'},
      {id:'avatar-celebration-07',japaneseText:'やっぱりできたね！',audioTextKana:'やっぱりできたね！',meaning:'Ik wist dat je het kon!',audioProfile:'celebration'},
      {id:'avatar-celebration-08',japaneseText:'よくがんばったね！',audioTextKana:'よくがんばったね！',meaning:'Je hebt goed je best gedaan!',audioProfile:'celebration'},
      {id:'avatar-celebration-09',japaneseText:'いい感じ！',audioTextKana:'いいかんじ！',meaning:'Dat gaat lekker!',audioProfile:'celebration'},
      {id:'avatar-celebration-10',japaneseText:'おめでとう！',audioTextKana:'おめでとう！',meaning:'Gefeliciteerd!',audioProfile:'celebration'}
    ];
    for(const entry of manifest.avatarCelebrations)add(entry,'avatarCelebration',entry.japaneseText,entry.audioTextKana,{audioProfile:'celebration'});
    // These are utterances from existing questions/examples, never a second vocabulary list.
    manifest.audioUtterances=[];
    for(const [text,kana,level,lessonId,id] of courseReadings){
      if(entries.some(ref=>ref.displayText===text&&ref.pronunciation?.audioTextKana))continue;
      // Text-based IDs remain stable when a question moves or its order changes.
      const entry={id,displayText:text};manifest.audioUtterances.push(entry);add(entry,'sentence',text,kana,{level,lessonId});
    }
    // A writing sign has an effect in a word, not an independent spoken syllable.
    const contextExamples={'kana-small-っ':'vocab-きって','kana-small-ッ':'vocab-ベッド','writing-long-vowel-mark':'vocab-コーヒー'};
    for(const [id,exampleId] of Object.entries(contextExamples))byId[id].exampleAudioId=exampleId;
    manifest.audioNumbers=[];
    for(const n of new Set(manifest.numbers.lessons.flatMap(l=>l.values))){const entry={id:`number-${n}`,value:n};manifest.audioNumbers.push(entry);add(entry,'number',numberSymbol(n),numberKana(n),{level:1});aliases[`num-${n}`]=entry.id;}
    api.audioEntries=entries;api.audioEntryById=byId;api.audioAliases=aliases;
    // Legacy inline questions can resolve only when all matches have the same pronunciation.
    api.resolveAudioEntry=function(id,text){
      if(id)return byId[aliases[id]||id]||null;
      const matches=entries.filter(ref=>ref.displayText===text&&ref.pronunciation?.audioTextKana);
      const readings=new Set(matches.map(ref=>ref.pronunciation.audioTextKana));
      return readings.size===1?matches[0]:null;
    };
    manifest.audio.voiceRoles=['A','B'];
    return api;
  }
  const api={attach,kanaOnly,numberKana,numberSymbol};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.LanguageJourneyAudioFoundation=api;
})(typeof globalThis!=='undefined'?globalThis:this);
