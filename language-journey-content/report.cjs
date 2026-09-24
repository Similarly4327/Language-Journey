const content=require('./content.js');
const {validate,format}=require('./validate.cjs');
const m=content.manifest;
const lines=['LANGUAGE JOURNEY — CURRICULUM REPORT',`Schema ${m.schemaVersion} · content ${m.contentVersion}`,''];
for(const level of m.levels){
  const lessons=m.lessons.filter(l=>l.level===level.number);
  const words=m.vocabulary.filter(v=>v.introducedAt?.startsWith(`${level.number}-`));
  const grammar=m.grammar.filter(g=>g.introducedAt?.startsWith(`${level.number}-`));
  lines.push(`Level ${level.number}: ${level.theme} · ${lessons.length} lessons · ${words.length} core words · ${grammar.length} grammar entries`);
  for(const lesson of lessons){
    const point=`${lesson.level}-${lesson.order}`;
    const fresh=(lesson.wordIds||lesson.exampleIds||[]).filter(id=>m.vocabulary.find(v=>v.id===id)?.introducedAt===point);
    lines.push(`  ${lesson.id} ${lesson.title} · ${fresh.length} new words · ${(lesson.grammarIds||[]).length} grammar refs · ${(lesson.patternIds||[]).length} pattern refs`);
  }
}
const foundation=content.foundationSnapshot;
lines.push('',`Foundation at Level 10 completion: ${foundation.vocabulary.length} words · ${foundation.grammar.length} grammar · ${foundation.kana.length} kana/extension items · ${foundation.kanji.length} kanji · ${foundation.patterns.length} patterns`);
lines.push(`Historical compatibility: ${m.vocabulary.filter(v=>v.coreOrContext==='legacy').length} word IDs (excluded from new lessons)`);
lines.push('',format(validate()));
console.log(lines.join('\n'));
process.exitCode=validate().counts.ERROR?1:0;
