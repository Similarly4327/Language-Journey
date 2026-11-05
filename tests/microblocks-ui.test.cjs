const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const content=require('../language-journey-content/content.js'),{validate}=require('../language-journey-content/validate.cjs');
const {createCrashCourseProbe}=require('./app-probe.cjs');
const plain=value=>JSON.parse(JSON.stringify(value)),now=Date.parse('2026-11-02T10:00:00Z');
// Inspect the actual emitted markup, including ancestors. This catches a stem
// accidentally moved inside the hidden answer region, unlike substring checks.
function nodes(html){
  const out=[],stack=[];for(const match of html.matchAll(/<(\/?)([a-z][a-z0-9-]*)\b([^>]*)>/gi)){
    const [,close,tag,attrs]=match;if(close){const node=stack.pop();if(node)node.end=match.index;continue}
    const node={tag,attrs,start:match.index,body:match.index+match[0].length,parent:stack.at(-1)};out.push(node);
    if(!['br','img','input','hr','meta','link'].includes(tag))stack.push(node);
  }return out;
}
const hasClass=(node,name)=>new RegExp('class="[^"]*\\b'+name+'\\b').test(node.attrs);
function assertVisibleStem(html,prompt){
  const tree=nodes(html),stem=tree.find(node=>node.attrs.includes('id="thematicQuestionStem"')),answers=tree.find(node=>hasClass(node,'thematic-choices'));
  assert.ok(stem,'a distinct question stem is emitted');assert.ok(answers);assert.ok(stem.start<answers.start);
  assert.ok(html.slice(stem.body,stem.end).includes(prompt));
  for(let node=stem;node;node=node.parent)assert.ok(!/inert|aria-hidden="true"|class="[^"]*(?:hidden|is-hidden)|display\s*:\s*none|filter\s*:\s*blur/.test(node.attrs),'stem and its ancestors remain visible');
  assert.ok(!tree.some(node=>node===stem&&node.parent===answers));
  for(const option of tree.filter(node=>node.attrs.includes('data-thematic-choice='))){assert.match(option.attrs,/disabled/);assert.match(option.attrs,/tabindex="-1"/);assert.match(option.parent.attrs,/inert aria-hidden="true"/)}
  return{stem,answers,tree};
}
test('emitted source and complete stem stay outside the reveal region at a 375px VM viewport, across 11–14',()=>{
  const app=createCrashCourseProbe({width:375,now});
  for(const level of [11,12,13,14])for(const index of level===11?[0,1,2,3]:[0,2,4])for(const partName of ['A','B']){
    app.state.level=level-1;app.state.screen='module';app.state.thematic={level,lessonIndex:index,part:partName,step:'questions',microblockIndex:1,flowRevision:level===11?3:1,questionIndex:0,correct:0,answered:false,optionsRevealed:false};
    app.renderMain();const lesson=content.thematicCourses[level-1].lessons[index],part=lesson.applications.find(p=>p.part===partName),before=app.element('thematicBody').innerHTML;
    const {answers}=assertVisibleStem(before,part.questions[0].prompt);assert.ok(hasClass(answers,'thematic-choices-hidden'));assert.match(before,/thematic-question-source/);
    const visibleCopy=before.replace(/<[^>]*>/g,'').replace(/\s/g,'');assert.ok(visibleCopy.includes(content.manifest.readings.find(reading=>reading.id===part.readingId).text.split('\n')[0].replace(/\s/g,'')));
    const progress=plain({ranks:app.rankState,srs:app.state.flashcardProgress,errors:app.state.errorBank,correct:app.state.thematic.correct});
    app.element('thematicReveal').onclick({preventDefault(){},stopPropagation(){}});const after=app.element('thematicBody').innerHTML;
    assert.ok(after.includes(part.questions[0].prompt));assert.doesNotMatch(after,/thematic-choices-hidden|id="thematicReveal"/);
    assert.deepEqual(plain({ranks:app.rankState,srs:app.state.flashcardProgress,errors:app.state.errorBank,correct:app.state.thematic.correct}),progress);
  }
  const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
  assert.match(html,/\.thematic-choices-hidden>\.flashcard-options-reveal\{position:static;inset:auto/);
});
test('all Level 11 lesson checks and integration sources/stems remain visible before quiz reveal',()=>{
  const app=createCrashCourseProbe({width:375,now}),lessons=content.thematicCourses[10].lessons;
  for(const q of [...lessons.slice(0,4).flatMap(lesson=>app.thematicQuestions(lesson)),...app.buildLevel11IntegrationQuestions()]){
    app.startQuiz({title:'Bron en vraag',source:'advanced',official:false,questions:[q],pool:[]});
    assert.equal(app.state.quiz.optionsRevealed,false);assert.equal(app.element('qChoices').classList.contains('quiz-options-hidden'),true);
    assert.equal(app.element('qPrompt').textContent,q.prompt);assert.ok(app.element('qContext').textContent.length>0);assert.equal(app.element('qContext').classList.contains('hidden'),false);
    const prompt=app.element('qPrompt').textContent,source=app.element('qContext').textContent;app.revealQuizOptions();
    assert.equal(app.element('qPrompt').textContent,prompt);assert.equal(app.element('qContext').textContent,source);assert.equal(app.state.quiz.score,0);
  }
});
test('old A/B completion and ranks map to four completed blocks without rewriting SRS, scores or exposure',()=>{
  const ranks={'l11-home-1':{rank:'Gold',attempts:3,last:1}},reviews={'vocab-レベル::jp-nl':{dueAt:now+86400000,repetitions:3,intervalDays:7,lapses:0,lastGrade:'knew',lastReviewedAt:now-1000}};
  const app=createCrashCourseProbe({now,savedRanks:ranks,savedState:{thematicRevision:1,thematicCompleted:{'l11-home-2':{A:true,B:false}},thematicScores:{'l11-home-1':{A:2,B:2}},kanjiExposureIds:['vocab-わたし'],introducedVocabIds:['vocab-わたし'],flashcardProgress:{cards:reviews},thematic:{level:11,lessonIndex:1,part:'B',step:'questions',flowRevision:2,questionIndex:1,correct:1,answered:true,selected:'de letters en het teken'}}});
  assert.deepEqual(plain(app.state.thematicMicroblocks['l11-home-1']),{A:true,B:true,C:true,D:true});assert.deepEqual(plain(app.state.thematicMicroblocks['l11-home-2']),{A:true,B:true});
  assert.equal(app.state.thematic.microblockIndex,1);assert.equal(app.state.thematic.flowRevision,3);assert.equal(app.state.thematic.step,'questions');assert.equal(app.state.thematic.questionIndex,1);assert.equal(app.state.thematic.correct,1);assert.equal(app.state.thematic.answered,true);
  for(const key of ['rank','attempts','last'])assert.equal(app.rankState['l11-home-1'][key],ranks['l11-home-1'][key]);assert.deepEqual(plain(app.state.flashcardProgress.cards),reviews);assert.deepEqual(plain(app.state.thematicScores['l11-home-1']),{A:2,B:2});assert.deepEqual(plain(app.state.kanjiExposureIds),['vocab-わたし']);
  const saved=app.saved(),again=createCrashCourseProbe({now,savedState:saved.state,savedRanks:saved.ranks});assert.deepEqual(plain(again.state.thematicMicroblocks),plain(app.state.thematicMicroblocks));assert.deepEqual(plain(again.state.flashcardProgress.cards),reviews);
});
test('new block progress resumes at B without opening later words; mandatory 11–14 screens never introduce kanji',()=>{
  const app=createCrashCourseProbe({now});app.state.level=10;app.state.screen='module';app.openThematicLesson(0);app.startThematicPart('A');app.element('thematicWordsNext').onclick();app.completeWordCrashCourse();
  while(app.state.thematic.step==='sentences')app.element('thematicSentenceNext').onclick();assert.equal(app.state.thematic.microblockIndex,1);
  const saved=app.saved(),reload=createCrashCourseProbe({now,savedState:saved.state,savedRanks:saved.ranks});reload.state.level=10;reload.state.screen='module';reload.openThematicLesson(0);reload.startThematicPart('A');assert.equal(reload.state.thematic.microblockIndex,1);assert.match(reload.element('thematicBody').innerHTML,/Oefening 1 · stap 2\/2/);
  for(const level of [11,12,13,14]){reload.state.level=level-1;reload.openThematicLesson(0);reload.startThematicPart('A');assert.doesNotMatch(reload.element('thematicBody').innerHTML,/私|人|電車|駅|水|日本/);assert.deepEqual(plain(reload.state.kanjiExposureIds),[])}
});
test('validator counts grammar and kanji in the same three-target budget',()=>{
  const m=structuredClone(content.manifest),block=m.lessons.find(lesson=>lesson.id==='l11-home-1').didactics.microblocks[0];block.kanjiWordIds=['vocab-わたし'];assert.ok(validate(m).diagnostics.some(item=>item.code==='MICROBLOCK_OVERLOAD'));
});
test('Levels 12–14 use A–D preparation without quotas or exposing a later block early',()=>{
  for(const level of [12,13,14])for(let lessonIndex=0;lessonIndex<5;lessonIndex++){
    const app=createCrashCourseProbe({now}),lesson=content.thematicCourses[level-1].lessons[lessonIndex];app.state.level=level-1;app.state.screen='module';app.openThematicLesson(lessonIndex);
    assert.match(app.element('thematicBody').innerHTML,/Oefening 1/);assert.match(app.element('thematicBody').innerHTML,/Oefening 2/);assert.doesNotMatch(app.element('thematicBody').innerHTML,/A → B → C → D/);
    for(const part of lesson.didactics.preparationMicroblocks?['A']:['A','B']){app.startThematicPart(part);
    for(const block of lesson.didactics.microblocks.filter(block=>block.sourcePart===part)){
      assert.equal(app.state.thematic.microblockIndex,block.index);assert.equal(app.state.thematic.step,'words');assert.ok(block.wordIds.length+block.grammarIds.length<=3);
      for(const future of lesson.didactics.microblocks.filter(next=>'ABCD'.indexOf(next.key)>'ABCD'.indexOf(block.key)))for(const id of future.wordIds)assert.ok(!app.state.introducedVocabIds.includes(id),`${lesson.id} ${block.key}: ${id}`);
      app.element('thematicWordsNext').onclick();if(block.wordIds.length){assert.equal(app.activeWordCrashCourse.deck.length,2*block.wordIds.length);app.completeWordCrashCourse()}
      let guard=0;while(app.state.thematic.step==='sentences'&&guard++<30)app.element('thematicSentenceNext').onclick();
    }
    assert.equal(app.state.thematic.step,lesson.didactics.preparationMicroblocks?'reading':'questions');}
    for(const id of lesson.didactics.newWordIds)assert.ok(app.state.introducedVocabIds.includes(id));assert.deepEqual(plain(app.state.kanjiExposureIds),[]);
    assert.deepEqual(plain(app.state.thematicMicroblocks[lesson.id]),{A:true,B:true,C:true,D:true});
  }
});
