(() => {
  const parents={levels:'app-home',level:'levels',module:'level',intro:'levels',flashcards:'levels',session:'levels',options:'app-home','options-profile':'options','options-audio':'options'};
  function parentOf(screen,{courseId='japanese'}={}){
    // The route table belongs to the platform. Courses may add their own child routes.
    return parents[screen]||null;
  }
  function parseHash(hash,courses){
    const path=String(hash||'').replace(/^#\/?/,'').split('/').filter(Boolean);
    if(!path.length||path[0]==='app')return{screen:'app-home',courseId:null,primaryTab:null};
    if(path[0]==='options'&&path.length<=2&&(!path[1]||['profile','audio'].includes(path[1])))return{screen:path[1]?`options-${path[1]}`:'options',courseId:null,primaryTab:null};
    if(path[0]!=='course'||!courses[path[1]])return null;
    const courseId=path[1],primaryTab=path[2]||'learn';
    if(primaryTab==='recall')return{screen:'flashcards',courseId,primaryTab};
    if(primaryTab==='progress')return{screen:'session',courseId,primaryTab};
    if(primaryTab!=='learn')return null;
    const page=path[3]||'levels';
    if(page==='intro')return{screen:'intro',courseId,primaryTab};
    if(['level-id','module-id'].includes(page)){
      const id=path[4],screen=page==='module-id'?'module':'level';
      if(id==='social-intro')return{screen:'intro',courseId,primaryTab,level:6};
      if(id==='kana-foundation')return{screen,courseId,primaryTab,level:0};
      if(id==='kana-mix')return{screen,courseId,primaryTab,level:1};
      const match=String(id||'').match(/^level-(\d+)$/),number=Number(match?.[1]);
      const manifest=window[courses[courseId]?.contentKey||'LanguageJourneyContent']?.manifest;
      if(match&&id===`level-${number}`&&manifest?.levels?.some(level=>level.number===number&&level.status==='playable')&&number>=3)return{screen,courseId,primaryTab,level:number-1};
      return null;
    }
    // Oude /learn/home-links blijven werken, maar hebben geen apart scherm meer.
    if(page==='home'||page==='levels')return{screen:'levels',courseId,primaryTab};
    if(['level','module'].includes(page)&&/^\d+$/.test(path[4]||''))return{screen:page,courseId,primaryTab,level:Number(path[4])-1};
    return null;
  }
  function formatHash({screen,courseId,primaryTab,level}){
    if(!courseId||screen==='app-home'||screen?.startsWith('options'))return screen?.startsWith('options')?`#/options${screen==='options'?'':`/${screen.slice(8)}`}`:'#/';
    const base=`#/course/${encodeURIComponent(courseId)}`;
    if(primaryTab==='recall'||screen==='flashcards')return`${base}/recall`;
    if(primaryTab==='progress'||screen==='session')return`${base}/progress`;
    if(screen==='intro')return`${base}/learn/level-id/social-intro`;
    if(['level','module'].includes(screen)){
      if(courseId!=='japanese')return`${base}/learn/${screen}/${Number(level)+1}`;
      const index=Number(level),id=index===0?'kana-foundation':index===1?'kana-mix':`level-${index+1}`;
      return`${base}/learn/${screen}-id/${id}`;
    }
    return`${base}/learn/levels`;
  }
  window.LanguageJourneyNavigation={parents,parentOf,parseHash,formatHash};
})();
