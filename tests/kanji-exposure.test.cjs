const test=require('node:test'),assert=require('node:assert/strict');
const {createCrashCourseProbe}=require('./app-probe.cjs');
const content=require('../language-journey-content/content.js');
const plain=x=>JSON.parse(JSON.stringify(x));
test('assessed 私 requires exposure, recognition and the Level 11 lesson rank; old reviews are quarantined without touching word SRS',()=>{
  const id='vocab-わたし',wordKey=`${id}::jp-nl`,kanjiKey='kanji-card:私::jp-nl',record={dueAt:9000,intervalDays:4,repetitions:3,lapses:0,lastReviewedAt:100,lastGrade:'knew'},rank={'l4-3':{rank:'Copper',attempts:1,last:1}},base={thematicRevision:1,introducedVocabIds:[id],kanjiExposureIds:[id],flashcardProgress:{version:1,cards:{[wordKey]:record,[kanjiKey]:record}},guidelineEvidence:{version:1,words:{[id]:{kanji:{at:100,sourceId:'old-recall'}}},domains:{}}};
  const old=createCrashCourseProbe({savedState:base,savedRanks:rank});assert.ok(!old.flashcardEligibleCards().some(c=>c.id==='kanji-card:私'));assert.deepEqual(plain(old.state.flashcardProgress.cards[wordKey]),record);assert.equal(old.state.flashcardProgress.cards[kanjiKey],undefined);assert.deepEqual(plain(old.state.curriculumHistory.watashiKanjiQuarantine.cards[kanjiKey]),record);assert.equal(old.state.guidelineEvidence.words[id].kanji,undefined);
  const saved=old.saved(),again=createCrashCourseProbe({savedState:saved.state,savedRanks:saved.ranks});assert.deepEqual(plain(again.state.curriculumHistory.watashiKanjiQuarantine),plain(old.state.curriculumHistory.watashiKanjiQuarantine));assert.deepEqual(plain(again.state.flashcardProgress.cards[wordKey]),record);
  const evidence={[id]:{sourceId:'exercise-l11-home-1-watashi-kanji',at:200}},proven=createCrashCourseProbe({savedState:{...base,kanjiRecognitionEvidence:evidence},savedRanks:rank});assert.ok(!proven.flashcardEligibleCards().some(c=>c.id==='kanji-card:私'));assert.deepEqual(plain(proven.state.flashcardProgress.cards[kanjiKey]),record);
  proven.rankState['l11-home-1'].rank='Copper';const cards=proven.flashcardEligibleCards(),kanji=cards.find(c=>c.id==='kanji-card:私');assert.ok(kanji);assert.equal(kanji.lessonId,'l11-home-1');assert.equal(kanji.level,11);assert.equal(cards.filter(c=>c.id===id).length,1);
  proven.createFlashcardSession([{cardId:id,direction:'jp-nl'}],'scheduled');proven.renderFlashcardsScreen();assert.match(proven.element('flashcardView').innerHTML,/わたし/);assert.doesNotMatch(proven.element('flashcardView').innerHTML,/私/);
});
test('known kanji appear in block B and keep the existing Recall word card',()=>{
  const savedState={introducedVocabIds:['vocab-わたし'],thematicCompleted:{'l11-home-1':{A:true,B:true}},flashcardProgress:{version:1,cards:{'vocab-わたし::jp-nl':{dueAt:9000,intervalDays:4,repetitions:3,lapses:0,lastReviewedAt:100,lastGrade:'knew'}}}};
  const app=createCrashCourseProbe({savedState,savedRanks:{'l4-3':{rank:'Copper',attempts:1,last:1}}});assert.deepEqual(plain(app.state.kanjiExposureIds),[]);
  const before=plain(app.state.flashcardProgress);app.state.level=10;app.state.screen='module';app.openThematicLesson(0);app.startThematicPart('A');
  assert.doesNotMatch(app.element('thematicBody').innerHTML,/私/);app.state.thematic.microblockIndex=1;app.renderMain();assert.match(app.element('thematicBody').innerHTML,/私[\s\S]*わたし/);assert.deepEqual(plain(app.state.kanjiExposureIds),['vocab-わたし']);
  app.element('thematicWordsNext').onclick();assert.deepEqual(plain(app.state.kanjiExposureIds),['vocab-わたし']);
  const saved=app.saved(),reload=createCrashCourseProbe({savedState:saved.state,savedRanks:saved.ranks});assert.deepEqual(plain(reload.state.kanjiExposureIds),['vocab-わたし']);assert.deepEqual(plain(reload.state.flashcardProgress),before);
  assert.match(reload.dictionaryArticleHtml(reload.dictionaryById['vocab-わたし']),/Kanji: 私/);
  assert.ok(reload.flashcardEligibleCards().some(card=>card.id==='vocab-わたし'),'Recall reuses the same canonical word card');
});
test('seen, completed exercise and passed lesson have distinct kanji status and first Recall review',()=>{
  const id='vocab-わたし',sourceId='exercise-l11-home-1-watashi-kanji',now=Date.parse('2026-11-10T10:00:00Z');
  const initial={thematicRevision:1,introducedVocabIds:[id],kanjiExposureIds:[id],thematicCompleted:{'l11-home-1':{A:true,B:true}},kanjiRecognitionEvidence:{[id]:{sourceId,at:now-1000}}};
  const app=createCrashCourseProbe({savedState:initial,savedRanks:{},now});
  assert.deepEqual(plain(app.kanjiInventory()),{encountered:1,unlocked:0});assert.match(app.kanjiLearningStatus(id),/behaal de lestoets/);
  assert.equal(app.knowledgeSnapshot().kanji,0);assert.equal(app.state.jlptMilestones.kanji['私'],undefined);
  assert.ok(!app.flashcardEligibleCards().some(card=>card.id==='kanji-card:私'));
  app.rankState['l11-home-1'].rank='Copper';
  assert.deepEqual(plain(app.kanjiInventory()),{encountered:1,unlocked:1});assert.equal(app.knowledgeSnapshot().kanji,1);assert.match(app.kanjiLearningStatus(id),/Ontgrendeld/);
  const pool=app.flashcardEligibleCards(),card=pool.find(item=>item.id==='kanji-card:私');assert.equal(card.lessonId,'l11-home-1');assert.equal(pool.filter(item=>item.id===id).length,0,'the kanji check does not award word mastery');
  assert.ok(app.getRecallSession().queue.some(item=>item.cardId===card.id&&item.direction==='jp-nl'));assert.equal(app.state.flashcardProgress.cards['kanji-card:私::jp-nl'],undefined);
  const before=plain(app.state.jlptMilestones.lexemes);app.createFlashcardSession([{cardId:card.id,direction:'jp-nl',answerChoices:['ik']}],'scheduled');app.state.flashcardSession.optionsRevealed=true;app.state.flashcardSession.revealed=true;app.flashcardRate('knew','ik');
  assert.equal(app.state.jlptMilestones.kanji['私'].creditUnits,1);assert.deepEqual(plain(app.state.jlptMilestones.lexemes),before);assert.ok(!app.getRecallSession().queue.some(item=>item.cardId===card.id&&item.direction==='jp-nl'));assert.ok(app.state.flashcardProgress.cards['kanji-card:私::jp-nl'].dueAt>now);
  const saved=app.saved(),reloaded=createCrashCourseProbe({savedState:saved.state,savedRanks:saved.ranks,now});assert.deepEqual(plain(reloaded.kanjiInventory()),{encountered:1,unlocked:1});assert.equal(reloaded.knowledgeSnapshot().kanji,1);assert.equal(reloaded.state.jlptMilestones.kanji['私'].creditUnits,1);assert.equal(reloaded.state.flashcardProgress.cards['kanji-card:私::jp-nl'].repetitions,1);
});
test('later lesson kanji use their own recognition evidence, source and rank after reload',()=>{
  for(const [id,character,lesson,sourceId,level] of [
    ['vocab-みます','見','l11-home-3','exercise-l11-home-3-mimasu-kanji',3],
    ['vocab-いきます','行','l11-home-4','exercise-l11-home-4-ikimasu-kanji',4]
  ]){
    const evidence={[id]:{sourceId,at:200}},base={thematicRevision:1,introducedVocabIds:[id],kanjiExposureIds:[id],kanjiRecognitionEvidence:evidence};
    const app=createCrashCourseProbe({savedState:base,savedRanks:{}});assert.equal(app.kanjiInventory().encountered,1);assert.equal(app.kanjiInventory().unlocked,0);assert.ok(!app.flashcardEligibleCards().some(card=>card.id===`kanji-card:${character}`));
    app.rankState[lesson].rank='Copper';const card=app.flashcardEligibleCards().find(item=>item.id===`kanji-card:${character}`);assert.ok(card);assert.equal(card.lessonId,lesson);assert.equal(card.level,11);assert.equal(card.lessonIndex,level-1);assert.ok(app.getRecallSession().queue.some(item=>item.cardId===card.id&&item.direction==='jp-nl'));
    const saved=app.saved(),again=createCrashCourseProbe({savedState:saved.state,savedRanks:saved.ranks});assert.equal(again.state.kanjiRecognitionEvidence[id].sourceId,sourceId);assert.equal(again.flashcardEligibleCards().find(item=>item.id===card.id).lessonId,lesson);assert.equal(again.kanjiInventory().unlocked,1);
    const forged=createCrashCourseProbe({savedState:{...base,kanjiRecognitionEvidence:{[id]:{sourceId:'wrong-source',at:200}}},savedRanks:{[lesson]:{rank:'Copper',attempts:1,last:1}}});assert.equal(forged.state.kanjiRecognitionEvidence[id],undefined);assert.ok(!forged.flashcardEligibleCards().some(item=>item.id===card.id));
  }
});
test('kanji points follow known lexemes and Japan is distinct from the counter',()=>{
  for(const [id,point] of [['vocab-わたし','11-1-B'],['vocab-ひと','12-1-A'],['vocab-えき','13-1-A'],['vocab-でんしゃ','13-1-A'],['vocab-みず','14-1-A']]){const w=content.vocabById[id];assert.ok(content.pointOrder(w.introducedAt)<content.pointOrder(w.kanjiIntroducedAt),id);assert.equal(w.kanjiIntroducedAt,point)}
  assert.equal(content.vocabById['vocab-country-japan'].kanji,'日本');assert.equal(content.vocabById['vocab-country-japan'].kanjiIntroducedAt,null);assert.equal(content.vocabById['vocab-にほん'].kanji,null);
});
test('known vocabulary and acknowledged orthography are independent gates, including old saved exposures',()=>{
  const ids=['vocab-わたし','vocab-ひと','vocab-えき','vocab-でんしゃ','vocab-みず'];
  const app=createCrashCourseProbe({savedState:{thematicRevision:1,kanjiExposureIds:ids}});
  for(const id of ids)assert.equal(app.kanjiTextHtml(content.vocabById[id].kana,'15-5-B'),content.vocabById[id].kana);
  app.state.introducedVocabIds.push(...ids);
  for(const id of ids){const w=content.vocabById[id];assert.match(app.kanjiTextHtml(w.kana,w.kanjiIntroducedAt),new RegExp(`<summary[^>]*>${w.kanji}</summary><span>${w.kana}</span>`));assert.equal(app.kanjiTextHtml(w.kana,'10-5-B'),w.kana)}
  app.state.kanjiExposureIds=[];
  for(const id of ids)assert.equal(app.kanjiTextHtml(content.vocabById[id].kana,'15-5-B'),content.vocabById[id].kana);
});
test('Japan stays kana throughout Level 12 and later previews without losing a historical exposure or either sense',()=>{
  const id='vocab-country-japan',app=createCrashCourseProbe({savedState:{thematicRevision:1,introducedVocabIds:[id,'vocab-にほん'],kanjiExposureIds:[id]}});
  for(const point of ['12-1-A','12-5-A','13-1-A','15-5-B'])assert.equal(app.kanjiTextHtml('にほん',point,true,[id]),'にほん');
  assert.deepEqual(plain(app.kanjiIntroductionsFor(content.thematicCourses[11].lessons[4],'A')),[]);
  assert.equal(app.kanjiTextHtml('にほん',null,true,['vocab-にほん']),'にほん');
  assert.deepEqual(plain(app.saved().state.kanjiExposureIds),[id],'a corrected schedule does not erase historical exposure');
  assert.doesNotMatch(app.dictionaryArticleHtml(app.dictionaryById[id]),/Kanji: 日本/);
});
test('reading help uses the whole word, handles punctuation, and never reveals a gloss or grades an answer',()=>{
  const id='vocab-でんしゃ',app=createCrashCourseProbe({now:Date.parse('2026-11-01T10:00:00Z'),savedState:{thematicRevision:1,introducedVocabIds:[id],kanjiExposureIds:[id]},savedRanks:{'l13-1':{rank:'Gold',attempts:2,last:1}}});
  const html=app.kanjiTextHtml('「でんしゃ」 （でんしゃ） でんしゃまえ','13-1-A');
  assert.equal((html.match(/<summary/g)||[]).length,2);assert.match(html,/電車<\/summary><span>でんしゃ<\/span>/);assert.match(html,/でんしゃまえ$/);assert.doesNotMatch(html,/trein|romaji|data-dictionary|onclick|data-thematic-choice/);
  const before=plain(app.saved()),active={open:true},other={open:true};app.document.querySelectorAll=selector=>selector==='.reading-support[open]'?[active,other]:[];
  app.fireDocumentEvent('click',{target:{closest:selector=>selector==='.reading-support'?active:null}});
  assert.equal(active.open,true);assert.equal(other.open,false);assert.deepEqual(plain(app.saved()),before);
});
test('Recall keeps vocabulary cards in kana in both directions and retains their scheduling',()=>{
  const id='vocab-でんしゃ',other='vocab-えき',savedState={recallKanjiEnabled:true,thematicRevision:1,introducedVocabIds:[id,other],kanjiExposureIds:[id],flashcardDirections:['jp-nl','nl-jp']};
  const app=createCrashCourseProbe({savedState,savedRanks:{'l10-4':{rank:'Copper',attempts:1,last:.8},'l4-9':{rank:'Copper',attempts:1,last:.8}},now:Date.parse('2026-11-01T10:00:00Z')});
  for(const direction of ['jp-nl','nl-jp']){
    app.createFlashcardSession([{cardId:id,direction}], 'scheduled');app.state.flashcardSession.optionsRevealed=true;app.renderFlashcardsScreen();
    const html=app.element('flashcardView').innerHTML;
    assert.doesNotMatch(html,/電車/);
    assert.deepEqual(plain(app.state.flashcardProgress.cards),{});
    app.state.flashcardSession.revealed=true;app.flashcardRate('knew',direction==='jp-nl'?'trein':'でんしゃ');
    assert.equal(app.state.flashcardProgress.cards[`${id}::${direction}`].repetitions,1);
    assert.ok(Object.keys(app.state.flashcardProgress.cards).every(key=>key.startsWith(`${id}::`)));
    if(direction==='jp-nl')app.state.flashcardProgress.cards={};
  }
});
test('separately taught kanji joins the normal Recall planner as one character card without creating a second word',()=>{
  const word='vocab-でんしゃ',character='電',cardId='kanji-card:電',app=createCrashCourseProbe({savedState:{thematicRevision:1,introducedVocabIds:[word],kanjiExposureIds:[word],music:{componentEvidence:{[word]:['電','車']}}},savedRanks:{'l10-4':{rank:'Copper',attempts:1,last:1}}});
  const pool=app.flashcardEligibleCards();assert.ok(pool.some(card=>card.id===word));assert.equal(pool.filter(card=>card.orthographyCard&&card.kanjiCharacter===character).length,1);assert.ok(pool.some(card=>card.id===cardId));
  const scheduled=app.getRecallSession().queue;assert.ok(scheduled.some(item=>item.cardId===word));assert.ok(scheduled.some(item=>item.cardId===cardId));
  app.createFlashcardSession([{cardId,direction:'jp-nl',answerChoices:['trein','bus']}],'scheduled');app.state.flashcardSession.optionsRevealed=true;app.state.flashcardSession.revealed=true;app.renderFlashcardsScreen();
  assert.match(app.element('flashcardView').innerHTML,/電[\s\S]*\(in 電車\)[\s\S]*Wat betekent dit woord/);assert.doesNotMatch(app.element('flashcardView').innerHTML,/<mark>/);assert.doesNotMatch(app.element('flashcardView').innerHTML,/でんしゃ|reading-support/);
  app.flashcardRate('knew','trein');assert.equal(app.state.flashcardProgress.cards[`${cardId}::jp-nl`].repetitions,1);assert.equal(app.state.jlptMilestones.kanji[character].creditUnits,1);assert.equal(app.state.jlptMilestones.lexemes[word],undefined);
  const saved=app.saved(),reload=createCrashCourseProbe({savedState:saved.state,savedRanks:saved.ranks});assert.equal(reload.state.flashcardProgress.cards[`${cardId}::jp-nl`].repetitions,1);assert.equal(reload.state.jlptMilestones.kanji[character].creditUnits,1);
});
test('compound spelling gets its own mixed Recall card and independent persisted SRS without extra word or character credit',()=>{
  const word='vocab-でんしゃ',cardId=`kanji-word:${word}`,ranks={'l10-4':{rank:'Copper',attempts:1,last:1}},initial={introducedVocabIds:[word],kanjiExposureIds:[word]},app=createCrashCourseProbe({savedState:initial,savedRanks:ranks});
  const pool=app.flashcardEligibleCards();assert.ok(pool.some(card=>card.id===word));assert.ok(pool.some(card=>card.id===cardId));assert.ok(!pool.some(card=>card.id==='kanji-card:電'||card.id==='kanji-card:車'),'word exposure alone does not prove its components');
  assert.equal(app.getRecallSession().counts.words,pool.filter(card=>!card.orthographyCard).length);
  for(const [direction,answer] of [['jp-nl','でんしゃ'],['nl-jp','電車']]){
    app.createFlashcardSession([{cardId,direction,answerChoices:[answer]}],'scheduled');app.state.flashcardSession.optionsRevealed=true;app.state.flashcardSession.revealed=true;app.renderFlashcardsScreen();assert.match(app.element('flashcardView').innerHTML,/電車/);assert.ok(app.element('flashcardView').innerHTML.includes(answer));app.flashcardRate('knew',answer);assert.equal(app.state.flashcardProgress.cards[`${cardId}::${direction}`].repetitions,1);
  }
  assert.equal(app.state.jlptMilestones.lexemes[word],undefined);assert.equal(app.state.jlptMilestones.kanji['電'],undefined);
  const saved=app.saved(),again=createCrashCourseProbe({savedState:saved.state,savedRanks:saved.ranks});assert.equal(again.state.flashcardProgress.cards[`${cardId}::jp-nl`].repetitions,1);assert.equal(again.state.flashcardProgress.cards[`${cardId}::nl-jp`].repetitions,1);assert.ok(again.flashcardEligibleCards().some(card=>card.id===cardId));
  const locked=createCrashCourseProbe({savedState:{introducedVocabIds:[word],kanjiExposureIds:[word]}});assert.ok(!locked.flashcardEligibleCards().some(card=>card.id===cardId),'orthography needs Copper as well as exposure');
  const single=createCrashCourseProbe({savedState:{introducedVocabIds:['vocab-わたし'],kanjiExposureIds:['vocab-わたし'],music:{introduced:['vocab-わたし']}}});assert.ok(!single.flashcardEligibleCards().some(card=>card.id==='kanji-word:vocab-わたし'));
});
test('active answer options suppress reading support and still respect lesson boundaries',()=>{
 const app=createCrashCourseProbe({savedState:{thematicRevision:1,introducedVocabIds:['vocab-えき'],kanjiExposureIds:['vocab-えき']}});
 app.state.level=11;app.state.screen='module';app.openThematicLesson(0);app.state.thematic={level:12,lessonIndex:0,part:'A',step:'questions',questionIndex:0,correct:0,answered:false,optionsRevealed:true,flowRevision:1};app.renderMain();
 assert.doesNotMatch(app.element('thematicBody').innerHTML,/reading-support[^>]*[^]*?駅/);
 app.state.level=12;app.openThematicLesson(2);const lesson=content.thematicCourses[12].lessons[2],part=lesson.applications.find(p=>p.part==='B'),index=part.questions.findIndex(q=>q.choices.includes('えき'));assert.ok(index>=0);
 app.state.thematic={level:13,lessonIndex:2,part:'B',step:'questions',questionIndex:index,correct:0,answered:false,optionsRevealed:true,flowRevision:1};app.renderMain();const html=app.element('thematicBody').innerHTML;
 assert.match(html,/>駅<\/button>/);assert.doesNotMatch(html,/<details class="reading-support"/);
});
