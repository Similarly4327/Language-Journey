const test=require('node:test'),assert=require('node:assert/strict');
const {createCrashCourseProbe}=require('./app-probe.cjs');
const content=require('../language-journey-content/content.js');
const storytime=require('../language-journey-content/storytime.js');
const plain=value=>JSON.parse(JSON.stringify(value));
const learning=app=>plain({ranks:app.rankState,mastery:app.vocabMastery,kana:app.itemMastery,introduced:app.state.introducedVocabIds,firstSeen:app.state.vocabFirstSeen,errors:app.state.errorBank,srs:app.state.flashcardProgress,completed:app.state.thematicCompleted});

test('optional Storytime has two read-only rounds, persists its place and is open before the exam',()=>{
  const app=createCrashCourseProbe({width:375,savedState:{avatarGender:'male',avatarName:'Haru',avatarNameJapanese:'ハル',avatarNameCustom:true,avatarNameJapaneseCustom:true}});
  app.state.level=10;app.state.screen='level';app.renderMain();const before=learning(app);
  assert.equal(storytime.stories.length,1);assert.equal(app.rankState['l11-exam'].rank,null);
  app.openStorytime('storytime-home-1');let html=app.element('mainView').innerHTML;
  assert.match(html,/ronde 1\/2/);assert.match(html,/ただいま。/);assert.match(html,/ハル/);assert.match(html,/Miku · ミク/);assert.match(html,/data-audio-key="dialogue-storytime-home-1"/);assert.doesNotMatch(html,/Ik ben thuis\.|data-fc-answer|data-thematic-choice/);
  app.element('storytimeNext').onclick();html=app.element('mainView').innerHTML;assert.match(html,/ronde 2\/2/);assert.match(html,/Ik ben thuis\./);
  const saved=app.saved(),reload=createCrashCourseProbe({savedState:saved.state,savedRanks:saved.ranks});reload.state.level=10;reload.state.screen='module';reload.renderMain();assert.match(reload.element('mainView').innerHTML,/ronde 2\/2/);
  app.element('storytimeRestart').onclick();assert.match(app.element('mainView').innerHTML,/ronde 1\/2/);app.element('storytimeNext').onclick();app.element('storytimeNext').onclick();assert.equal(app.state.screen,'level');assert.equal(app.state.thematic.step,'list');
  assert.deepEqual(learning(app),before);assert.ok(storytime.stories.every(story=>!content.vocabById[story.id]));
});

test('Storytime switches the second named companion and reads the spoken lines in character voices',()=>{
  const story=storytime.stories[0],app=createCrashCourseProbe({savedState:{avatarGender:'female',avatarName:'Miku',avatarNameJapanese:'ミク'}});app.state.level=10;app.openStorytime(story.id);const html=app.element('mainView').innerHTML;
  assert.match(html,/Miku · ミク/);assert.match(html,/Ren · レン/);assert.match(html,/data-audio-key="dialogue-storytime-home-1"/);
  const dialogue=content.audioEntryById[story.dialogueId].entry;assert.equal(dialogue.lines.find(line=>line.sentenceId===story.lines.find(item=>item.speaker==='ren').audioId).speakerRole,'B');assert.equal(dialogue.lines.find(line=>line.sentenceId===story.lines.find(item=>item.speaker==='miku').audioId).speakerRole,'A');
});

test('Recall shows explicitly introduced kanji in the mixed pool without an optional deck switch',()=>{
  const id='vocab-でんしゃ',app=createCrashCourseProbe({savedState:{thematicRevision:1,introducedVocabIds:[id],kanjiExposureIds:[id]},savedRanks:{'l10-4':{rank:'Copper',attempts:1,last:1}}});
  app.state.screen='flashcards';app.createFlashcardSession([{cardId:id,direction:'jp-nl'}],'scheduled');app.state.flashcardSession.optionsRevealed=true;app.renderFlashcardsScreen();
  const before=plain({progress:app.state.flashcardProgress,queue:app.state.flashcardSession.queue,position:app.state.flashcardSession.position});
  assert.match(app.element('flashcardView').innerHTML,/電車/);assert.doesNotMatch(app.element('flashcardView').innerHTML,/fcKanjiEnabled|Bekende woorden ook in kanji tonen/);assert.doesNotMatch(app.element('flashcardView').innerHTML,/reading-support/,'the active target has no reading clue');
  assert.deepEqual(plain({progress:app.state.flashcardProgress,queue:app.state.flashcardSession.queue,position:app.state.flashcardSession.position}),before);
  const saved=app.saved(),reload=createCrashCourseProbe({savedState:saved.state,savedRanks:saved.ranks});assert.equal(reload.state.recallKanjiEnabled,false);assert.match(reload.jlptProgressHtml(),/vijf afzonderlijke geslaagde Recall-herhalingen/);
});

test('only Japanese-time reading questions lose digital labels in every generated agenda source',()=>{
  const agenda=content.advancedCourses[7].lessons.find(lesson=>lesson.id==='l8-6');
  const targets=agenda.targetQuestions.filter(q=>q.timeReadingTarget);assert.equal(targets.length,4);
  for(const q of targets){assert.doesNotMatch(q.context,/\d{1,2}:\d{2}/);assert.match(q.context,/ごぜん|ごご/);const canonical=content.manifest.exercises.find(e=>e.id===q.sourceId);assert.equal(canonical.context,q.context)}
  for(const q of agenda.targetQuestions.filter(q=>!q.timeReadingTarget))assert.match(q.context,/13:30|07:15|19:45/);
  assert.match(agenda.agendaText,/13:30/);assert.match(content.advancedCourses[7].lessons.find(l=>l.id==='l8-5').targetQuestions.find(q=>q.sourceId==='level8-digital-13').context,/13:00/);
  const app=createCrashCourseProbe();for(let seed=0;seed<6;seed++)for(const q of app.buildAdvancedExamQuestions(app.advancedCourses[7]).filter(q=>targets.some(t=>t.sourceId===q.sourceId)))assert.doesNotMatch(q.context,/\d{1,2}:\d{2}/);
});

test('two exercise labels depend on actual introduction while block order and IDs remain untouched',()=>{
  const app=createCrashCourseProbe({width:375});app.state.level=10;app.state.screen='module';app.openThematicLesson(0);
  assert.equal(app.thematicExerciseLabel(1),'Oefening 1');assert.match(app.element('thematicBody').innerHTML,/Oefening 2/);assert.doesNotMatch(app.element('thematicBody').innerHTML,/Blok|A → B|A \+ B|C \+ D/);
  app.state.introducedVocabIds.push('vocab-れんしゅう');assert.equal(app.thematicExerciseLabel(2),'れんしゅう 2');
  assert.deepEqual(content.thematicCourses[10].lessons[0].didactics.microblocks.map(b=>b.key),['A','B','C','D']);
});
