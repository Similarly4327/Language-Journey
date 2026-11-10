(function(root,factory){
  const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.LanguageJourneyLessonInfo=api;
})(typeof window!=='undefined'?window:globalThis,function(){
  'use strict';
  // The host supplies canonical dictionary entries and existing knowledge lookups.
  // This selector only builds presentation rows; it never records encounters.
  function deriveRows({entries,vocabulary=[],level,lessonId=null,lessonPoint=null,lessonEntryIds=[],originById={},isKnown=()=>false,kanjiKnown=()=>false,kanjiStatus=null,isBlocked=()=>false,route=null}){
    const selected=new Set(lessonEntryIds),rows=[],seen=new Set(),pointPrefix=`${level}-`;
    const add=(entry,extra={})=>{
      const key=`${entry.id}:${extra.orthography?'orthography':'entry'}`;if(seen.has(key))return;seen.add(key);
      const current=!!(extra.current||selected.has(entry.id)||(lessonId&&entry.lessonId===lessonId));
      rows.push({id:entry.id,kind:extra.orthography?'kanji':entry.kind,jp:extra.orthography||entry.jp,reading:extra.orthography?(extra.reading||entry.kana||''):[entry.kana!==entry.jp?entry.kana:'',entry.romaji].filter(Boolean).join(' · '),meaning:entry.meaning||'',origin:extra.origin||originById[entry.id]||entry.label||'',current,known:extra.orthography?!!kanjiKnown(entry.id):!!isKnown(entry),status:extra.orthography&&kanjiStatus?kanjiStatus(entry.id):null,lessonId:extra.lessonId||entry.lessonId||''});
    };
    for(const entry of Object.values(entries)){
      if(entry.legacy)continue;
      const word=vocabulary.find(item=>item.id===entry.id);
      if(route){if(word?.routeId!==route)continue}
      else if(word?.routeId)continue;
      const sameLevel=entry.level===level||(level===2&&entry.kind==='kana'&&entry.level===1);
      if(route||sameLevel||selected.has(entry.id))add(entry,{origin:level===2&&entry.level===1?'Herhaling uit level 1':undefined});
    }
    if(!route)for(const word of vocabulary){
      const point=String(word.kanjiIntroducedAt||'');if(!word.kanji||!point.startsWith(pointPrefix))continue;
      const entry=entries[word.id];if(!entry)continue;
      const order=Number(point.slice(pointPrefix.length).split('-')[0]);
      add(entry,{orthography:word.kanji,reading:word.kanjiReading||word.kana,origin:`Level ${level} · Les ${order}`,current:!!lessonId&&(selected.has(word.id)||entry.lessonId===lessonId||(lessonPoint&&point.split('-').slice(0,2).join('-')===lessonPoint)||lessonId===`l${level}-${order}`),lessonId:lessonId||entry.lessonId});
    }
    return rows.map(row=>isBlocked(row.id)?{...row,blocked:true,jp:'Verborgen tijdens deze vraag',reading:'',meaning:'Deze hulp is na je antwoord weer beschikbaar.'}:row);
  }
  function create({document,window,host,openDictionary,isDictionaryOpen=()=>false,onOpen=()=>{},onClose=()=>{}}){
    const button=document.createElement('button');button.type='button';button.className='jlpt-info-button lesson-info-button';button.textContent='i';button.setAttribute('aria-label','Woorden en tekens van deze les en dit level');button.setAttribute('aria-haspopup','dialog');button.hidden=true;host.prepend(button);
    const overlay=document.createElement('div');overlay.className='lesson-info-backdrop';overlay.hidden=true;overlay.innerHTML='<section class="lesson-info-dialog" role="dialog" aria-modal="true" aria-labelledby="lessonInfoTitle"><div class="lesson-info-head"><h2 id="lessonInfoTitle">Woorden en tekens</h2><button type="button" class="btn tiny" data-info-close>Sluiten ×</button></div><p class="small">Dit overzicht is naslag. Bekijken verandert je voortgang niet.</p><div data-info-content></div></section>';document.body.appendChild(overlay);
    const close=overlay.querySelector('[data-info-close]'),content=overlay.querySelector('[data-info-content]');let data=null,returnFocus=null,scroll=null,previousOverflow='';
    function dismiss(){if(overlay.hidden||isDictionaryOpen())return;overlay.hidden=true;document.body.style.overflow=previousOverflow;onClose();if(scroll)window.scrollTo(scroll.x,scroll.y);if(returnFocus?.isConnected)returnFocus.focus({preventScroll:true})}
    function draw(){
      content.replaceChildren();const rows=deriveRows(data);const groups=[['Deze les',rows.filter(row=>row.current)],['Dit level',rows.filter(row=>!row.current)]];
      if(!data.lessonId&&!data.lessonEntryIds?.length)groups.shift();
      for(const [title,items] of groups){
        const section=document.createElement('section'),heading=document.createElement('h3');heading.textContent=title;section.appendChild(heading);
        if(!items.length){const empty=document.createElement('p');empty.className='small';empty.textContent='Geen afzonderlijke items beschikbaar.';section.appendChild(empty)}
        for(const row of items){const item=document.createElement('div');item.className='lesson-info-row';const link=document.createElement('button');link.type='button';link.className='dictionary-link';link.lang='ja';link.textContent=row.jp;link.disabled=!!row.blocked;link.onclick=()=>openDictionary(row.id,row.lessonId,row.jp,row.meaning);const details=document.createElement('div');details.className='small';details.textContent=[row.reading,row.kind==='kana'?'Klankteken':row.kind==='kanji'?'Schrijfwijze':row.meaning,row.origin,row.status||(row.known?'Bekend':'Vooruitblik')].filter(Boolean).join(' · ');item.append(link,details);section.appendChild(item)}content.appendChild(section);
      }
    }
    button.onclick=()=>{if(!data)return;returnFocus=document.activeElement;scroll={x:window.scrollX||0,y:window.scrollY||0};previousOverflow=document.body.style.overflow;document.body.style.overflow='hidden';draw();overlay.hidden=false;onOpen();close.focus()};close.onclick=dismiss;overlay.onclick=event=>{if(event.target===overlay)dismiss()};overlay.onkeydown=event=>{if(isDictionaryOpen())return;if(event.key==='Escape'){event.preventDefault();dismiss();return}if(event.key==='Tab'){const nodes=[...overlay.querySelectorAll('button:not(:disabled)')];if(!nodes.length)return;const first=nodes[0],last=nodes[nodes.length-1];if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus()}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus()}}};
    return {update(next){data=next;button.hidden=!next;if(!next&&!overlay.hidden)dismiss()},button,overlay,close:dismiss};
  }
  return {deriveRows,create};
});
