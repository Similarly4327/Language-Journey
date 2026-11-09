const test=require('node:test');
const assert=require('node:assert/strict');
const {deriveRows}=require('../lesson-info.js');
const {createCrashCourseProbe}=require('./app-probe.cjs');
const course=require('../language-journey-content/content.js');

test('level and lesson rows use canonical dictionary entries and never mutate course data',()=>{
 const p=createCrashCourseProbe(),entries=p.dictionaryById,vocabulary=Object.values(course.vocabById),before=JSON.stringify({state:p.state,entries,vocabulary});
 const rows=deriveRows({entries,vocabulary,level:4,lessonId:'l4-3',isKnown:entry=>p.knowledgeWordIsKnown(entry)});
 assert.ok(rows.some(row=>row.id==='vocab-わたし'&&row.current));assert.ok(rows.some(row=>row.id==='vocab-これ'&&!row.current));
 assert.ok(rows.filter(row=>row.kind==='woord').every(row=>row.id.startsWith('vocab-')));assert.equal(JSON.stringify({state:p.state,entries,vocabulary}),before);
});
test('kana, particles and words with overlapping spellings remain distinct',()=>{
 const p=createCrashCourseProbe(),rows=deriveRows({entries:p.dictionaryById,vocabulary:Object.values(course.vocabById),level:1,lessonEntryIds:['kana-hiragana-は']});
 assert.ok(rows.some(row=>row.id==='kana-hiragana-は'&&row.current&&row.kind==='kana'));assert.ok(!rows.some(row=>row.id==='grammar-particle-ha'));
 const four=deriveRows({entries:p.dictionaryById,vocabulary:Object.values(course.vocabById),level:4});assert.ok(four.some(row=>row.id==='grammar-particle-ha'&&row.kind==='grammatica'));
 const review=deriveRows({entries:p.dictionaryById,vocabulary:Object.values(course.vocabById),level:2});assert.ok(review.some(row=>row.id==='kana-hiragana-は'&&row.origin==='Herhaling uit level 1'));
});
test('new kanji writing is attributed to its real later lesson and stays a preview',()=>{
 const p=createCrashCourseProbe(),rows=deriveRows({entries:p.dictionaryById,vocabulary:Object.values(course.vocabById),level:11,lessonId:'l11-home-1',lessonPoint:'11-1',kanjiKnown:()=>false});
 const orthography=rows.find(row=>row.id==='vocab-わたし'&&row.kind==='kanji');assert.ok(orthography);assert.equal(orthography.jp,'私');assert.equal(orthography.reading,'わたし');assert.equal(orthography.current,true);assert.equal(orthography.known,false);assert.match(orthography.origin,/Level 11 · Les 1/);
});
test('intro routes and higher levels use canonical scoped sources',()=>{
 const p=createCrashCourseProbe(),vocabulary=Object.values(course.vocabById);
 const intro=deriveRows({entries:p.dictionaryById,vocabulary,level:1,route:'social-intro',lessonId:'intro-1'});assert.ok(intro.length);assert.ok(intro.every(row=>vocabulary.find(word=>word.id===row.id)?.routeId==='social-intro'));
 const higher=deriveRows({entries:p.dictionaryById,vocabulary,level:13});assert.ok(higher.length);assert.ok(higher.every(row=>p.dictionaryById[row.id].level===13||row.kind==='kanji'));
});
test('number lessons expose actual number entries, readings and saved familiarity without changing progress',()=>{
 const p=createCrashCourseProbe();p.state.screen='module';p.state.level=0;p.state.basisModule='numbers';p.state.numberLesson=0;
 const before=JSON.stringify({state:p.state,itemMastery:p.itemMastery});const context=p.lessonInfoContext(false),rows=deriveRows(context);
 const zero=rows.find(row=>row.id==='number-0');assert.ok(zero?.current);assert.equal(zero.kind,'getal');assert.equal(zero.jp,'〇');assert.equal(zero.reading,'ゼロ');assert.equal(zero.meaning,'0');assert.equal(zero.known,false);
 assert.match(p.dictionaryArticleHtml(p.dictionaryById['number-300']),/Kana-lezing:<\/span> <strong>さんびゃく/);
 assert.equal(JSON.stringify({state:p.state,itemMastery:p.itemMastery}),before);
 p.itemMastery['num-0']={seen:1};assert.equal(deriveRows(p.lessonInfoContext(false)).find(row=>row.id==='number-0').known,true);
});
test('closing Dictionary keeps the page locked while its parent information panel is open',()=>{
 const p=createCrashCourseProbe(),modal=p.element('dictionaryModal'),music=p.element('musicInfoPanel');
 music.hidden=true;p.document.querySelector=selector=>selector==='.lesson-info-backdrop:not([hidden])'?{}:null;p.closeDictionaryModal();assert.equal(p.document.body.style.overflow,'hidden');
 modal.classList.remove('hidden');music.hidden=false;p.document.querySelector=()=>null;p.closeDictionaryModal();assert.equal(p.document.body.style.overflow,'hidden');
 modal.classList.remove('hidden');music.hidden=true;p.closeDictionaryModal();assert.equal(p.document.body.style.overflow,'');
});

test('active quiz targets keep their spelling and meaning hidden in the information panel',()=>{
 const p=createCrashCourseProbe(),rows=deriveRows({entries:p.dictionaryById,vocabulary:Object.values(course.vocabById),level:4,isBlocked:id=>id==='vocab-ねこ'});
 const row=rows.find(row=>row.id==='vocab-ねこ');assert.ok(row.blocked);assert.equal(row.reading,'');assert.doesNotMatch(row.jp+' '+row.meaning,/ねこ|neko|kat/);assert.ok(rows.find(row=>row.id==='vocab-いぬ').jp==='いぬ');
});
