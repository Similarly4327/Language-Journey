'use strict';
const fs = require('node:fs');
const path = require('node:path');
const {parseEnv} = require('node:util');
const {spawnSync} = require('node:child_process');
const batch = require('./audio-batch.cjs');
const content = require('../language-journey-content/content.js');
const config = require('../audio/config.json');
const {kanaOnly} = require('../language-journey-content/audio-foundation.js');
const {safePath} = require('../audio/playback.js');
const root = path.resolve(__dirname, '..');
const envFile = path.join(root, '.env.elevenlabs.local');
const keys = ['ELEVENLABS_API_KEY', 'VOICE_A_ID', 'VOICE_B_ID'];
function loadEnvironment(file = envFile, env = process.env) {
  const local = fs.existsSync(file) ? parseEnv(fs.readFileSync(file, 'utf8')) : {};
  return {...env, ...Object.fromEntries(keys.map(key => [key, (env[key] || local[key] || '').trim()]))};
}
function wordCounts(source = content) {
  const words = source.vocabCatalog;
  return {total: words.length, course: words.filter(w => w.coreOrContext === 'core').length,
    preview: words.filter(w => w.coreOrContext === 'preview').length,
    legacy: words.filter(w => w.legacy || w.coreOrContext === 'legacy').length,
    uniqueWrittenForms: new Set(words.map(w => w.jp)).size};
}
function selection(argv) {
  const scope = argv.filter(a => ['--words', '--all', '--quality', '--ids', '--lesson', '--level', '--range'].includes(a));
  if (scope.length !== 1) throw new Error('Kies precies één selectie: --words, --all, --quality, --ids, --lesson, --level of --range.');
  let args;
  if (scope[0] === '--words' || scope[0] === '--all') {
    const all = scope[0] === '--all';
    const ids = content.audioEntries.filter(ref => all
      ? ref.kind === 'dialogue' || kanaOnly(ref.pronunciation?.audioTextKana)
      : ref.kind === 'word' && ref.entry.coreOrContext === 'core').map(ref => ref.id);
    args = batch.parseArgs([...argv.filter(a => a !== scope[0]), '--ids', ids.join(',')]);
  } else args = batch.parseArgs(argv);
  if (args.approveQuality) throw new Error('Gebruik het commando approve --reviewer naam.');
  const jobs = batch.selectJobs(args);
  if (!jobs.length) throw new Error('Deze selectie bevat geen genereerbare audio.');
  return args;
}
function readManifest() {
  const file = require.resolve('../assets/audio/ja/manifest.js');
  delete require.cache[file];
  return require(file);
}
function plan(args, env, manifest = readManifest()) {
  const jobs = batch.planJobs(batch.selectJobs(args), manifest.assets, {A: env.VOICE_A_ID, B: env.VOICE_B_ID}, args);
  const pending = jobs.filter(job => job.action !== 'skip');
  return {recordings: jobs.length, pending: pending.length, skipped: jobs.length - pending.length,
    textCharacters: pending.reduce((n, j) => n + [...j.ref.pronunciation.audioTextKana].length, 0),
    // A character count is not a credit/price estimate: billing depends on the account and model.
    model: config.model_id, outputFormat: config.output_format,
    missingConfiguration: keys.filter(key => !env[key]),
    jobs: jobs.map(j => ({entryId: j.ref.id, voiceRole: j.role, action: j.action}))};
}
async function voices(env, fetchImpl = fetch) {
  if (!env.ELEVENLABS_API_KEY) throw new Error('Vul ELEVENLABS_API_KEY in .env.elevenlabs.local in.');
  const result = [], seen = new Set();
  let token;
  do {
    const url = new URL('https://api.elevenlabs.io/v2/voices');
    url.searchParams.set('page_size', '100');
    if (token) url.searchParams.set('next_page_token', token);
    let page;
    try {
      const response = await fetchImpl(url.toString(), {headers: {'xi-api-key': env.ELEVENLABS_API_KEY}, signal: AbortSignal.timeout(30000)});
      if (!response.ok) throw new Error('HTTP ' + response.status);
      page = await response.json();
    } catch (error) {
      const status = /^HTTP \d{3}$/.test(error.message) ? error.message : 'netwerk- of antwoordfout';
      throw new Error('ElevenLabs stemmen: ' + status);
    }
    if (!Array.isArray(page.voices)) throw new Error('ElevenLabs stemmen: ongeldig antwoord.');
    result.push(...page.voices.map(v => ({id: v.voice_id, name: v.name, language: v.labels?.language || 'onbekend'})));
    token = page.has_more ? page.next_page_token : null;
    if (page.has_more && (!token || seen.has(token))) throw new Error('ElevenLabs stemmen: ongeldige paginering.');
    seen.add(token);
  } while (token);
  return result;
}
const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[c]));
function reviewHtml(manifest = readManifest()) {
  const rows = batch.selectJobs({quality: true}).map(({ref, role}) => {
    const asset = manifest.assets.find(a => a.entryId === ref.id && a.voiceRole === role);
    const player = asset && safePath(asset.path) ? `<audio controls preload="none" src="../${escape(asset.path)}"></audio>` : '<p>Opname ontbreekt.</p>';
    return `<article><h2 lang="ja">${escape(ref.displayText)}</h2><p>${escape(ref.id)} · stem ${role}</p><p lang="ja">Uitspraak: ${escape(ref.pronunciation.audioTextKana)}</p>${player}</article>`;
  });
  return `<!doctype html><html lang="nl"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Japanse audio beoordelen</title><style>body{font:18px system-ui;max-width:760px;margin:auto;padding:20px}article{padding:16px;margin:16px 0;border:1px solid #ccc;border-radius:12px}audio{width:100%}h2{font-size:24px}p{overflow-wrap:anywhere}</style><h1>Japanse testset beluisteren</h1><p>Controleer verstaanbaarheid, mora-timing, klinkerlengte, kleine kana, zinsintonatie en Engels stresspatroon. Goedkeuren gebeurt pas na beluisteren via de CLI.</p>${rows.join('')}</html>`;
}
function writeReview() {
  fs.mkdirSync(path.join(root, 'output'), {recursive: true});
  fs.writeFileSync(path.join(root, 'output/audio-review.html'), reviewHtml());
}
function finalize() {
  // Separate Node processes read the freshly written manifest rather than the batch module cache.
  for (const script of ['audio-audit.cjs', 'version-client-assets.cjs']) {
    const result = spawnSync(process.execPath, [path.join(__dirname, script)], {cwd: root, encoding: 'utf8'});
    if (result.status !== 0) throw new Error('Controle mislukt: ' + script + '. Voer npm run audio:audit uit.');
  }
}
async function run(argv, {env = loadEnvironment(), log = console.log, fetchImpl = fetch,
  runBatch = batch.run, finish = finalize, saveReview = writeReview} = {}) {
  const [command = 'status', ...rest] = argv;
  if (command === 'setup') {
    if (rest.length) throw new Error('setup heeft geen opties.');
    try {fs.copyFileSync(path.join(root, 'audio/elevenlabs.env.example'), envFile, fs.constants.COPYFILE_EXCL);}
    catch (error) {if (error.code !== 'EEXIST') throw error;}
    log('Vul .env.elevenlabs.local in. Bestaande instellingen zijn behouden. Daarna: npm run audio:voices en npm run audio:status.');
    return;
  }
  if (command === 'status') {
    if (rest.length) throw new Error('status heeft geen opties.');
    const manifest = readManifest();
    const {audit} = require('./audio-audit.cjs');
    const report = audit(content, manifest);
    log(JSON.stringify({words: wordCounts(), configuration: Object.fromEntries(keys.map(k => [k, !!env[k]])),
      qualityApproved: manifest.qualityGate?.signature === batch.hash(batch.selectJobs({quality: true}).map(({ref, role}) => batch.generationHash(ref, role, env['VOICE_' + role + '_ID'] || '')))
        && batch.selectJobs({quality: true}).every(({ref, role}) => manifest.assets.some(a => a.entryId === ref.id && a.voiceRole === role && a.reviewed
          && a.generationHash === batch.generationHash(ref, role, env['VOICE_' + role + '_ID'] || '') && safePath(a.path) && fs.existsSync(path.join(root, a.path)))),
      coverage: report.coverage, missingReadings: report.missingReadings, errors: report.errors}, null, 2));
    return;
  }
  if (command === 'voices') {
    if (rest.length) throw new Error('voices heeft geen opties.');
    log(JSON.stringify(await voices(env, fetchImpl), null, 2)); return;
  }
  if (command === 'review') {
    if (rest.length) throw new Error('review heeft geen opties.');
    saveReview(); log('Open output/audio-review.html om de testset te beluisteren.'); return;
  }
  if (!['plan', 'quality', 'approve', 'generate'].includes(command)) throw new Error('Commando: setup, status, voices, plan, quality, review, approve of generate.');
  let args;
  if (command === 'approve') {
    if (rest.length !== 2 || rest[0] !== '--reviewer' || !rest[1].trim()) throw new Error('Gebruik approve --reviewer naam, na beluisteren van de testset.');
    args = {quality: true, approveQuality: true, reviewer: rest[1]};
  } else args = selection(command === 'quality' ? ['--quality', ...rest] : rest);
  if (command === 'plan' || args.dryRun) {log(JSON.stringify(plan(args, env), null, 2)); return;}
  if (command === 'generate' && args.quality) throw new Error('Gebruik quality om de testset te genereren.');
  log(JSON.stringify(plan(args, env), null, 2));
  await runBatch(args, {env, fetchImpl, log});
  if (args.quality) {saveReview(); log('Beluister output/audio-review.html.');}
  finish();
  log('Audio gecontroleerd en gekoppeld; clientversie bijgewerkt.');
}
if (require.main === module) run(process.argv.slice(2)).catch(error => {console.error(error.message); process.exitCode = 1;});
module.exports = {loadEnvironment, wordCounts, selection, plan, voices, reviewHtml, run};
