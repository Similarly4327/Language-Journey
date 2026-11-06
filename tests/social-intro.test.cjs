const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {createCrashCourseProbe}=require('./app-probe.cjs'),content=require('../language-journey-content/content.js');
const plain=value=>JSON.parse(JSON.stringify(value));
const protectedProgress=app=>plain({level7:app.rankState['l7-exam'],oldRank:app.rankState['l4-1'],oldSteps:app.state.advancedStepProgress,oldLesson:app.state.advancedLesson,srs:app.state.flashcardProgress,errors:app.state.errorBank,kanji:app.state.kanjiExposureIds,profile:[app.state.avatarName,app.state.selectedAvatarSkin,app.state.avatarMode]});

test('intro is an additive chapter before Level 7; old routes and lesson/rank identities remain stable',()=>{
  assert.equal(content.levels.length,15);assert.equal(content.advancedCourses[6].lessons.length,5);
  assert.deepEqual(content.advancedCourses[6].lessons.map(l=>l.id),['l7-1','l7-2','l7-3','l7-4','l7-5']);
  assert.equal(content.manifest.socialIntro.placementBeforeLevel,7);assert.equal(content.introLessons.length,4);
  const sandbox={window:{}};vm.runInNewContext(fs.readFileSync('navigation.js','utf8'),sandbox);const nav=sandbox.window.LanguageJourneyNavigation;
  assert.equal(nav.parseHash('#/course/japanese/learn/intro',{japanese:{}}).screen,'intro');
  for(let level=1;level<=15;level++){const route=nav.parseHash(`#/course/japanese/learn/level/${level}`,{japanese:{}});assert.equal(route.level,level-1);assert.equal(nav.formatHash(route),`#/course/japanese/learn/level/${level}`)}
  assert.equal(nav.formatHash({screen:'intro',courseId:'japanese'}),'#/course/japanese/learn/intro');
});

test('all requested expressions have one canonical source and both directions before a lesson check',()=>{
  const app=createCrashCourseProbe({width:375}),seen=new Set();app.state.currentCourse='japanese';
  app.openSocialIntro();assert.equal(app.state.screen,'intro');assert.match(app.element('mainView').innerHTML,/Kennismaken/);
  for(const lesson of content.introLessons){
    app.openIntroLesson(lesson.id);const words=lesson.wordIds.map(id=>content.vocabById[id]);
    for(const word of words){seen.add(word.jp.replaceAll(' ',''));assert.ok(word.sourceFound);assert.equal(word.lessonId,lesson.id);assert.ok(app.state.introducedVocabIds.includes(word.id));assert.equal(content.vocabCatalog.filter(w=>w.jp===word.jp&&!w.legacy).length,1)}
    const html=app.element('introBody').innerHTML;for(const word of words){assert.ok(html.includes(word.jp));assert.ok(html.includes(word.romaji));assert.ok(html.includes(word.meaning))}
    app.element('introPractice').onclick();assert.equal(app.activeWordCrashCourse.deck.length,words.length*2);
    for(const word of words)for(const direction of ['jp-nl','nl-jp'])assert.equal(app.activeWordCrashCourse.deck.filter(q=>q.word.id===word.id&&q.direction===direction).length,1);
    app.completeWordCrashCourse();assert.equal(app.state.intro.step,'dialogue');assert.match(app.element('introBody').innerHTML,/Een kort gesprek/);
    app.element('introCheck').onclick();assert.equal(app.state.quiz.rankId,lesson.id);app.state.quiz.score=app.state.quiz.questions.length;app.finishQuiz();assert.equal(app.rankState[lesson.id].rank,'Copper');app.element('nextBtn').onclick();assert.equal(app.state.intro.step,'list');
  }
  for(const form of ['おはようございます','こんにちは','こんばんは','おやすみなさい','はじめまして','おなまえはなんですか','よろしくおねがいします','ありがとう','またね','さようなら'])assert.ok(seen.has(form),form);
  assert.ok(content.introLessons[2].models[0].sentence.includes('{{avatarNameJapanese}}'));
});

