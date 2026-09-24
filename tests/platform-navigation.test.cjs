const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const base=path.resolve(__dirname,'..');
function load(files){
  const context={window:{},localStorage:{getItem:()=>null,setItem:()=>{}},console};
  context.window.window=context.window;
  for(const file of files)vm.runInNewContext(fs.readFileSync(path.join(base,file),'utf8'),context,{filename:file});
  return context.window;
}

test('locales mirror Dutch UI keys',()=>{
  const app=load(['locales/nl.js','locales/en.js','locales/de.js','locales/legacy-translations.js','locales/i18n.js','locales/legacy-ui.js']);
  for(const language of ['en','de'])assert.deepEqual(Object.keys(app.LanguageJourneyLocales[language]).sort(),Object.keys(app.LanguageJourneyLocales.nl).sort());
  for(const key of Object.values(app.LanguageJourneyLegacyUiKeys))assert.ok(app.LanguageJourneyLocales.nl[key],`missing ${key}`);
});

test('UI language and course progress remain independent',()=>{
  const app=load(['locales/nl.js','locales/en.js','locales/de.js','locales/i18n.js','platform.js']);
  assert.equal(app.LanguageJourneyPlatform.course('japanese').targetLanguage,'ja');
  assert.equal(app.LanguageJourneyPlatform.progressKey('japanese'),'taal-japanse-leerapp-v1');
  assert.equal(app.LanguageJourneyPlatform.registerCourse({id:'sample',targetLanguage:'ko',contentKey:'SampleContent'}),true);
  assert.equal(app.LanguageJourneyPlatform.progressKey('sample'),'language-journey-course-sample-v1');
  assert.equal(app.LanguageJourneyPlatform.course('sample').targetLanguage,'ko');
});

test('back route has a stable parent and scene themes have fallback',()=>{
  const app=load(['navigation.js','scenes.js']);
  assert.equal(app.LanguageJourneyNavigation.parentOf('module'),'level');
  assert.equal(app.LanguageJourneyNavigation.parentOf('level'),'levels');
  assert.equal(app.LanguageJourneyNavigation.parentOf('levels'),'home');
  assert.equal(app.LanguageJourneyScenes.resolve({level:0}).bodyScene,'classroom');
  assert.equal(app.LanguageJourneyScenes.resolve({level:5}).bodyScene,'home');
  assert.equal(app.LanguageJourneyScenes.resolve({level:6}).bodyScene,'market');
  assert.equal(app.LanguageJourneyScenes.resolve({level:99}).bodyScene,'journey');
});
