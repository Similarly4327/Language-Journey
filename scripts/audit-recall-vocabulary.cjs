const fs=require('node:fs');
const path=require('node:path');
const content=require('../language-journey-content/content.js');
const rows=content.vocabCatalog.map(word=>({wordId:word.id,japanese:word.jp,dutch:word.meaning,sourceLevel:word.level,sourceLesson:word.lessonId,sourceModule:word.sourceModuleId,introducedAt:word.introducedAt,classification:word.coreOrContext,recallCore:word.recallCore,sourceFound:word.sourceFound}));
const summary={total:rows.length,core:rows.filter(w=>w.recallCore).length,coreWithoutSource:rows.filter(w=>w.recallCore&&!w.sourceFound),previewWithoutSource:rows.filter(w=>w.classification==='preview'&&!w.sourceFound)};
const csv=Object.keys(rows[0]).join(',')+'\n'+rows.map(row=>Object.values(row).map(value=>'"'+String(value??'').replaceAll('"','""')+'"').join(',')).join('\n')+'\n';
const directory=path.resolve(__dirname,'../docs/recall-v2');fs.mkdirSync(directory,{recursive:true});fs.writeFileSync(path.join(directory,'vocabulary-audit.csv'),csv);fs.writeFileSync(path.join(directory,'vocabulary-audit.json'),JSON.stringify(summary,null,2)+'\n');console.log(JSON.stringify(summary,null,2));
if(summary.coreWithoutSource.length)process.exitCode=1;
