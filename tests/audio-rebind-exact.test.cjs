'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const structuredClone = global.structuredClone;
const content = require('../language-journey-content/content.js');
const manifest = require('../assets/audio/ja/manifest.js');
const pipeline = require('../scripts/audio-pipeline.cjs');
const batch = require('../scripts/audio-batch.cjs');
const audit = require('../scripts/audio-audit.cjs').audit;
const {exactRebindPlan, applyExactRebinds} = require('../scripts/audio-rebind-exact.cjs');
const mappings = [
  ['sentence-course-078e77914b89d601', 'sentence-prepare-vocab-まちます'],
  ['sentence-course-54a7bb14197352f2', 'sentence-l11-3-A-compact-1'],
  ['sentence-course-56d7b2cbc1dc2063', 'sentence-prepare-vocab-とまります'],
  ['sentence-course-8ba72c0cc8798924', 'sentence-prepare-vocab-つきました'],
  ['sentence-course-bf66d031a3867cc2', 'sentence-prepare-vocab-トイレ'],
  ['sentence-course-cfeafbcd6c0bfdd3', 'sentence-l11-3-B-compact-1'],
  ['sentence-course-eb6f1902371f49ce', 'sentence-dialogue-l13-5-B-2'],
  ['sentence-course-ff6ea873c81c0c31', 'sentence-prepare-vocab-ひつよう']
];
function legacyFixture(voices) {
  const copy = structuredClone(manifest);
  for (const [oldId, currentId] of mappings) {
    const asset = copy.assets.find(item => item.entryId === currentId);
    assert.ok(asset, `expected the canonical asset ${currentId}`);
    const ref = {id: oldId, displayText: asset.displayText,
      pronunciation: {readingId: asset.readingId, audioTextKana: asset.audioTextKana}};
    asset.entryId = oldId;
    asset.generationHash = batch.generationHash(ref, asset.voiceRole, voices[asset.voiceRole]);
  }
  return copy;
}

test('orphaned recordings rebind only with exact text, current provenance, voice, settings and file', () => {
  const env = pipeline.loadEnvironment(), voices = {A: env.VOICE_A_ID, B: env.VOICE_B_ID};
  const copy = legacyFixture(voices), plan = exactRebindPlan(content, copy, voices);
  assert.deepEqual(plan.map(item => item.asset.entryId).sort(), mappings.map(item => item[0]).sort());
  const paths = plan.map(item => item.asset.path);
  applyExactRebinds(copy, plan);
  assert.deepEqual(plan.map(item => item.asset.path), paths, 'the existing recordings are reused without moving or rewriting audio');
  const report = audit(content, copy);
  for (const item of plan) {
    assert.ok(copy.assets.some(asset => asset.entryId === item.ref.id && asset.generationHash === item.generationHash));
    assert.ok(!report.errors.some(error => error.includes(item.ref.id) && /unknown content\/reading|stale asset/.test(error)));
  }
});

test('exact rebind fails closed when current voice provenance does not match', () => {
  const env = pipeline.loadEnvironment(), voices = {A: env.VOICE_A_ID, B: env.VOICE_B_ID};
  const copy = legacyFixture(voices);
  assert.equal(exactRebindPlan(content, copy, {A: 'intentionally-different-voice', B: voices.B}).length, 0);
});
