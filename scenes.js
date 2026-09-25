(() => {
  // New locations only need one entry here and a level or module mapping below.
  const themes={
    journey:{titleKey:'location.journey',arrival:'assets/japan-journey-home.webp',interior:'assets/japan-journey-home.webp',bodyScene:'journey'},
    school:{titleKey:'location.school',arrival:'assets/scene-school-arrival.webp',interior:'assets/anime-classroom.webp',bodyScene:'classroom'},
    home:{titleKey:'location.home',arrival:'assets/scene-home-arrival.webp',interior:'assets/scene-home-interior.webp',bodyScene:'home'},
    market:{titleKey:'location.market',arrival:'assets/scene-market-arrival.webp',interior:'assets/scene-market-interior.webp',bodyScene:'market'},
    airport:{titleKey:'course.japanese.level.12.title',subtitleKey:'course.japanese.level.12.support',arrival:'assets/scene-airport-arrival.png',interior:'assets/scene-airport-interior.png',bodyScene:'airport'}
  };
  const levelThemes=['school','school','school','school','school','home','market','journey','journey','market','home','airport'];
  const moduleThemes={family:'home',supermarket:'market',airport:'airport'};
  const imageCache=new Map();
  let activeToken=0,enterTimer=null,hideTimer=null;
  function resolve({level,moduleId}={}){
    return themes[moduleThemes[moduleId]||levelThemes[level]]||themes.journey;
  }
  function preload(theme){
    if(!theme)return;
    for(const url of [theme.arrival,theme.interior]){
      if(!url||imageCache.has(url))continue;
      const image=new Image();image.decoding='async';image.src=url;imageCache.set(url,image);
    }
  }
  function cancel(){
    activeToken++;
    clearTimeout(enterTimer);clearTimeout(hideTimer);
    const overlay=document.getElementById('sceneTransition');
    if(overlay){overlay.classList.remove('is-visible');overlay.hidden=true}
  }
  function start({theme=themes.journey,locale='nl',phase='arrival',onEnter}={}){
    cancel();
    const overlay=document.getElementById('sceneTransition');
    if(!overlay){onEnter?.();return}
    const token=activeToken,selected=theme||themes.journey;
    preload(selected);
    overlay.style.setProperty('--arrival-image',`url("${selected[phase]||selected.arrival||themes.journey.arrival}")`);
    const label=document.getElementById('sceneTransitionLabel');
    label.textContent='';
    const title=document.createElement('strong');
    title.textContent=window.LanguageJourneyI18n.translate(selected.titleKey,locale);
    label.appendChild(title);
    if(selected.subtitleKey){
      const subtitle=document.createElement('small');
      subtitle.textContent=window.LanguageJourneyI18n.translate(selected.subtitleKey,locale);
      label.appendChild(subtitle);
    }
    overlay.hidden=false;
    requestAnimationFrame(()=>{if(token===activeToken)overlay.classList.add('is-visible')});
    enterTimer=setTimeout(()=>{
      if(token!==activeToken)return;
      onEnter?.();
      overlay.classList.remove('is-visible');
      hideTimer=setTimeout(()=>{if(token===activeToken)overlay.hidden=true},240);
    },1100);
  }
  window.LanguageJourneyScenes={themes,levelThemes,moduleThemes,resolve,preload,start,cancel};
})();
