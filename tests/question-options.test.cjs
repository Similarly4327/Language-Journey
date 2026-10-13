const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const content=require('../language-journey-content/content.js');
const {createCrashCourseProbe}=require('./app-probe.cjs');
const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
const context={window:{LanguageJourneyContent:content},shuffle:items=>[...items]};
vm.runInNewContext(html.slice(html.indexOf('function level4Choices('),html.indexOf('function level4Question(')),context);

test('small current lessons supplement vocabulary options from known words of the same kind',()=>{
  const word=content.vocabById['vocab-みせて'],current=[word,content.vocabById['vocab-メニュー']];
  const earlier=content.vocabCatalog.filter(w=>!w.legacy&&(w.level<10||(w.level===10&&w.lessonIndex<=1)));
  const options=context.vocabularyChoices(word,current,earlier);
  assert.equal(options.length,4);assert.equal(new Set(options).size,4);assert.ok(options.includes(word.jp));
  assert.ok(!options.includes('メニュー'));
  for(const label of options){
    const entry=content.manifest.vocabulary.find(w=>w.japanese===label);
    assert.equal(entry.partOfSpeech,'verb');assert.ok(earlier.some(w=>w.id===entry.id));
  }
});

test('two, three and four options reflect the distinct valid pool, without invented answers',()=>{
  const words=['ねこ','いぬ','みず','さかな'].map(jp=>content.vocabById['vocab-'+jp]);
  for(const count of [2,3,4])assert.equal(context.vocabularyChoices(words[0],words.slice(0,count),words.slice(0,count)).length,count);
  const synonym={...words[1],meaning:words[0].meaning,meanings:[words[0].meaning]};
  assert.deepEqual(Array.from(context.vocabularyChoices(words[0],[words[0],synonym,words[2]],[])).sort(),['ねこ','みず']);
  assert.equal(context.level4Choices('a',['a','b','b','c','d']).length,4);
});

test('word practice can supplement a two-word lesson with earlier introduced words, never future words',()=>{
  const earlier=content.vocabCatalog.filter(w=>!w.legacy&&(w.level<10||(w.level===10&&w.lessonIndex<=1)));
  const probe=createCrashCourseProbe({savedState:{introducedVocabIds:earlier.map(w=>w.id)}});
  const current=probe.lessonNewWords(probe.advancedCourses[9].lessons[1]);
  for(const q of probe.wordCrashCourseDeck(current).filter(q=>q.word.id==='vocab-みせて')){
    assert.equal(q.choices.length,4);
    for(const label of q.choices)assert.ok(earlier.some(w=>label===(q.direction==='jp-nl'?w.meaning:w.jp)));
  }
});

test('Level 10 lesson and exam preserve goals and offer four choices for show me across shuffles',()=>{
  let examOccurrences=0;
  for(let seed=1;seed<=16;seed++){
    const probe=createCrashCourseProbe({seed}),course=probe.advancedCourses[9];
    const question=probe.advancedQuestionPool(course,course.lessons[1],1).current.find(q=>q.correct==='みせて');
    assert.equal(question.choices.length,4);assert.equal(question.sourceId,'context-l10-2-word-vocab-みせて');
    for(const label of question.choices){const word=content.vocabCatalog.find(w=>w.jp===label);assert.ok(word&&!word.legacy);assert.ok(word.level<10||word.lessonIndex<=1);}
    for(const [index,lesson]of course.lessons.entries())for(const q of probe.advancedQuestionPool(course,lesson,index).current.filter(q=>q.kind!=='build'))assert.equal(q.choices.length,4,q.sourceId);
    for(const q of probe.buildAdvancedExamQuestions(course).filter(q=>q.correct==='みせて')){
      examOccurrences++;assert.equal(q.choices.length,4);assert.equal(q.targetWordId,'vocab-みせて');assert.ok(!q.choices.includes('メニュー'));
    }
  }
  assert.ok(examOccurrences>0);
});

test('kana options never import untaught rows or a second valid spelling of the same sound',()=>{
  const elements=new Map(),answers=[];
  const env={shuffle:items=>[...items],hasDakutenSourceContext:()=>false,dakutenPatterns:[],
    $:id=>{if(!elements.has(id))elements.set(id,{});return elements.get(id)},addChoice:(box,label,correct)=>answers.push({label,correct})};
  vm.runInNewContext(html.slice(html.indexOf('function renderKanaQ('),html.indexOf('function renderScriptReverseQ(')),env);
  const pool=content.hira[0].map(([front,back],i)=>({id:'h-'+i,front,back,script:'hiragana'}));
  for(const count of [2,3,5]){
    answers.length=0;env.renderKanaQ({pool:pool.slice(0,count),source:'hiragana',choices:3},{item:pool[0],mode:'forward'},{});
    assert.equal(answers.length,Math.min(4,count));assert.equal(answers.filter(a=>a.correct).length,1);
  }
  answers.length=0;
  env.renderKanaQ({pool:[pool[0],{...pool[0],id:'alternative',front:'ぁ'},pool[1]],source:'mix'}, {item:pool[0],mode:'reverse'},{});
  assert.equal(answers.length,2);assert.ok(!answers.some(a=>a.label==='ぁ'));
});