test('intro question options are unambiguous, bounded to its words, and use the ordinary rank/result path',()=>{
  const app=createCrashCourseProbe({savedState:{avatarGender:'male',avatarName:'Haru',avatarNameJapanese:'ハル',avatarNameCustom:true,avatarNameJapaneseCustom:true}});app.openSocialIntro();
  for(const lesson of content.introLessons){const questions=app.introQuestions(lesson);for(const q of questions){assert.ok(q.choices.includes(q.correct));assert.equal(new Set(q.choices).size,q.choices.length);assert.ok(q.choices.length>=2);assert.ok(content.manifest.exercises.some(e=>e.id===q.sourceId))}for(const id of lesson.wordIds)for(const dir of ['jp-nl','nl-jp'])assert.equal(questions.filter(q=>q.targetWordId===id&&q.targetDirection===dir).length,1)}
  const meeting=app.introQuestions(content.introLessons[2]).find(q=>q.targetGoalIds?.includes('intro:self-introduction'));assert.equal(meeting.correct,'わたし は ハル です。');assert.ok(!JSON.stringify(meeting).includes('{{'));
  app.startIntroCheck(content.introLessons[0],false);assert.equal(app.state.quiz.official,false);assert.equal(app.state.quiz.rankId,null);
  app.startIntroExam();assert.equal(app.state.quiz.questions.length,27);app.state.quiz.score=27;app.finishQuiz();assert.equal(app.rankState['intro-exam'].rank,'Copper');
  assert.ok(content.introLessons.flatMap(l=>l.wordIds).every(id=>app.state.introducedVocabIds.includes(id)));
});

test('old level/exam progress cannot introduce or unlock new intro Recall cards; reload is idempotent',()=>{
  const savedState={level:7,advancedLesson:{6:3,7:5},advancedStepProgress:{'l7-3':['words','model']},introducedVocabIds:['vocab-ねこ'],kanjiExposureIds:['vocab-わたし'],recallKanjiEnabled:true,avatarName:'Custom',avatarNameCustom:true,avatarMode:'manual',selectedAvatarSkin:'skin-4',unlockedAvatarSkins:['skin-1','skin-4'],flashcardProgress:{cards:{'vocab-ねこ::jp-nl':{dueAt:9000,repetitions:3,intervalDays:7}}},errorBank:{advanced:[{key:'old',question:{kind:'mc',prompt:'oude vraag',correct:'ja',choices:['ja','nee']},count:2}]}};
  const savedRanks={'l7-exam':{rank:'Gold',attempts:5,last:.95},'l4-1':{rank:'Silver',attempts:4,last:.9}};
  const app=createCrashCourseProbe({savedState,savedRanks}),before=protectedProgress(app),ids=content.introLessons.flatMap(l=>l.wordIds);
  assert.ok(!app.flashcardEligibleCards().some(w=>ids.includes(w.id)));assert.ok(ids.every(id=>!app.state.introducedVocabIds.includes(id)));
  app.openSocialIntro();app.openIntroLesson(content.introLessons[0].id);assert.ok(!app.flashcardEligibleCards().some(w=>ids.includes(w.id)),'viewing is not Copper');
  assert.deepEqual(protectedProgress(app),before);const saved=app.saved();
  const again=createCrashCourseProbe({savedState:saved.state,savedRanks:saved.ranks});assert.equal(again.state.intro.lessonId,'intro-greetings');assert.equal(again.state.intro.step,'words');assert.equal(again.state.recallKanjiEnabled,true);assert.deepEqual(protectedProgress(again),before);
  again.startIntroCheck(content.introLessons[0]);again.state.quiz.score=again.state.quiz.questions.length;again.finishQuiz();assert.deepEqual(plain(again.flashcardEligibleCards().filter(w=>ids.includes(w.id)).map(w=>w.id).sort()),content.introLessons[0].wordIds.slice().sort());
});
