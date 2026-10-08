'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const pipeline = require('../scripts/audio-pipeline.cjs');
const batch = require('../scripts/audio-batch.cjs');
const content = require('../language-journey-content/content.js');

test('word report counts stable catalog IDs, excluding kana and grammar', () => {
  const counts = pipeline.wordCounts();
  assert.equal(counts.total, content.vocabCatalog.length);
  assert.equal(counts.total, counts.course + counts.preview + counts.legacy);
  assert.equal(new Set(content.vocabCatalog.map(w => w.id)).size, counts.total);
});
test('environment loads only ElevenLabs keys and process values take precedence', () => {
  const file = path.join(__dirname, '../output/audio-env-test.tmp');
  fs.mkdirSync(path.dirname(file), {recursive:true});
  try {
    fs.writeFileSync(file, 'ELEVENLABS_API_KEY="test-key"\nVOICE_A_ID=test-A # comment\nUNRELATED=ignored\n');
    assert.deepEqual(pipeline.loadEnvironment(file, {VOICE_A_ID:'process-A'}), {
      ELEVENLABS_API_KEY:'test-key', VOICE_A_ID:'process-A', VOICE_B_ID:''});
  } finally {fs.unlinkSync(file);}
});
test('course word selection excludes preview and legacy while all includes them', () => {
  const jobs = batch.selectJobs(pipeline.selection(['--words']));
  assert.equal(jobs.length, pipeline.wordCounts().course);
  assert.ok(jobs.every(j => j.ref.kind === 'word' && j.ref.entry.coreOrContext === 'core'));
  const all = batch.selectJobs(pipeline.selection(['--all']));
  assert.equal(all.filter(j => j.ref.kind === 'word').length, pipeline.wordCounts().total);
  assert.ok(all.some(j => j.ref.id === 'sentence-introduction-greeting'));
  assert.throws(() => pipeline.selection(['--words', '--level', '4']), /precies/);
  assert.throws(() => pipeline.selection(['--level', '999']), /geen genereerbare/);
  assert.throws(() => pipeline.selection(['--quality', '--approve-quality']), /approve/);
});
test('plan counts pending characters and never exposes API keys or voice IDs', () => {
  const env = {ELEVENLABS_API_KEY:'secret-key', VOICE_A_ID:'secret-A', VOICE_B_ID:'secret-B'};
  const args = pipeline.selection(['--ids', 'vocab-ねこ']);
  const ref = content.audioEntryById['vocab-ねこ'];
  const empty = pipeline.plan(args, env, {assets:[]});
  assert.equal(empty.pending, 1);
  assert.equal(empty.textCharacters, 2);
  assert.ok(!JSON.stringify(empty).includes('secret'));
  const current = {entryId:ref.id, readingId:ref.pronunciation.readingId, voiceRole:'A',
    generationHash:batch.generationHash(ref, 'A', env.VOICE_A_ID), path:'package.json'};
  assert.equal(pipeline.plan(args, env, {assets:[current]}).textCharacters, 0);
});
test('voices handles pagination and sanitizes errors', async () => {
  const calls = [];
  const voices = await pipeline.voices({ELEVENLABS_API_KEY:'secret'}, async (url, options) => {
    calls.push({url,options});
    return {ok:true, json:async () => ({voices:[{voice_id:'v'+calls.length, name:'Test', labels:{language:'ja'}}],
      has_more:calls.length === 1, next_page_token:'next'})};
  });
  assert.equal(voices.length, 2);
  assert.match(calls[1].url, /next_page_token=next/);
  assert.equal(calls[0].options.headers['xi-api-key'], 'secret');
  await assert.rejects(pipeline.voices({ELEVENLABS_API_KEY:'secret'}, async () => {throw Error('secret');}), /netwerk- of antwoordfout/);
  await assert.rejects(pipeline.voices({ELEVENLABS_API_KEY:'secret'}, async () => ({ok:false,status:401})), /HTTP 401/);
  await assert.rejects(pipeline.voices({}, () => assert.fail('no network call')), /Vul/);
});
test('plan and dry-run cannot call provider or finalize; generate finalizes after batch', async () => {
  const events = [];
  const deps = {env:{},log:()=>{},runBatch:async args=>events.push(args),finish:()=>events.push('finish')};
  await pipeline.run(['plan', '--words'], deps);
  await pipeline.run(['generate', '--words', '--dry-run'], deps);
  assert.equal(events.length, 0);
  await pipeline.run(['generate', '--words'], deps);
  assert.equal(events.length, 2);
  assert.equal(events[1], 'finish');
  await assert.rejects(pipeline.run(['generate', '--words'], {...deps,runBatch:async()=>{throw Error('failure');}}), /failure/);
  assert.equal(events.length, 2, 'no version change after a failed batch');
});
test('quality review and explicit approval retain the existing quality gate', async () => {
  const events = [];
  const deps = {env:{},log:()=>{},runBatch:async args=>events.push(args),
    saveReview:()=>events.push('review'),finish:()=>events.push('finish')};
  await pipeline.run(['quality'], deps);
  assert.deepEqual(events, [{quality:true}, 'review', 'finish']);
  events.length = 0;
  await assert.rejects(pipeline.run(['approve'], deps), /reviewer/);
  await pipeline.run(['approve', '--reviewer', 'Reviewer'], deps);
  assert.equal(events[0].approveQuality, true);
  assert.equal(events[0].reviewer, 'Reviewer');
  assert.equal(events.at(-1), 'finish');
});
test('review page uses only safe local MP3 paths and reports missing samples', () => {
  const jobs = batch.selectJobs({quality:true});
  const html = pipeline.reviewHtml({assets:[{entryId:jobs[0].ref.id, voiceRole:jobs[0].role, path:'../unsafe.mp3'}]});
  assert.equal((html.match(/<article>/g)||[]).length, 14);
  assert.ok(!html.includes('unsafe.mp3'));
  assert.match(html, /Opname ontbreekt/);
});
