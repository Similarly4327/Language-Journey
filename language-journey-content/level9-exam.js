(function(root){
  'use strict';
  function usedVocabulary(m,texts,forms=[]){
    const tokens=new Set(texts.join(' ').split(/[\s。、：！？!?]+/u));
    return [...new Set([...forms.map(form=>`vocab-${form}`),...m.vocabulary.filter(word=>word.coreOrContext!=='legacy'&&tokens.has(word.japanese)).map(word=>word.id)])];
  }
  function selectContexts(m,shuffle){
    return m.level9ExamPlan.flatMap(plan=>{
      const rows=shuffle(m.level9ExamBank.filter(q=>q.lessonId===plan.lessonId)),options=[];
      function visit(start,selected,situations,frames){
        if(selected.length===plan.contextCount){
          const covered=new Set(selected.flatMap(q=>q.targetVocabIds));
          if(plan.requiredTargetIds.every(id=>covered.has(id))&&covered.size>=plan.minimumTargets)options.push(selected);
          return;
        }
        for(let i=start;i<=rows.length-(plan.contextCount-selected.length);i++){
          const q=rows[i];
          if((frames[q.examFrame]||0)>=2||q.examSituationIds.some(id=>situations.has(id)))continue;
          visit(i+1,[...selected,q],new Set([...situations,...q.examSituationIds]),{...frames,[q.examFrame]:(frames[q.examFrame]||0)+1});
        }
      }
      visit(0,[],new Set(),{});
      if(!options.length)throw Error(`Level 9: geen evenwichtige contextselectie voor ${plan.lessonId}`);
      return shuffle(options)[0];
    });
  }
  function apply(m){
    const bank=[];
    const add=(lesson,frame,variant,prompt,context,correct,other,translation,forms=[])=>{
      const id=`l9-${lesson}`,q={kind:'order',sourceId:`exam-l9-${lesson}-${frame}-${variant}`,lessonId:id,category:'application',examFrame:frame,prompt,context,contextLanguage:/[ぁ-ヶ]/u.test(context)?'ja':'nl',correct,choices:[correct,...other],instruction:'Gebruik de aanwijzing of tekst. Kies één antwoord.',translation,usedVocabIds:[...new Set(forms.map(form=>`vocab-${form}`))],targetGoalIds:[`grammar:grammar-${id}`,`pattern:pattern-${id}`]};
      bank.push(q);
    };
    const places=[['みせ','winkel'],['えき','station'],['うち','huis']];
    const subject=place=>place==='みせ'?'De winkel':place==='えき'?'Het station':'Het huis';
    for(const [i,[place,nl]] of places.entries()){
      const other=places.filter(p=>p[0]!==place);
      add(1,'where-question',i,`Hoe vraag je waar ${subject(place).toLowerCase()} is?`,'',`${place} は どこ です か`,[`${place} は ここ です か`,`${place} は あそこ です か`],`Waar is ${subject(place).toLowerCase()}?`,[place,'どこ','ここ','あそこ']);
      add(1,'speaker-distance',i,'Welke plaats is volgens de spreker hier?',`${place} は ここ です。${other[0][0]} は あそこ です。`,`${subject(place)} is bij de spreker.`,[`${subject(other[0][0])} is bij de spreker.`,'Beide plaatsen zijn verder weg.'],`${place}: hier; ${other[0][0]}: daar verderop.`,[place,other[0][0],'ここ','あそこ']);
      add(1,'listener-distance',i,'Waar is de genoemde plaats volgens de spreker?',`${place} は そこ です。`,`${subject(place)} is bij de luisteraar.`,[`${subject(place)} is bij de spreker.`,`${subject(place)} is ver van beiden.`],`${nl}: daar bij jou.`,[place,'そこ']);
    }
    const dirs=[['ひだり','links'],['みぎ','rechts'],['まっすぐ','rechtdoor']];
    for(const [i,[dir,nl]] of dirs.entries()){
      const place=places[i],other=dirs.filter(d=>d[0]!==dir);
      add(2,'direction-map',i,`Welke Japanse aanwijzing hoort bij ${place[1]==='winkel'?'de winkel':`het ${place[1]}`}?`,`${subject(place[0])} is ${nl}.\n${subject(places[(i+1)%3][0])} is ${other[0][1]}.`,`${place[0]} は ${dir} です`,other.map(d=>`${place[0]} は ${d[0]} です`),`${place[1]}: ${nl}.`,[place[0],dir,places[(i+1)%3][0],other[0][0]]);
      add(2,'direction-meaning',i,'Welke routeaanwijzing klopt met de tekst?',`${place[0]} は ${dir} です。`,`Ga ${nl} voor ${place[1]==='winkel'?'de winkel':`het ${place[1]}`}.`,other.map(d=>`Ga ${d[1]} voor ${place[1]==='winkel'?'de winkel':`het ${place[1]}`}.`),`${place[1]}: ${nl}.`,[place[0],...dirs.map(d=>d[0])]);
      const road=dir==='まっすぐ'?'De weg loopt rechtdoor.':`De weg ligt ${nl}.`;
      add(2,'road-context',i,'Welke zin past bij de aanwijzing over de weg?',road,`みち は ${dir} です`,other.map(d=>`みち は ${d[0]} です`),road,['みち',dir]);
    }
    const relative=[['まえ','voor'],['うしろ','achter'],['となり','naast'],['なか','in']];
    for(const [i,[pos,nl]] of relative.entries()){
      const subject=i===3?'ねこ':places[i%3][0],reference=i===3?'うち':places[(i+1)%3][0],subjectNl=i===3?'De kat':i%3===0?'De winkel':i%3===1?'Het station':'Het huis',refNl=i===3?'het huis':(i+1)%3===0?'de winkel':(i+1)%3===1?'het station':'het huis',others=relative.filter(p=>p[0]!==pos).slice(0,2);
      const text=`${subject} は ${reference} の ${pos} です。`;
      add(3,'relative-reading',i,'Welke beschrijving klopt?',text,`${subjectNl} is ${nl} ${refNl}.`,others.map(p=>`${subjectNl} is ${p[1]} ${refNl}.`),`${subjectNl} is ${nl} ${refNl}.`,[subject,reference,pos,...others.map(p=>p[0])]);
      add(3,'relative-production',i,'Welke Japanse zin past bij deze ligging?',`${subjectNl} is ${nl} ${refNl}.`,text.replace('。',''),others.map(p=>`${subject} は ${reference} の ${p[0]} です`),`${subjectNl} is ${nl} ${refNl}.`,[subject,reference,pos]);
    }
    const positions=[['うえ','op','ねこ','ベッド','De kat','het bed'],['した','onder','いぬ','ベッド','De hond','het bed'],['そと','buiten','ねこ','うち','De kat','het huis'],['ちかく','dicht bij','うち','みせ','Het huis','de winkel']];
    for(const [i,[pos,nl,subject,ref,sn,rn]] of positions.entries()){
      const alternatives=positions.filter(p=>p[0]!==pos).slice(0,2),text=`${subject} は ${ref} の ${pos} です。`;
      add(4,'position-reading',i,'Welke locatie volgt uit de tekst?',text,`${sn} is ${nl} ${rn}.`,alternatives.map(p=>`${sn} is ${p[1]} ${rn}.`),`${sn} is ${nl} ${rn}.`,[subject,ref,pos,...alternatives.map(p=>p[0])]);
      add(4,'position-production',i,'Welke zin past bij de beschrijving?',`${sn} is ${nl} ${rn}.`,text.replace('。',''),alternatives.map(p=>`${subject} は ${ref} の ${p[0]} です`),`${sn} is ${nl} ${rn}.`,[subject,ref,pos]);
    }
    add(4,'two-facts',0,'Welke combinatie klopt?', 'ねこ は ベッド の した です。いぬ は うち の そと です。','De kat is onder het bed; de hond is buiten het huis.',['De kat is op het bed; de hond is buiten het huis.','De kat is onder het bed; de hond is in het huis.'],'De kat is onder het bed. De hond is buiten het huis.',['ねこ','ベッド','した','いぬ','うち','そと','うえ','なか']);
    const actions=[['こうえん','het park','パン','brood','たべます','eet'],['うち','huis','みず','water','のみます','drink'],['がっこう','school','ほん','een boek','よみます','lees'],['レストラン','het restaurant','パン','brood','たべます','eet']];
    const location=name=>name==='huis'?'Thuis.':name==='school'?'Op school.':`In ${name}.`;
    for(const [i,[place,pnl,obj,onl,verb,vnl]] of actions.entries()){
      const text=`${place} で ${obj} を ${verb}。`,translation=`Ik ${vnl} ${onl} ${place==='うち'?'thuis':place==='がっこう'?'op school':`in ${pnl}`}.`;
      add(5,'action-reading',i,'Waar gebeurt de handeling?',text,location(pnl),actions.filter(a=>a[0]!==place).slice(0,2).map(a=>location(a[1])),translation,[place,obj,verb,...actions.filter(a=>a[0]!==place).slice(0,2).map(a=>a[0])]);
      add(5,'de-action',i,'Welke zin markeert de plaats van de handeling?',translation,text.replace('。',''),[`${place} に ${obj} を ${verb}`,`${place} の ${obj} を ${verb}`],translation,[place,obj,verb]);
    }
    add(5,'week-plan',0,'Welke afspraak hoort bij maandag?', 'げつようび：こうえん で パン を たべます。\nきんようび：うち で ほん を よみます。','Op maandag eet ik brood in het park.',['Op maandag lees ik thuis een boek.','Op maandag lees ik in het park een boek.'],'Maandag: brood eten in het park. Vrijdag: thuis een boek lezen.',['げつようび','きんようび','こうえん','パン','たべます','うち','ほん','よみます']);
    // Situation keys describe facts, independently of reading/production frames.
    const fact=(subject,relation,reference='')=>`${subject}|${relation}|${reference}`;
    for(const q of bank){
      const variant=Number(q.sourceId.split('-').at(-1)),frame=q.examFrame;
      let targets=[],situations=[];
      if(frame==='where-question'){targets=['どこ'];situations=[fact(places[variant][0],'where')]}
      else if(frame==='speaker-distance'){const place=places[variant][0],other=places.filter(p=>p[0]!==place)[0][0];targets=['ここ','あそこ'];situations=[fact(place,'ここ'),fact(other,'あそこ')]}
      else if(frame==='listener-distance'){targets=['そこ'];situations=[fact(places[variant][0],'そこ')]}
      else if(frame.startsWith('direction-')||frame==='road-context'){
        const dir=dirs[variant][0],place=places[variant][0];targets=[dir];situations=[fact(frame==='road-context'?'みち':place,dir)];
        if(frame==='direction-map')situations.push(fact(places[(variant+1)%3][0],dirs.filter(d=>d[0]!==dir)[0][0]));
      }else if(frame.startsWith('relative-')){targets=[relative[variant][0]];situations=[fact(variant===3?'ねこ':places[variant%3][0],targets[0],variant===3?'うち':places[(variant+1)%3][0])]}
      else if(frame.startsWith('position-')){const [pos,,subject,reference]=positions[variant];targets=[pos];situations=[fact(subject,pos,reference)]}
      else if(frame==='two-facts'){targets=['した','そと'];situations=[fact('ねこ','した','ベッド'),fact('いぬ','そと','うち')]}
      else if(frame==='week-plan'){targets=['こうえん','うち'];situations=[fact('パン','たべます','こうえん'),fact('ほん','よみます','うち')]}
      else {const [place,,obj,,verb]=actions[variant];targets=[place];situations=[fact(obj,verb,place)]}
      q.examSituationIds=situations;q.targetVocabIds=targets.map(form=>`vocab-${form}`);
      q.usedVocabIds=usedVocabulary(m,[q.prompt,q.context,q.correct,...q.choices],q.usedVocabIds.map(id=>id.slice(6)));
    }
    m.level9ExamPlan=[
      {lessonId:'l9-1',contextCount:3,requiredTargetIds:['ここ','そこ','あそこ','どこ']},
      {lessonId:'l9-2',contextCount:3,requiredTargetIds:dirs.map(d=>d[0])},
      {lessonId:'l9-3',contextCount:4,requiredTargetIds:relative.map(p=>p[0])},
      {lessonId:'l9-4',contextCount:4,requiredTargetIds:positions.map(p=>p[0])},
      {lessonId:'l9-5',contextCount:3,requiredTargetIds:[],minimumTargets:3}
    ].map(plan=>({...plan,requiredTargetIds:plan.requiredTargetIds.map(form=>`vocab-${form}`),minimumTargets:plan.minimumTargets||plan.requiredTargetIds.length}));
    m.level9ExamBank=bank;
    m.level9ExamAudit={coreWordIds:m.vocabulary.filter(w=>w.introducedAt?.match(/^9-[1-5]$/)&&w.coreOrContext==='core').map(w=>w.id),excluded:['vocab-ホテル'],source:'https://www.irodori.jpf.go.jp/assets/data/Grammar_all.pdf'};
    // Metadata only: no asset, recording, pipeline call or existing audio entry is replaced.
    for(const q of bank)for(const [index,text] of [q.context,q.correct,...q.choices].entries())if(/[ぁ-ヶ]/u.test(text)&&!/[a-z]/i.test(text))m.didacticUtterances.push({id:`sentence-${q.sourceId}-${index}`,text,audioTextKana:text.replaceAll('：','、').replace(/(^|\s)は(?=\s|。|$)/g,'$1わ').replace(/(^|\s)を(?=\s|。|$)/g,'$1お'),level:9,lessonId:q.lessonId});
  }
  const api={apply,selectContexts,usedVocabulary};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.LanguageJourneyLevel9Exam=api;
})(typeof globalThis!=='undefined'?globalThis:this);
