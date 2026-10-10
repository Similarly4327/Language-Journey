const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const content=require('../language-journey-content/content.js');
const {kanaOnly}=require('../language-journey-content/audio-foundation.js');
const audio=require('../audio/playback.js');
const batch=require('../scripts/audio-batch.cjs');
const {audit}=require('../scripts/audio-audit.cjs');
const config=require('../audio/config.json');
function recording(id,role='A'){
 const ref=content.audioEntryById[id],voice='test-'+role;
 return{entryId:id,displayText:ref.displayText,readingId:ref.pronunciation.readingId,audioTextKana:ref.pronunciation.audioTextKana,voiceRole:role,voiceFingerprint:batch.hash(voice),generationHash:batch.generationHash(ref,role,voice),pipelineVersion:config.pipelineVersion,reviewed:true,path:'assets/audio/ja/sentences/'+id.replace(/[^a-z0-9-]/gi,'x')+'-'+role+'.mp3'};
}
const manifest=assets=>({pipelineVersion:config.pipelineVersion,assets});
test('audio metadata reuses every original word and distinguishes particle/kana readings',()=>{
 assert.equal(content.audioEntries.filter(r=>r.kind==='word').length,content.manifest.vocabulary.length);
 const word=content.manifest.vocabulary[0];assert.equal(content.audioEntryById[word.id].entry,word);
 assert.equal(content.vocabById[word.id].pronunciation,word.pronunciation);
 assert.equal(content.resolveAudioEntry('kana-hiragana-は').pronunciation.audioTextKana,'は');
 assert.equal(content.resolveAudioEntry('grammar-particle-ha').pronunciation.audioTextKana,'わ');
 assert.equal(content.resolveAudioEntry('grammar-particle-wo').pronunciation.audioTextKana,'お');
 assert.equal(content.resolveAudioEntry('grammar-particle-he').pronunciation.audioTextKana,'え');
 assert.equal(content.resolveAudioEntry('kana-hiragana-へ').pronunciation.audioTextKana,'へ');
 assert.equal(content.resolveAudioEntry(null,'は'),null,'ambiguous inline text has no guessed pronunciation');
 assert.equal(content.resolveAudioEntry('missing-id','ねこ'),null,'an invalid explicit ID cannot fall back to text');
 assert.equal(content.resolveAudioEntry('vocab-はは').pronunciation.audioTextKana,'はは');
});
test('avatar celebrations are ambient audio content, separate from vocabulary and Recall',()=>{
 const celebrations=content.manifest.avatarCelebrations;
 assert.equal(celebrations.length,10);assert.equal(new Set(celebrations.map(entry=>entry.id)).size,10);
 assert.ok(celebrations.every(entry=>entry.japaneseText&&entry.meaning&&entry.audioTextKana&&entry.audioProfile==='celebration'));
 assert.ok(celebrations.every(entry=>content.audioEntryById[entry.id]?.kind==='avatarCelebration'));
 assert.ok(celebrations.every(entry=>!content.manifest.vocabulary.some(word=>word.id===entry.id)));
 assert.equal(content.audioEntryById[celebrations[0].id].audioProfile,'celebration');
 const jobs=batch.selectJobs({ids:celebrations[0].id});assert.deepEqual(jobs.map(job=>job.role),['A','B']);
 assert.ok(jobs.every(job=>job.ref.kind==='avatarCelebration'));
});
test('celebration profile is central and included in generated asset hashes',()=>{
 const ref=content.audioEntryById['avatar-celebration-01'];
 assert.equal(batch.settingsFor(ref).voice_settings.style,config.audio_profiles.celebration.voice_settings.style);
 assert.notEqual(batch.generationHash(ref,'A','test'),batch.generationHash(ref,'A','test',{...config,audio_profiles:{}}));
 const current=recording(ref.id,'A');assert.equal(batch.currentHash(ref,current),current.generationHash);
});
test('reviewed early sentences share IDs, preserve writing and use explicit pronunciation',()=>{
 const first=content.langLessons[0].models[0],duplicate=content.langLessons[5].models[0];assert.equal(first.sentenceId,duplicate.sentenceId);
 const ref=content.audioEntryById[first.sentenceId];assert.equal(ref.displayText,'これは ねこ です');assert.equal(ref.pronunciation.audioTextKana,'これわ ねこ です');
 assert.equal(content.audioEntryById['sentence-l4-7-model-1'].pronunciation.audioTextKana,'わたし わ みず お のみます');
 assert.deepEqual(content.audioEntryById['sentence-l4-7-model-1'].entry.linkedWordIds,['vocab-わたし','vocab-みず','vocab-のみます']);
 assert.equal(content.audioEntryById['reading-l6-5'].pronunciation.audioTextKana,'これわ わたし の かぞく です。 あれわ わたし の あに です。');
 assert.equal(content.audioEntryById['sentence-l9-1-model-1'].pronunciation.audioTextKana,'えき わ どこ です か');
});
test('unverified kanji, isolated small tsu and vowel mark are rejected; lexical spelling is retained',()=>{
 for(const text of ['今日','学校','っ','ッ','ー','わたしは学生です','hello'])assert.equal(kanaOnly(text),false);
 for(const text of ['きって','きゃく','コーヒー','ほん','これわ ねこ です。'])assert.equal(kanaOnly(text),true);
 assert.throws(()=>batch.jobsFor(content.audioEntryById['kana-small-っ']),/gecontroleerd/);
});
test('resolver requires exact entry/reading, reviewed recording and safe static path',()=>{
 const id='vocab-ねこ',asset=recording(id),m=manifest([asset]);assert.ok(audio.resolve(content,m,id));
 for(const patch of [{readingId:'other'},{audioTextKana:'いぬ'},{displayText:'犬'},{reviewed:false},{path:'https://example.com/a.mp3'},{path:'assets/audio/ja/../a.mp3'},{pipelineVersion:'old'}])assert.equal(audio.resolve(content,manifest([{...asset,...patch}]),id),null);
 assert.equal(audio.resolve(content,manifest([]),id),null);
 const contextOnly=recording('kana-small-っ');assert.equal(audio.resolve(content,manifest([contextOnly]),contextOnly.entryId),null,'a recording cannot turn a context-only writing sign into an isolated sound');
 const html=audio.buttonHtml(audio.resolve(content,m,id),'ねこ','Luister naar kat');assert.match(html,/type="button"/);assert.match(html,/aria-label="Luister naar kat"/);assert.match(html,/data-audio-key="vocab-ねこ"/);
});
test('avatar celebration resolver selects the selected avatar voice and needs reviewed static files',()=>{
 const id='avatar-celebration-01',female=recording(id,'A'),male=recording(id,'B');
 assert.equal(audio.resolve(content,manifest([female]),id,undefined,'B'),null);
 assert.equal(audio.resolve(content,manifest([female,{...male,reviewed:false}]),id,undefined,'B'),null);
 assert.equal(audio.resolve(content,manifest([female,male]),id,undefined,'A').assets[0].voiceRole,'A');
 assert.equal(audio.resolve(content,manifest([female,male]),id,undefined,'B').assets[0].voiceRole,'B');
});
function playbackFixture(){
 const played=[],timers=[],states=[];const service=audio.createPlayback({createAudio:path=>{const item={path,play(){this.started=true;return Promise.resolve()},pause(){this.paused=true}};played.push(item);return item},delay:fn=>{const timer={fn};timers.push(timer);return timer},cancelDelay:timer=>timer.cancelled=true});
 return{service,played,timers,states,options:{onState:s=>states.push(s)}};
}
test('speed choice preserves pitch, updates active playback and every dialogue line',()=>{
 const f=playbackFixture();
 f.service.play([{path:'one'},{path:'two'}],{...f.options,playbackRate:.75});
 assert.equal(f.played[0].playbackRate,.75);assert.equal(f.played[0].defaultPlaybackRate,.75);assert.equal(f.played[0].preservesPitch,true);
 f.service.setRate(1);assert.equal(f.played[0].playbackRate,1);assert.equal(f.played[0].defaultPlaybackRate,1);
 f.played[0].onended();f.service.setRate(.75);f.timers[0].fn();
 assert.equal(f.played[0].src,'./two');assert.equal(f.played[0].playbackRate,.75);
 f.service.stop();f.service.play([{path:'signal'}]);assert.equal(f.played.at(-1).playbackRate,1);
});
test('saved audio speed accepts only supported rates and preserves existing progress',()=>{
 const {createCrashCourseProbe}=require('./app-probe.cjs');
 for(const speed of [undefined,null,0,2,'invalid',1,.75]){
   const app=createCrashCourseProbe({savedState:{audioSpeed:speed,userName:'Learner',introducedVocabIds:['vocab-ねこ']}});
   const expected=speed===.75?.75:1;
   assert.equal(app.state.audioSpeed,expected);const saved=app.saved();
   assert.equal(saved.state.audioSpeed,expected);assert.equal(saved.state.userName,'Learner');
   assert.ok(saved.state.introducedVocabIds.includes('vocab-ねこ'));
 }
});
test('one central service replaces playback and ignores stale events',async()=>{
 const f=playbackFixture();f.service.play([{path:'first'}],f.options);const stale=f.played[0].onended;
 f.played[0].onplaying();assert.equal(f.states.at(-1),'playing');f.service.play([{path:'second'}],f.options);
 assert.equal(f.played[0].paused,true);stale();assert.equal(f.played.length,2);f.service.stop();assert.equal(f.played[1].paused,true);assert.equal(f.states.at(-1),'idle');
});
test('two-voice dialogue plays full lines in order and cancellation also stops its pause',()=>{
 const id='dialogue-test',source={...content,audioEntryById:{...content.audioEntryById}},a='sentence-l4-5-model-1',b='sentence-l4-1-model-1';
 source.audioEntryById[id]={id,kind:'dialogue',entry:{lines:[{sentenceId:a,speakerRole:'A'},{sentenceId:b,speakerRole:'B'}]}};source.resolveAudioEntry=id=>source.audioEntryById[id];
 const resolved=audio.resolve(source,manifest([recording(a,'A'),recording(b,'B')]),id);assert.equal(resolved.assets.length,2);assert.equal(resolved.assets[1].voiceRole,'B');
 const f=playbackFixture();f.service.play(resolved.assets,f.options);assert.equal(f.played.length,1);f.played[0].onended();assert.equal(f.played[0].paused,true);assert.equal(f.played.length,1);f.timers[0].fn();assert.equal(f.played.length,1,'dialogue reuses its gesture-unlocked element');assert.equal(f.played[0].src,'./'+resolved.assets[1].path);f.played[0].onended();assert.equal(f.states.at(-1),'ended');
 const g=playbackFixture();g.service.play(resolved.assets,g.options);g.played[0].onended();g.service.stop();assert.equal(g.timers[0].cancelled,true);g.timers[0].fn();assert.equal(g.played.length,1);assert.equal(g.states.at(-1),'idle');
});
test('playback failure is reported once without launching more dialogue lines',async()=>{
 const f=playbackFixture(),finished=[];f.service.play([{path:'one'},{path:'two'}],{...f.options,onFinish:status=>finished.push(status)});const error=f.played[0].onerror;error();error();assert.deepEqual(finished,['error']);assert.equal(f.played.length,1);
 const states=[];const rejected=audio.createPlayback({createAudio:()=>({pause(){},play:()=>Promise.reject(Error('denied'))})});rejected.play([{path:'one'}],{onState:status=>states.push(status)});await new Promise(resolve=>setImmediate(resolve));assert.equal(states.at(-1),'error');
 const failed=[];audio.createPlayback({createAudio:()=>{throw Error('unavailable')}}).play([{path:'one'}],{onState:status=>failed.push(status)});assert.equal(failed.at(-1),'error');
});
test('generation hash detects content, reading, voice, settings and pipeline changes',()=>{
 const ref=content.audioEntryById['vocab-ねこ'],base=batch.generationHash(ref,'A','voice');
 for(const changed of [{...ref,displayText:'猫'},{...ref,pronunciation:{...ref.pronunciation,audioTextKana:'いぬ'}}])assert.notEqual(batch.generationHash(changed,'A','voice'),base);
 assert.notEqual(batch.generationHash(ref,'A','other-voice'),base);assert.notEqual(batch.generationHash(ref,'A','voice',{...config,pipelineVersion:'next'}),base);assert.notEqual(batch.generationHash(ref,'A','voice',{...config,voice_settings:{stability:.2}}),base);
 assert.equal(batch.currentHash(ref,recording(ref.id)),recording(ref.id).generationHash);
});
test('batch skips current existing files, regenerates stale/missing files and honors explicit force',()=>{
 const ref=content.audioEntryById['vocab-ねこ'],jobs=[{ref,role:'A'}],asset=recording(ref.id),voices={A:'test-A'};
 assert.equal(batch.planJobs(jobs,[asset],voices,{},()=>true)[0].action,'skip');
 assert.equal(batch.planJobs(jobs,[asset],voices,{},()=>false)[0].action,'stale');
 assert.equal(batch.planJobs(jobs,[asset],{A:'different'}, {},()=>true)[0].action,'stale');
 assert.equal(batch.planJobs(jobs,[],voices,{},()=>true)[0].action,'missing');
 assert.equal(batch.planJobs(jobs,[asset],voices,{force:true},()=>true)[0].action,'generate');
});
test('batch selects real source IDs and quality set covers A/B without needing secrets for dry-run',async()=>{
 const jobs=batch.selectJobs({quality:true});assert.ok(jobs.length>=12);assert.ok(jobs.some(j=>j.role==='B'));assert.ok(jobs.every(j=>kanaOnly(j.ref.pronunciation.audioTextKana)));
 assert.ok(batch.selectJobs({lesson:'l4-1'}).some(j=>j.ref.id==='vocab-ねこ'));assert.ok(batch.selectJobs({range:'1-3'}).every(j=>j.ref.level<=3));assert.throws(()=>batch.selectJobs({ids:'unknown'}),/Onbekend/);
 const logs=[];await batch.run({quality:true,dryRun:true},{env:{},log:value=>logs.push(value)});assert.ok(logs[0].includes('voiceConfigured'));
 await assert.rejects(batch.run({ids:'vocab-ねこ'},{env:{VOICE_A_ID:'test',VOICE_B_ID:'test'}}),/testset/);
});
test('provider receives kana only; errors never include credentials/provider response',async()=>{
 const ref=content.audioEntryById['sentence-l4-7-model-1'],env={VOICE_A_ID:'private-voice',ELEVENLABS_API_KEY:'private-key'};let request;
 const bytes=await batch.requestAudio(ref,'A',{env,fetchImpl:async(url,options)=>{request={url,options};return{ok:true,arrayBuffer:async()=>new Uint8Array(120).buffer}}});assert.equal(bytes.length,120);assert.equal(JSON.parse(request.options.body).text,ref.pronunciation.audioTextKana);assert.ok(!request.options.body.includes(ref.displayText));
 await assert.rejects(batch.requestAudio(ref,'A',{env,fetchImpl:async()=>{throw Error('private-key private-voice')}}),error=>!error.message.includes('private-')&&/netwerkfout/.test(error.message));
 await assert.rejects(batch.requestAudio({...content.audioEntryById['sentence-l9-1-model-1'],pronunciation:{audioTextKana:null}},'A',{env,fetchImpl:()=>{throw Error('must not call')}}),/gecontroleerd/);
});
test('validator detects unknown IDs, duplicate refs, stale hashes and reports missing content honestly',()=>{
 const asset=recording('vocab-ねこ');assert.equal(audit(content,manifest([asset]),{checkFiles:false}).errors.length,0);
 const result=audit(content,manifest([asset,asset,{...asset,entryId:'missing'},{...recording('vocab-いぬ'),generationHash:'stale'}]),{checkFiles:false});assert.ok(result.errors.some(e=>e.includes('duplicate')));assert.ok(result.errors.some(e=>e.includes('unknown')));assert.ok(result.errors.some(e=>e.includes('stale')));
 const empty=audit(content,manifest([]));assert.equal(empty.coverage.word.withAudio,0);assert.ok(!empty.missingReadings.includes('reading-l9-5'));assert.ok(empty.missingReadings.includes('grammar-l6-3'));assert.equal(empty.errors.length,0);
});
test('all UI routes reuse shared service and Recall reveal never offers Japanese audio beforehand',()=>{
 const html=fs.readFileSync(require('node:path').join(__dirname,'../index.html'),'utf8');
 const keySource=html.slice(html.indexOf('function quizAudioKey('),html.indexOf('function renderQuestion(')),sandbox={vocabById:content.vocabById,window:{LanguageJourneyContent:content}};
 require('node:vm').runInNewContext(keySource+';this.key=quizAudioKey;',sandbox);
 assert.equal(sandbox.key({vocabIds:['vocab-ねこ','vocab-いぬ']},'ねこ','answer'),'vocab-ねこ');
 assert.equal(sandbox.key({lessonId:'l4-1'},'これは ねこ です'),'sentence-l4-1-model-1');
 assert.equal(sandbox.key({vocabIds:['vocab-ねこ']},'kat'),undefined,'Dutch prompts never acquire the answer ID through vocabulary metadata');
 assert.match(html,/if\(direction==='jp-nl'&&!feedback\)/);assert.match(html,/speakerButtonHtml\(spokenAnswer,card.id/);assert.match(html,/model.sentenceId/);
 assert.match(html,/contextAudio=quizTextIsJapanese\(context\)&&speakerButtonHtml/);assert.match(html,/japanesePlayback.play\(asset.assets/);assert.doesNotMatch(html,/knowledgeTilePlayback|audioCoachPlayback|speechSynthesis/);
 assert.match(html,/function answerOptionAudioHtml\(text,preferredIds=\[\]\)/);assert.match(html,/answerOptionAudioHtml\(text,quizAudioKey\(currentQ\(\),text,'choice'\)\)/);
 assert.match(html,/event\.preventDefault\(\);event\.stopPropagation\(\)/,'speaker taps are intercepted before the answer option receives them');
 assert.match(html,/celebrationTap:c\.passed/);assert.match(html,/data-avatar-celebration/);assert.match(html,/state\.avatarGender==='male'\?'B':'A'/);assert.match(html,/japanesePlayback\.play\(selected\.asset\.assets/);assert.doesNotMatch(html,/speechSynthesis/);
 assert.match(html,/qPromptAudio'\).innerHTML=''/);assert.match(html,/min-width:44px/);
 const knowledge=html.slice(html.indexOf('function renderKnowledgeDashboard('),html.indexOf('function knowledgeGrowthSeries('));assert.doesNotMatch(knowledge,/knowledgeGrammarForKana\(item.front\)/);assert.match(knowledge,/dictionaryById\[`kana-\$\{script\}-\$\{item.front\}`\]/);
 const japaneseRoute=html.slice(html.indexOf('function playAvatarAudio('),html.indexOf('function playCorrectAnswerSound('));assert.doesNotMatch(japaneseRoute,/new Audio|AUDIO_COACH_DISMISS_MS/);
});
