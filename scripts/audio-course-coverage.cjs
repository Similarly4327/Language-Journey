'use strict';
// Read-only probe: enumerate the actual question banks, including generated variants.
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const content = require('../language-journey-content/content.js');
const {fakeElement, seededRandom} = require('../tests/app-probe.cjs');
const root = path.resolve(__dirname, '..');
function createProbe(recordings) {
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const elements = new Map(), get = id => {if (!elements.has(id)) elements.set(id, fakeElement(id)); return elements.get(id);};
  const document = {body:fakeElement(), documentElement:fakeElement(), hidden:false, getElementById:get,
    createElement:()=>fakeElement(), querySelectorAll:()=>[], querySelector:()=>fakeElement(), addEventListener(){}};
  const window = {LanguageJourneyContent:content,innerWidth:390,innerHeight:844,addEventListener(){},setTimeout(){},clearTimeout(){},matchMedia:()=>({matches:false,addEventListener(){}})};
  const math = Object.create(Math); math.random = seededRandom(1);
  const sandbox = {document,window,localStorage:{getItem:()=>null,setItem(){},removeItem(){}},location:{hash:''},performance:{now:()=>0},navigator:{},
    console,setTimeout(){},clearTimeout(){},requestAnimationFrame(){},structuredClone,URL,Date,Math:math,Intl,alert(){},Image:class{}};
  for (const [,file] of html.matchAll(/<script src="\.\/([^"?]+)(?:\?[^" ]*)?"><\/script>/g)) {
    if (file !== 'language-journey-content/content.js') vm.runInNewContext(fs.readFileSync(path.join(root,file),'utf8'),sandbox,{timeout:5000});
  }
  const source = html.match(/<script>\s*([\s\S]*?)<\/script>/)[1].replace(/\}\)\(\);\s*$/,
    'globalThis.audioProbe={state,level4QuestionBank,smallQuestionPool,advancedQuestionPool,speakerButtonHtml,quizAnswerAudioHtml,quizAudioKey,thematicInstructionHtml,thematicChoiceHtml,renderQuestion,element(id){return document.getElementById(id)}};})();');
  if(recordings)window.LanguageJourneyAudioManifest=recordings;
  vm.runInNewContext(source,sandbox,{timeout:5000});
  return sandbox.audioProbe;
}
function questionBanks() {
  const probe=createProbe();
  const rows = [{level:4,lessonId:'l4-9',questions:probe.level4QuestionBank(8)}];
  content.smallLessons.forEach(l => rows.push({level:5,lessonId:l.id,questions:probe.smallQuestionPool(l)}));
  Object.values(content.advancedCourses).forEach(course => course.lessons.forEach((l,i) => rows.push({level:course.number,lessonId:l.id,
    questions:probe.advancedQuestionPool(course,l,i).current})));
  return rows;
}
const japaneseOnly = text => typeof text === 'string' && /[ぁ-んァ-ヶ一-龯]/u.test(text)
  && !/[a-zÀ-ž]{2,}/iu.test(text) && !/___|…|〜|～/.test(text);
function texts() {
  const result = new Map();
  const add = (text,level,lessonId) => {if(japaneseOnly(text)&&!['っ','ッ','ー'].includes(text.trim())) {
    const old=result.get(text); if(!old||level<old.level)result.set(text,{text,level,lessonId});
  }};
  for (const row of questionBanks()) for (const q of row.questions) {
    const lessonId=q.lessonId||(row.level===4?content.langLessons[q.introducedAt]?.id:null)||row.lessonId;
    add(q.prompt,row.level,lessonId); add(q.correct,row.level,lessonId); add(q.context,row.level,lessonId);
    if(q.kind==='fill'&&q.prompt?.includes('___'))add(q.prompt.replace(/___/g,q.correct),row.level,lessonId);
    for (const a of q.choices||[]) add(a,row.level,lessonId);
  }
  for(const lesson of content.manifest.lessons) {
    for(const model of lesson.models||[])add(model.sentence,lesson.level,lesson.id);
    for(const part of lesson.applications||[]) {
      add(part.example,lesson.level,lesson.id);
      for(const q of part.questions){add(q.prompt,lesson.level,lesson.id);add(q.answer,lesson.level,lesson.id);for(const a of q.choices)add(a,lesson.level,lesson.id);}
    }
  }
  for(const e of content.manifest.exercises) {
    const lesson=content.manifest.lessons.find(l=>l.id===e.lessonId), p=e.payload;
    if(p){for(const s of [p[1],p[2],...(p[3]||[]),e.context])add(s,lesson?.level||4,e.lessonId);if(p[0]==='fill'&&p[1].includes('___'))add(p[1].replace(/___/g,p[2]),lesson?.level||4,e.lessonId);}
  }
  for(const i of content.manifest.instructions)add(i.textJa,11,'l11-home-1');
  for(const p of [...content.manifest.readings,...content.manifest.bonus])add(p.text,Number(p.introducedAt.split('-')[0]),p.lessonId);
  return [...result.values()];
}
function audit() {
  // Single は is deliberately ambiguous: its sound and particle use have separate IDs.
  const corpus=texts(),missing=corpus.filter(row=>!content.resolveAudioEntry(null,row.text)&&!(['は','へ','を'].includes(row.text)&&content.audioEntryById[`kana-hiragana-${row.text}`]?.pronunciation?.audioTextKana));
  return {japaneseTexts:corpus.length,withPronunciation:corpus.length-missing.length,missing};
}
if(require.main===module) {const report=audit();console.log(JSON.stringify(report,null,2));if(report.missing.length)process.exitCode=1;}
module.exports={texts,audit,japaneseOnly,createProbe};
