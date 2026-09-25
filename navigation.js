(() => {
  const parents={levels:'app-home',level:'levels',module:'level',flashcards:'levels',session:'levels',options:'app-home','options-profile':'options','options-audio':'options'};
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
    return`${base}/learn${['level','module'].includes(screen)?`/${screen}/${Number(level)+1}`:'/levels'}`;
  }
  window.LanguageJourneyNavigation={parents,parentOf,parseHash,formatHash};
})();
