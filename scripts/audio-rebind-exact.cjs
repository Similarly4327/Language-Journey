'use strict';

const fs = require('node:fs');
const path = require('node:path');
const content = require('../language-journey-content/content.js');
const config = require('../audio/config.json');
const {safePath} = require('../audio/playback.js');
const batch = require('./audio-batch.cjs');

const root = path.resolve(__dirname, '..');
const manifestFile = path.join(root, 'assets/audio/ja/manifest.js');

function exactRebindPlan(source, manifest, voices, exists = file => fs.existsSync(path.join(root, file))) {
  const plan = [], reserved = new Set();
  for (const asset of manifest.assets) {
    if (source.audioEntryById[asset.entryId]?.pronunciation) continue;
    const candidates = source.audioEntries.filter(ref => ref.pronunciation?.audioTextKana === asset.audioTextKana
      && ref.displayText === asset.displayText && ref.pronunciation.readingId === asset.readingId);
    if (candidates.length !== 1) continue;
    const ref = candidates[0], voice = voices[asset.voiceRole];
    if (!voice || !['A', 'B'].includes(asset.voiceRole) || !safePath(asset.path) || !exists(asset.path)) continue;
    if (asset.pipelineVersion !== config.pipelineVersion || manifest.pipelineVersion !== config.pipelineVersion) continue;
    if (batch.hash(voice) !== asset.voiceFingerprint) continue;

    // Reconstruct the removed source identity. This proves the stale hash was
    // generated with the current pipeline settings, voice and exact text.
    const oldRef = {id: asset.entryId, displayText: asset.displayText,
      pronunciation: {readingId: asset.readingId, audioTextKana: asset.audioTextKana}};
    if (batch.generationHash(oldRef, asset.voiceRole, voice) !== asset.generationHash) continue;
    if (JSON.stringify(batch.settingsFor(oldRef)) !== JSON.stringify(batch.settingsFor(ref))) continue;
    if (manifest.assets.some(other => other !== asset && other.entryId === ref.id
      && other.readingId === ref.pronunciation.readingId && other.voiceRole === asset.voiceRole)) continue;
    if (reserved.has(ref.id + '@' + asset.voiceRole)) continue;
    if (manifest.assets.some(other => other !== asset && other.path === asset.path)) continue;

    reserved.add(ref.id + '@' + asset.voiceRole);
    plan.push({asset, ref, generationHash: batch.generationHash(ref, asset.voiceRole, voice)});
  }
  return plan;
}

function applyExactRebinds(manifest, plan) {
  for (const {asset, ref, generationHash} of plan) {
    asset.entryId = ref.id;
    asset.displayText = ref.displayText;
    asset.readingId = ref.pronunciation.readingId;
    asset.audioTextKana = ref.pronunciation.audioTextKana;
    asset.generationHash = generationHash;
  }
  return manifest;
}

function writeManifest(manifest) {
  const tmp = manifestFile + '.tmp';
  fs.writeFileSync(tmp, '(function(root){\n  const manifest=' + JSON.stringify(manifest, null, 2)
    + ';\n  if(typeof module!=="undefined"&&module.exports)module.exports=manifest;else root.LanguageJourneyAudioManifest=manifest;\n})(typeof globalThis!=="undefined"?globalThis:this);\n');
  fs.renameSync(tmp, manifestFile);
}

if (require.main === module) {
  const env = require('./audio-pipeline.cjs').loadEnvironment();
  const manifest = require(manifestFile);
  const voices = {A: env.VOICE_A_ID, B: env.VOICE_B_ID};
  const plan = exactRebindPlan(content, manifest, voices);
  console.log(JSON.stringify({reusableExactMatches: plan.length, ids: plan.map(item => ({from: item.asset.entryId, to: item.ref.id})), applied: process.argv.includes('--apply')}));
  if (process.argv.includes('--apply') && plan.length) writeManifest(applyExactRebinds(manifest, plan));
}

module.exports = {exactRebindPlan, applyExactRebinds};
