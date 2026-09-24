const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const html = fs.readFileSync(require('node:path').join(__dirname, '..', 'index.html'), 'utf8');
const scriptStart = html.indexOf('<script>') + '<script>'.length;
const marker = 'const dictionaryById=';
const markerAt = html.indexOf(marker, scriptStart);
assert.ok(markerAt > scriptStart, 'Dictionary catalog is present in the app script');
const end = html.indexOf('\nfunction blankDirectionStats', markerAt);
assert.ok(end > markerAt, 'Dictionary helpers end before the progress utilities');
const source = `${html.slice(scriptStart, end)}\nglobalThis.dictionaryTestApi={dictionaryById,dictionarySearch,dictionaryEntryForToken,vocabCatalog,vocabMastery,rankState};\n})();`;
const content = require('../language-journey-content/content.js');
const kanaRows = rows => rows.map((kana, i) => ({name: content.rowNames[i], kana}));
const sandbox = {
  window: {
    LanguageJourneyPlatform: {preferences: () => ({courseId: 'japanese'}), course: () => ({targetLanguage: 'ja'}), content: () => content},
    LanguageJourneyI18n: {}, LanguageJourneyScenes: {}, LanguageJourneyNavigation: {}
  },
  document: {getElementById: () => null}, console, setTimeout, clearTimeout,
  languageJourneyStorageKey: 'taal-japanse-leerapp-v1'
};
vm.runInNewContext(source, sandbox);
const {dictionaryById, dictionarySearch, dictionaryEntryForToken, vocabCatalog, vocabMastery, rankState} = sandbox.dictionaryTestApi;

assert.ok(vocabCatalog.length > 0, 'existing course vocabulary is loaded');
assert.match(html, /data-knowledge="dictionary"/, 'Dictionary is available from the knowledge tabs');
assert.match(html, /id="dictionaryModal"/, 'lesson-linked articles have a dedicated modal');
assert.match(html, /function renderDictionaryTab\(/, 'the searchable Dictionary view is rendered');
assert.match(html, /function openDictionaryModal\(/, 'lesson links open articles without replacing the lesson');
assert.equal(Object.keys(dictionaryById).length, vocabCatalog.length + 168, 'all word, kana, combination, writing-rule and grammar IDs stay unique');
for (const word of vocabCatalog) {
  const entry = dictionaryById[word.id];
  assert.ok(entry, `word keeps its stable ID: ${word.id}`);
  assert.ok(entry.meaning && entry.jp && entry.kana, `word has spelling, reading and meaning: ${word.id}`);
  if (word.romaji) assert.equal(entry.romaji, word.romaji, `word keeps its course romaji: ${word.id}`);
}
const ambiguousWords = vocabCatalog.filter(word => word.meanings.length > 1);
assert.equal(ambiguousWords.length, 9, 'all current multi-meaning course words are accounted for');
for (const word of ambiguousWords) {
  const senses = dictionaryById[word.id].senses;
  assert.equal(senses.length, word.meanings.length, `separate senses for ${word.jp}`);
  assert.ok(senses.every(sense => !sense.description.startsWith('Betekenis in de context')), `context note curated for ${word.jp}`);
}

for (const [kana, reading, grammarId, grammarReading] of [
  ['は', 'ha', 'grammar-particle-ha', 'wa'],
  ['へ', 'he', 'grammar-particle-he', 'e'],
  ['を', 'o', 'grammar-particle-wo', 'o'],
  ['か', 'ka', 'grammar-particle-ka', 'ka'],
  ['も', 'mo', 'grammar-particle-mo', 'mo']
]) {
  const kanaEntry = dictionaryById[`kana-hiragana-${kana}`];
  const grammarEntry = dictionaryById[grammarId];
  assert.equal(kanaEntry.romaji, reading, `${kana} kana reading`);
  assert.equal(grammarEntry.romaji, grammarReading, `${kana} particle reading`);
  assert.notEqual(kanaEntry.id, grammarEntry.id, `${kana} kana and particle are separate entries`);
}
assert.match(dictionaryById['kana-hiragana-む'].meaning, /geen Nederlandse woordbetekenis/);
for (const kana of ['か', 'も', 'む', 'を']) assert.equal(dictionaryById[`kana-hiragana-${kana}`].lexical, false, `${kana} is not assigned a fake lexical meaning`);
assert.equal(dictionaryById['kana-combo-きゃ'].kind, 'klankcombinatie');
assert.equal(dictionaryById['kana-hiragana-が'].kind, 'kana', 'voiced kana is searchable separately');
assert.equal(dictionaryById['writing-long-vowel-mark'].kind, 'schrijfregel');
assert.ok(dictionarySearch('が').some(x => x.id === 'kana-hiragana-が'));
assert.ok(!dictionarySearch('が').some(x => x.id === 'kana-hiragana-か'), 'kana search preserves dakuten distinctions');
assert.equal(dictionaryEntryForToken('は', 'l4-3').id, 'grammar-particle-ha');
assert.equal(dictionaryEntryForToken('か', 'l4-5').id, 'grammar-particle-ka');
assert.equal(dictionaryEntryForToken('も', 'l4-6').id, 'grammar-particle-mo');

const kanaKa = dictionarySearch('か').find(x => x.id === 'kana-hiragana-か');
const particleKa = dictionarySearch('か').find(x => x.id === 'grammar-particle-ka');
assert.ok(kanaKa && particleKa && kanaKa.id !== particleKa.id, 'kana and grammar search hits remain distinct');
assert.deepEqual(dictionarySearch('KA').map(x => x.id), dictionarySearch('ka').map(x => x.id), 'romaji search ignores case');
assert.ok(dictionarySearch('kyuu').some(x => x.id === 'kana-combo-きゅ'), 'common doubled-vowel romaji variant finds long-u spelling');
assert.ok(dictionarySearch('kōhī').some(x => x.id === 'vocab-コーヒー'), 'macron romaji finds course spelling without stripping kana diacritics');
assert.ok(dictionarySearch('ook').some(x => x.id === 'grammar-particle-mo'), 'Dutch meaning/synonym search finds も particle');
assert.ok(dictionarySearch('water').some(x => x.meaning.includes('water')), 'Dutch word search finds course vocabulary');

const before = JSON.stringify({mastery: vocabMastery, ranks: rankState});
dictionarySearch('も');
dictionarySearch('family');
assert.equal(JSON.stringify({mastery: vocabMastery, ranks: rankState}), before, 'search does not mutate mastery or ranks');
assert.doesNotMatch(html.slice(html.indexOf('function renderDictionaryTab'), html.indexOf('let dictionaryReturnFocus')), /ensureVocabMastery|flashcardRate|introduce(?:Lesson|Small|Advanced)Words/, 'dictionary never invokes mastery, SRS, or introduction mutation helpers');

console.log(`Dictionary checks passed for ${vocabCatalog.length} stable course vocabulary entries and ${Object.keys(dictionaryById).length - vocabCatalog.length} kana/grammar/writing entries.`);
