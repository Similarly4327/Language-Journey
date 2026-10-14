const fs=require('node:fs'),path=require('node:path');
const content=require('../language-journey-content/content.js');
function audit(api=content){
  const m=api.manifest,order=api.pointOrder,words=new Map(m.vocabulary.map(w=>[w.id,w])),forms=new Map(m.vocabulary.filter(w=>w.coreOrContext!=='legacy').flatMap(w=>[[w.japanese,w],[w.reading,w]]));
  const basic=new Set(['は','の','を','に','で','と','も','です','か','ですか','これ','それ','あれ','ここ','そこ','あそこ']);
  return m.lessons.filter(l=>l.level>=11&&l.level<=14).sort((a,b)=>a.level-b.level||a.order-b.order).map(l=>({
    id:l.id,level:l.level,title:l.title,goal:l.goal,canDo:l.didactics?.canDo||l.goal,newGrammar:l.grammarIds.map(id=>m.grammar.find(g=>g.id===id)).filter(g=>g&&g.introducedAt.startsWith(`${l.level}-${l.order}`)).map(g=>({id:g.id,title:g.title})),
    flow:l.didactics?.flow||['woorden A','woordherkenning A','verhaal A','begrip A','woorden B','woordherkenning B','bron B','begrip B','lescheck'],
    parts:l.applications.map(p=>{
      const at=`${l.level}-${l.order}-${p.part}`,reading=m.readings.find(r=>r.id===p.readingId),newWords=p.wordIds.map(id=>words.get(id)).filter(w=>w?.introducedAt===at),examples=l.models||[],prepared=new Set(examples.flatMap(model=>model.linkedWordIds||[]));
      const tokens=[...new Set((reading?.text||'').split(/[\s。、！？!?：:→↑↓、]+/u).map(t=>t.replace(/[0-9A-Z○×＿「」]/gu,'')).filter(t=>/[ぁ-んァ-ヶ]/u.test(t)))];
      const classified=tokens.map(token=>{const word=forms.get(token);if(word)return{token,id:word.id,status:order(word.introducedAt)<=order(at)?word.introducedAt.startsWith(`${l.level}-${l.order}`)?'nieuw in deze les':'eerder bekend':'toekomstig'};const surface=m.didacticSurfaceForms?.find(f=>f.form===token&&order(f.introducedAt)<=order(at));return{token,id:surface?.wordId,status:basic.has(token)||surface?'bekende / voorbereide vorm':'onvoorbereid of nader beoordelen'}});
      const instruction=m.instructions.find(i=>i.id===p.instructionId);
      return{id:p.id,label:p.label,kind:p.kind,newWords:newWords.map(w=>({id:w.id,japanese:w.japanese,meaning:w.meaning})),reusedWordIds:p.wordIds.filter(id=>words.get(id)?.introducedAt!==at),missingSentencePreparation:newWords.filter(w=>!prepared.has(w.id)).map(w=>w.id),readingId:reading?.id,text:reading?.text,classifiedText:classified,questions:p.questions,instruction:instruction?{id:instruction.id,text:instruction.textJa,requiredWordIds:instruction.requiredVocabIds,tooEarly:instruction.requiredVocabIds.filter(id=>order(words.get(id).introducedAt)>order(at))}:null,dialogueId:p.dialogueId||null};
    }),newWordCount:l.applications.reduce((sum,p)=>sum+p.wordIds.filter(id=>words.get(id)?.introducedAt===`${l.level}-${l.order}-${p.part}`).length,0)
  }));
}
module.exports={audit};
if(require.main===module){const folder=path.resolve(__dirname,'../docs/didactic-11-14');fs.mkdirSync(folder,{recursive:true});const file=process.argv.includes('--baseline')?'audit-before.json':'audit-after.json';fs.writeFileSync(path.join(folder,file),JSON.stringify(audit(),null,2)+'\n');console.log(file)}
