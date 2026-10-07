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
  function attach(api){
    const manifest=api.manifest,entries=[],byId={},aliases={};
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
      if(!entry){const tokens=[...new Set((model.parts||[]).flatMap(part=>part[0].split(/\s+/)))],linkedWordIds=tokens.flatMap(token=>{const matches=manifest.vocabulary.filter(word=>word.coreOrContext!=='legacy'&&(word.japanese===token||word.kanjiForm===token));return matches.length===1?[matches[0].id]:[]});entry={id:`sentence-${lesson.id}-model-${index+1}`,displayText:model.sentence,meaning:model.meaning,sourceLessonIds:[],linkedWordIds:[...new Set(linkedWordIds)]};manifest.sentences.push(entry);sentenceByText.set(model.sentence,entry);add(entry,'sentence',entry.displayText,lesson.level===4?modelReadings[model.sentence]:model.audioTextKana,{level:lesson.level,lessonId:lesson.id})}
      entry.sourceLessonIds.push(lesson.id);model.sentenceId=entry.id;
    }
    const greeting={id:'sentence-introduction-greeting',displayText:'こんにちは。',meaning:'Hallo.'};
    manifest.sentences.push(greeting);add(greeting,'sentence',greeting.displayText,'こんにちわ。',{level:4,lessonId:'l4-3'});
    manifest.dialogueBlocks=[{id:'dialogue-introduction',lines:[{sentenceId:greeting.id,speakerRole:'A'}],level:4,lessonId:'l4-3'}];
    manifest.dialogues.introduction[0].sentenceId=greeting.id;
    for(const block of manifest.dialogueBlocks){byId[block.id]={id:block.id,kind:'dialogue',entry:block,displayText:block.lines.map(line=>byId[line.sentenceId].displayText).join('\n'),level:block.level,lessonId:block.lessonId};entries.push(byId[block.id])}
    for(const passage of [...manifest.readings,...(manifest.bonus||[])]){
      const reviewed=passage.id==='reading-l6-5'&&passage.text==='これは わたし の かぞく です。 あれは わたし の あに です。'?'これわ わたし の かぞく です。 あれわ わたし の あに です。':passage.audioTextKana;
      add(passage,'passage',passage.text,reviewed,{level:Number(passage.introducedAt?.split('-')[0]),lessonId:passage.lessonId});
    }
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
  const api={attach,kanaOnly};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.LanguageJourneyAudioFoundation=api;
})(typeof globalThis!=='undefined'?globalThis:this);
