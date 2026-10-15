(function(root){
  'use strict';
  // Only existing vocabulary and sentence patterns; stable lesson/word IDs are retained.
  function prepareLegacy(m){
    const lesson=(level,order)=>m.lessons.find(l=>l.level===level&&l.order===order);
    const words=forms=>forms.split(' ').map(form=>`vocab-${form}`);
    const moved=words('りょこう じゅんび ひこうき');
    m.level11IntegrationMigration={revision:1,movedWordIds:moved};
    for(const id of moved){
      const w=m.vocabulary.find(w=>w.id===id);
      Object.assign(w,{introducedAt:'12-1-A',availableFrom:'12-1-A',lessonId:'l12-1'});
      const next=lesson(12,1);next.wordIds=[...new Set([...next.wordIds,id])];
      next.applications[0].wordIds=[...new Set([...next.applications[0].wordIds,id])];
      next.didactics.newWordIds=[...new Set([...next.didactics.newWordIds,id])];
    }
    const former=lesson(11,5),next=lesson(12,1);
    next.models.unshift(...former.models.filter(model=>model.linkedWordIds.some(id=>moved.includes(id))));
    for(const p of next.applications){const r=m.readings.find(r=>r.id===p.readingId);r.requiredVocabIds=next.wordIds.slice()}
    for(const l of m.lessons.filter(l=>l.level===11&&l.order<=4)){
      l.didactics.splitParts=true;l.didactics.revision=2;
      l.didactics.flow=['words-A-5','practice-A-10','sentences-A','source-A','questions-A','words-B-5','practice-B-10','sentences-B','source-B','questions-B','Lestoets'];
      for(const p of l.applications){
        p.newWordIds=l.didactics.newWordIds.filter(id=>m.vocabulary.find(w=>w.id===id).introducedAt===`11-${l.order}-${p.part}`);
        const available=new Set(m.vocabulary.filter(w=>compare(w.introducedAt,`11-${l.order}-${p.part}`)<=0).map(w=>w.id));
        p.models=l.models.filter(model=>model.linkedWordIds.some(id=>p.newWordIds.includes(id))&&model.linkedWordIds.every(id=>available.has(id)));
        const r=m.readings.find(r=>r.id===p.readingId);r.preparedAt=`11-${l.order}-${p.part}`;r.requiredVocabIds=p.part==='A'?p.wordIds.slice():l.wordIds.slice();
        for(const q of p.questions){const e=m.exercises.find(e=>e.id===q.sourceId);if(e)e.requiredVocabIds=r.requiredVocabIds.slice()}
        // Instruction words are learning content, not a hidden prerequisite for A.
        if(p.part==='A'&&l.order===1)p.grammarHint='Met を wijs je aan wat je kiest: こたえ を えらびます = ik kies het antwoord.';
      }
    }
    const first=lesson(11,1),grammar=m.grammar.find(g=>g.id===first.grammarIds[0]);
    Object.assign(grammar,{examples:['こたえ を えらびます。'],shortExplanation:'を wijst aan wat je kiest. こたえ を えらびます betekent: ik kies het antwoord. In B herken je ook een juist antwoord en een fout.'});
    const shortB=[
      ['これは れんしゅう の もんだい です。こたえ は ただしい です。\nまちがい を もういちど みます。','Dit is een oefenopgave. Het antwoord is juist. Ik bekijk de fout nog eens.','これわ れんしゅう の もんだい です。こたえ わ ただしい です。まちがい お もういちど みます。'],
      ['ページ 1：タイトル と もじ を よんでください。\nことば：パン　しるし：○','Pagina 1: lees de titel en de letters. Woord: brood. Markering: cirkel.','ページ いち。タイトル と もじ お よんでください。ことば、パン。しるし、まる。'],
      ['くうらん を うめてください。ことば は おと です。\nきごう は まる ○ です。こたえ を かいてください。','Vul het open vak in. Het woord is geluid. Het symbool is een cirkel. Schrijf het antwoord (kies met een tik).','くうらん お うめてください。ことば わ おと です。きごう わ まる です。こたえ お かいてください。'],
      ['さいしょ に れんしゅう を はじめます。ぜんぶ よみます。\nあと で こたえ を かくにん します。れんしゅう を すすめます。','Eerst begin ik met oefenen en lees ik alles. Daarna controleer ik het antwoord en ga ik verder met oefenen.','さいしょ に れんしゅう お はじめます。ぜんぶ よみます。あと で こたえ お かくにん します。れんしゅう お すすめます。']
    ];
    shortB.forEach(([text,translation,audioTextKana],index)=>{
      const l=lesson(11,index+1),p=l.applications[1],r=m.readings.find(r=>r.id===p.readingId);
      Object.assign(r,{text,translation,audioTextKana});p.label='Korte toepassing';p.resourceKind='notice';
      if(index===0)Object.assign(p.questions[0],{prompt:'こたえ は？',answer:'ただしい',choices:['ただしい','まちがい','もういちど']});
      for(const q of p.questions){const e=m.exercises.find(e=>e.id===q.sourceId);if(e)Object.assign(e,{payload:['order',q.prompt,q.answer,q.choices],context:text})}
    });
    // Reuse the existing practical lesson sources, condensed into three coherent screens.
    const q=(id,prompt,answer,other,target)=>({sourceId:`exercise-l11-integration-${id}`,prompt,answer,choices:[answer,...other],targetVocabIds:words(target)});
    const sources=[
      {id:'reading-l11-integration-page',label:'Lespagina',text:'レッスン 1：れんしゅう の もんだい\nページ 1：タイトル と ぶん を よんでください。\nしつもん：ことば の いみ は？ ただしい こたえ を えらびます。',translation:'Les 1: een oefenopgave. Pagina 1: lees de titel en de zin. Vraag: wat betekent het woord? Ik kies het juiste antwoord.',questions:[
        q('page-task','Wat moet je met het antwoord doen?','het juiste antwoord kiezen',['nog eens luisteren','de woorden ordenen'],'ただしい こたえ えらびます'),
        q('page-read','Wat moet je lezen?','de titel en de zin',['het geluid en het symbool','alleen het antwoord'],'タイトル ぶん よんでください'),
        q('page-meaning','Wat vraagt de vraag?','de betekenis van het woord',['het einde van de oefening','het nummer van de les'],'しつもん ことば いみ'),
        q('page-type','Wat is deze opgave?','een oefening',['een reisplan','een geluid'],'れんしゅう もんだい'),
        q('page-find','Waar staat de leesopdracht?','op pagina 1',['op pagina 2','op pagina 3'],'ページ よんでください'),
        q('page-title','Wat hoort bij de zin op deze lespagina?','de titel',['het geluid','de cirkel'],'タイトル ぶん') ]},
      {id:'reading-l11-integration-audio',label:'Luister- en invulkaart',text:'おんせい を ゆっくり きいてください。おと を くりかえします。\nくうらん：＿＿　ことば：おと　うめてください。\nきごう：まる ○　こたえ を かいてください。',translation:'Luister langzaam naar de audio. Ik herhaal het geluid. Vul het open vak in met het woord geluid. Symbool: een cirkel. Schrijf het antwoord (kies met een tik).',questions:[
        q('audio-how','Hoe moet je luisteren?','langzaam',['nog eens lezen','alles schrijven'],'ゆっくり きいてください'),
        q('audio-repeat','Wat wordt herhaald?','het geluid',['de titel','de pagina'],'おと くりかえします'),
        q('audio-fill','Wat moet in het open vak?','おと',['パン','ねこ'],'くうらん うめてください'),
        q('audio-symbol','Welk symbool hoort bij deze kaart?','○',['×','→'],'きごう まる'),
        q('audio-write','Wat vraagt de laatste instructie?','het antwoord schrijven',['de les beginnen','de zin lezen'],'かいてください こたえ'),
        q('audio-medium','Waarnaar moet je luisteren?','de audio',['de titel','de pagina'],'おんせい きいてください') ]},
      {id:'reading-l11-integration-order',label:'Oefenplan',text:'じゅんばん：さいしょ に れんしゅう を はじめます。ぜんぶ よみます。\nつぎ：ことば を ならべます。こたえ を かくにん します。\nあと：れんしゅう を すすめます。これで おわり です。',translation:'Volgorde: eerst begin ik met oefenen en lees ik alles. Daarna orden ik woorden en controleer ik het antwoord. Vervolgens ga ik verder met oefenen. Daarmee is het klaar.',questions:[
        q('order-first','Wat doe je als eerste?','beginnen met oefenen',['het antwoord controleren','stoppen met de oefening'],'さいしょ はじめます'),
        q('order-next','Wat doe je na het lezen?','woorden in volgorde zetten',['het geluid herhalen','de titel schrijven'],'つぎ ならべます'),
        q('order-check','Wat controleer je?','het antwoord',['de pagina','het geluid'],'かくにん'),
        q('order-end','Wat betekent de laatste mededeling?','dit is het einde',['lees nog eens','luister langzaam'],'おわり'),
        q('order-all','Hoeveel lees je?','alles',['alleen de titel','alleen het eerste woord'],'ぜんぶ'),
        q('order-after','Wat doe je vervolgens?','verdergaan met de oefening',['de titel kiezen','het geluid herhalen'],'あと すすめます') ]}
    ];
    const spoken=[
      'レッスン いち。れんしゅう の もんだい。ページ いち。タイトル と ぶん お よんでください。しつもん。ことば の いみ わ？ただしい こたえ お えらびます。',
      'おんせい お ゆっくり きいてください。おと お くりかえします。くうらん。ことば、おと。うめてください。きごう、まる。こたえ お かいてください。',
      'じゅんばん。さいしょ に れんしゅう お はじめます。ぜんぶ よみます。つぎ。ことば お ならべます。こたえ お かくにん します。あと。れんしゅう お すすめます。これで おわり です。'
    ];
    sources.forEach((s,i)=>s.audioTextKana=spoken[i]);
    const testedWords=[...new Set(sources.flatMap(s=>s.questions.flatMap(q=>q.targetVocabIds)))];
    for(const s of sources)m.readings.push({id:s.id,type:'notice',lessonId:former.id,level:11,text:s.text,translation:s.translation,audioTextKana:s.audioTextKana,requiredVocabIds:testedWords,requiredGrammarIds:[],contextVocabIds:[],introducedAt:'11-5-A',availableFrom:'11-5-A',preparedAt:'11-5-A',question:s.questions[0].prompt,answer:s.questions[0].answer,choices:s.questions[0].choices});
    Object.assign(former,{title:'Integratie-examen',titleJa:null,titleVocabIds:[],goal:'Korte Japanse lesbronnen begrijpen en instructies uit lessen 1–4 toepassen.',wordIds:[],models:[],grammarIds:[],patternIds:[],integrationExam:{revision:1,sources},didactics:{...former.didactics,newWordIds:[],integration:true,flow:['integration-exam']}});
    // Existing IDs stay valid for historical results and dictionary links, not a second lesson.
    for(const [i,p] of former.applications.entries()){
      const s=sources[i],r=m.readings.find(r=>r.id===p.readingId);
      Object.assign(r,{text:s.text,translation:s.translation,audioTextKana:s.audioTextKana,requiredVocabIds:testedWords,question:s.questions[0].prompt,answer:s.questions[0].answer,choices:s.questions[0].choices});
      p.wordIds=[];p.questions=s.questions.slice(0,2).map((q,index)=>({...q,sourceId:`exercise-${p.id}-${index+1}`}));
      for(const [index,q] of p.questions.entries()){const e=m.exercises.find(e=>e.id===q.sourceId);if(e)Object.assign(e,{payload:['order',q.prompt,q.answer,q.choices],context:s.text,requiredVocabIds:testedWords,requiredGrammarIds:[]})}
    }
    delete m.levels.find(l=>l.number===11).nextDestinationVocabularyId;
    m.didacticUtterances.push({id:'sentence-l11-answer-question',text:'こたえ は？',audioTextKana:'こたえ わ？',level:11,lessonId:first.id});
    m.contentVersion='1.7.0';
  }
  function compare(a,b){const n=value=>{const x=String(value).match(/^(\d+)-(\d+)(?:-([AB]))?$/);return x?+x[1]*1000+(+x[2])*10+(x[3]==='A'?1:x[3]==='B'?2:9):0};return n(a)-n(b)}
  function apply(m){
    prepareLegacy(m);
    const lesson=(level,order)=>m.lessons.find(l=>l.level===level&&l.order===order),word=id=>m.vocabulary.find(w=>w.id===id),ids=text=>text.split(' ').map(w=>`vocab-${w}`);
    const moved={りょこう:'11-4-B',じゅんび:'11-4-B',ひこうき:'11-4-B',ぜんぶ:'12-5-A',あと:'12-2-B',すすめます:'12-3-A'};
    m.level11IntegrationMigration={revision:2,movedWordIds:ids('りょこう じゅんび ひこうき'),wordSources:Object.fromEntries(Object.keys(moved).map(form=>[`vocab-${form}`,{level:11,lessonId:['りょこう','じゅんび','ひこうき'].includes(form)?'l11-home-5':'l11-home-4',revision1LessonId:['りょこう','じゅんび','ひこうき'].includes(form)?'l12-1':'l11-home-4'}]))};
    for(const [form,point] of Object.entries(moved)){const w=word(`vocab-${form}`);Object.assign(w,{introducedAt:point,availableFrom:point,lessonId:lesson(+point.split('-')[0],+point.split('-')[1]).id})}
    // The three displaced words have real later introductions, not implicit knowledge.
    for(const l of m.lessons.filter(l=>l.level>=12&&l.level<=14)){
      for(const p of l.applications){p.wordIds=p.wordIds.filter(id=>!Object.hasOwn(moved,id.slice(6)));for(const [form,point] of Object.entries(moved))if(point===`${l.level}-${l.order}-${p.part}`)p.wordIds.push(`vocab-${form}`)}
      l.wordIds=[...new Set(l.applications.flatMap(p=>p.wordIds))];l.didactics.newWordIds=m.vocabulary.filter(w=>w.introducedAt?.startsWith(`${l.level}-${l.order}-`)).map(w=>w.id);
      l.models=l.models.filter(model=>!(model.linkedWordIds||[]).some(id=>Object.hasOwn(moved,id.slice(6))));
    }
    const laterModels=[
      [12,2,'あと','にゅうこく の あと です。','にゅうこく の あと です。','Het is na de immigratieprocedure.'],
      [12,3,'すすめます','れんしゅう を すすめます。','れんしゅう お すすめます。','Ik ga verder met de oefening.'],
      [12,5,'ぜんぶ','ぜんぶ かくにん します。','ぜんぶ かくにん します。','Ik controleer alles.']
    ];
    for(const [level,order,form,sentence,audioTextKana,meaning] of laterModels)lesson(level,order).models.push({id:`sentence-prepare-vocab-${form}`,sentence,audioTextKana,meaning,linkedWordIds:[`vocab-${form}`],parts:[]});
    const groups=[
      ['レベル レッスン しつもん こたえ えらびます','もんだい れんしゅう ただしい まちがい もういちど'],
      ['せつめい ぶん ことば いみ みつけます','よんでください ページ タイトル もじ しるし'],
      ['きいてください おと おんせい ゆっくり くりかえします','うめてください くうらん かいてください きごう まる'],
      ['じゅんばん ならべます さいしょ つぎ おわり','りょこう じゅんび ひこうき はじめます かくにん']
    ];
    const models=[
      [[['レベル 11 の レッスン 1 です。','レベル じゅういち の レッスン いち です。','Dit is les 1 van Level 11.','レベル レッスン'],['これは しつもん です。','これわ しつもん です。','Dit is een vraag.','しつもん'],['こたえ を えらびます。','こたえ お えらびます。','Ik kies een antwoord.','こたえ えらびます']],
       [['これは れんしゅう の もんだい です。','これわ れんしゅう の もんだい です。','Dit is een oefenopgave.','れんしゅう もんだい'],['こたえ は ただしい です。','こたえ わ ただしい です。','Het antwoord is juist.','ただしい'],['まちがい を もういちど みます。','まちがい お もういちど みます。','Ik bekijk de fout nog eens.','まちがい もういちど']]],
      [[['せつめい の ぶん を よみます。','せつめい の ぶん お よみます。','Ik lees de zin van de uitleg.','せつめい ぶん'],['ことば の いみ を みつけます。','ことば の いみ お みつけます。','Ik vind de betekenis van het woord.','ことば いみ みつけます']],
       [['ページ の タイトル を よんでください。','ページ の タイトル お よんでください。','Lees de titel van de pagina.','ページ タイトル よんでください'],['もじ と しるし を みます。','もじ と しるし お みます。','Ik bekijk de letters en het teken.','もじ しるし']]],
      [[['おんせい を きいてください。','おんせい お きいてください。','Luister naar de audio.','おんせい きいてください'],['ゆっくり おと を くりかえします。','ゆっくり おと お くりかえします。','Ik herhaal het geluid langzaam.','ゆっくり おと くりかえします']],
       [['くうらん を うめてください。','くうらん お うめてください。','Vul het open vak in.','くうらん うめてください'],['きごう は まる です。','きごう わ まる です。','Het symbool is een cirkel.','きごう まる'],['こたえ を かいてください。','こたえ お かいてください。','Schrijf het antwoord; hier oefen je met een tik.','かいてください']]],
      [[['じゅんばん です。ことば を ならべます。','じゅんばん です。ことば お ならべます。','Dit is de volgorde. Ik zet de woorden in volgorde.','じゅんばん ならべます'],['さいしょ は ぶん です。つぎ は こたえ です。','さいしょ わ ぶん です。つぎ わ こたえ です。','Eerst komt de zin. Daarna komt het antwoord.','さいしょ つぎ'],['これで おわり です。','これで おわり です。','Hiermee is het klaar. Herken これで おわり als korte vaste uitdrukking.','おわり']],
       [['りょこう の じゅんび を はじめます。','りょこう の じゅんび お はじめます。','Ik begin met de reisvoorbereiding.','りょこう じゅんび はじめます'],['これは ひこうき です。','これわ ひこうき です。','Dit is een vliegtuig.','ひこうき'],['こたえ を かくにん します。','こたえ お かくにん します。','Ik controleer het antwoord. かくにん します leer je als één handeling.','かくにん']]]
    ];
    const question=(prompt,answer,other)=>({prompt,answer,choices:[answer,...other]});
    const checks=[
      [[question('Wat kies je in de laatste zin?','het antwoord',['de les','de vraag']),question('Wat is これは しつもん です？','Dit is een vraag.',['Dit is een antwoord.','Dit is een les.'])],[question('Wat zegt de tweede zin over het antwoord?','het is juist',['het is fout','het is een geluid']),question('Wat bekijk je nog een keer?','de fout',['de titel','het geluid'])]],
      [[question('ことば の いみ を みつけます。','de betekenis van het woord vinden',['de zin schrijven','het geluid herhalen']),question('せつめい の ぶん を よみます。','de uitlegzin lezen',['een antwoord kiezen','een teken schrijven'])],[question('Wat lees je op de pagina?','de titel',['het geluid','de cirkel']),question('Wat bekijk je in de tweede zin?','de letters en het teken',['het antwoord en het geluid','de zin en de vraag'])]],
      [[question('Waarnaar moet je luisteren?','de audio',['de titel','de vraag']),question('Hoe herhaal je het geluid?','langzaam',['nog eens lezen','alles schrijven'])],[question('Wat moet je invullen?','het open vak',['de titel','de pagina']),question('Welk symbool staat in de tekst?','○',['×','→'])]],
      [[question('Wat komt na de zin?','het antwoord',['de titel','het geluid']),question('Wat doe je met de woorden?','in volgorde zetten',['opnieuw beluisteren','schrijven'])],[question('Waarmee begin je?','de reisvoorbereiding',['de aankomst','de treinreis']),question('Wat controleer je in de laatste zin?','het antwoord',['de titel','het vliegtuig'])]]
    ];
    for(let i=0;i<4;i++){
      const l=lesson(11,i+1);l.models=[];l.wordIds=groups[i].flatMap(ids);l.didactics={...l.didactics,revision:3,splitParts:true,newWordIds:l.wordIds.slice(),flow:['words-A-5','practice-A-10','sentences-A','words-B-5','practice-B-10','sentences-B','Lestoets']};
      for(const [j,p] of l.applications.entries()){
        p.newWordIds=ids(groups[i][j]);p.wordIds=p.newWordIds.slice();
        p.models=models[i][j].map(([sentence,audioTextKana,meaning,target],n)=>({id:`sentence-l11-${i+1}-${p.part}-compact-${n+1}`,sentence,audioTextKana,meaning,linkedWordIds:ids(target),parts:[]}));l.models.push(...p.models);
        p.questions=checks[i][j].map((q,n)=>({...q,sourceId:`exercise-${p.id}-${n+1}`}));
        p.grammarHint=i===1&&j===1?'〜てください is een beleefde opdracht. Herken よんでください als “lees alsjeblieft”. De bekende は, の en を blijven hetzelfde.':i===3&&j===1?'かくにん します betekent controleren. Je herkent dit als één korte handeling.':'Combineer de bekende は, の en を met de woorden van dit onderdeel.';
        const r=m.readings.find(r=>r.id===p.readingId);Object.assign(r,{text:p.models.map(model=>model.sentence).join('\n'),audioTextKana:p.models.map(model=>model.audioTextKana).join('\n'),translation:p.models.map(model=>model.meaning).join(' '),preparedAt:`11-${i+1}-${p.part}`,requiredVocabIds:j?l.wordIds.slice():p.wordIds.slice(),question:p.questions[0].prompt,answer:p.questions[0].answer,choices:p.questions[0].choices});
        for(const q of p.questions){const e=m.exercises.find(e=>e.id===q.sourceId);if(e)Object.assign(e,{payload:['order',q.prompt,q.answer,q.choices],context:r.text,requiredVocabIds:r.requiredVocabIds.slice(),requiredGrammarIds:[]})}
      }
    }
    const grammar=m.grammar.find(g=>g.id==='grammar-l11-home-1');Object.assign(grammar,{introducedAt:'11-2-B',availableFrom:'11-2-B',shortExplanation:'〜てください is een beleefde opdracht. よんでください betekent: lees alsjeblieft. Herken deze vorm eerst als geheel.',examples:['ページ の タイトル を よんでください。']});
    lesson(11,1).grammarIds=[];lesson(11,1).patternIds=[];lesson(11,2).grammarIds=[grammar.id];lesson(11,2).patternIds=['pattern-l11-home-1'];
    Object.assign(m.patterns.find(p=>p.id==='pattern-l11-home-1'),{introducedAt:'11-2-B',availableFrom:'11-2-B',examples:grammar.examples.slice()});
    Object.assign(m.instructions.find(i=>i.id==='choose-answer'),{textJa:'こたえ を えらびます。',requiredVocabIds:ids('こたえ えらびます'),introducedAt:'11-1-A'});
    const exam=lesson(11,5).integrationExam;exam.revision=2;
const order=exam.sources[2];Object.assign(order,{label:'Reisvoorbereiding in de app',text:'りょこう の じゅんび：ことば を ならべます。\nじゅんばん：さいしょ：ちず。つぎ：でんしゃ。おわり：ひこうき。\nこたえ を かくにん します。',audioTextKana:'りょこう の じゅんび、ことば お ならべます。じゅんばん、さいしょ、ちず。つぎ、でんしゃ。おわり、ひこうき。こたえ お かくにん します。',translation:'Reisvoorbereiding: zet de woorden in volgorde. Eerst: kaart. Daarna: trein. Tot slot: vliegtuig. Ik controleer het antwoord.',questions:[
      {sourceId:'exercise-l11-integration-trip-order',prompt:'Welke volgorde vraagt het oefenplan?',answer:'ちず → でんしゃ → ひこうき',choices:['ちず → でんしゃ → ひこうき','ひこうき → でんしゃ → ちず','でんしゃ → ちず → ひこうき'],targetVocabIds:ids('じゅんばん さいしょ つぎ おわり ならべます')},
      {sourceId:'exercise-l11-integration-trip-next',prompt:'Wat hoort op de plaats つぎ?',answer:'でんしゃ',choices:['でんしゃ','ちず','ひこうき'],targetVocabIds:ids('つぎ')},
      {sourceId:'exercise-l11-integration-trip-last',prompt:'Wat staat bij おわり?',answer:'ひこうき',choices:['ひこうき','ちず','でんしゃ'],targetVocabIds:ids('おわり')},
      {sourceId:'exercise-l11-integration-trip-check',prompt:'Wat moet je na het ordenen controleren?',answer:'het antwoord',choices:['het antwoord','de titel','het geluid'],targetVocabIds:ids('かくにん')},
      {sourceId:'exercise-l11-integration-trip-prepare',prompt:'Waarvoor is deze voorbereiding?',answer:'een reis',choices:['een reis','het ontbijt','een hotelkamer'],targetVocabIds:ids('りょこう じゅんび')},
      {sourceId:'exercise-l11-integration-trip-action',prompt:'Wat doe je met de woorden in deze opdracht?',answer:'in volgorde zetten',choices:['in volgorde zetten','opnieuw luisteren','een titel schrijven'],targetVocabIds:ids('ならべます')}
    ]});
    exam.sources[0].audioTextKana='レッスン いち、れんしゅう の もんだい。ページ いち、タイトル と ぶん お よんでください。しつもん、ことば の いみ わ？ただしい こたえ お えらびます。';
    exam.sources[1].audioTextKana='おんせい お ゆっくり きいてください。おと お くりかえします。くうらん、ことば、おと。うめてください。きごう、まる。こたえ お かいてください。';
    const allTargets=[...new Set(exam.sources.flatMap(s=>s.questions.flatMap(q=>q.targetVocabIds)))];
    for(const s of exam.sources){const r=m.readings.find(r=>r.id===s.id);Object.assign(r,{type:'notice',text:s.text,audioTextKana:s.audioTextKana,translation:s.translation,requiredVocabIds:allTargets});for(const q of s.questions)m.exercises.push({id:q.sourceId,lessonId:'l11-home-5',type:'order',payload:['order',q.prompt,q.answer,q.choices],context:s.text,requiredVocabIds:q.targetVocabIds.slice(),requiredGrammarIds:[]})}
    const fifth=lesson(11,5);fifth.didactics={...fifth.didactics,revision:3,newWordIds:[],canDo:fifth.goal};
    for(const [i,p] of fifth.applications.entries()){
      const s=exam.sources[i],r=m.readings.find(r=>r.id===p.readingId);Object.assign(r,{type:'notice',text:s.text,audioTextKana:s.audioTextKana,translation:s.translation,requiredVocabIds:allTargets});
      p.questions=s.questions.slice(0,2).map((q,n)=>({...q,sourceId:`exercise-${p.id}-${n+1}`}));
      for(const q of p.questions){const e=m.exercises.find(e=>e.id===q.sourceId);if(e)Object.assign(e,{payload:['order',q.prompt,q.answer,q.choices],context:r.text,requiredVocabIds:allTargets,requiredGrammarIds:[]})}
    }
    for(const l of m.lessons.filter(l=>l.level>=12&&l.level<=14))for(const p of l.applications){const r=m.readings.find(r=>r.id===p.readingId);r.requiredVocabIds=l.wordIds.slice();for(const q of p.questions){const e=m.exercises.find(e=>e.id===q.sourceId);if(e)e.requiredVocabIds=l.wordIds.slice()}}
    m.didacticSurfaceForms=m.didacticSurfaceForms.filter(f=>f.form!=='ききます');
    for(const [index,text] of ['ちず → でんしゃ → ひこうき','ひこうき → でんしゃ → ちず','でんしゃ → ちず → ひこうき'].entries())m.didacticUtterances.push({id:`sentence-l11-trip-order-${index+1}`,text,audioTextKana:text.replaceAll(' → ','、'),level:11,lessonId:fifth.id});
    m.contentVersion='1.7.1';
  }
  const api={apply};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.LanguageJourneyLevel11Integration=api;
})(typeof globalThis!=='undefined'?globalThis:this);
