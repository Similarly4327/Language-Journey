(() => {
  const preferenceKey='language-journey-platform-v1';
  const courses={
    japanese:{id:'japanese',displayName:'Japans',nativeName:'日本語',targetLanguage:'ja',contentKey:'LanguageJourneyContent',storageKey:'taal-japanse-leerapp-v1',defaultSceneTheme:'school',identity:'japan',transition:'flight-japan',avatars:{female:'assets/avatar-female_starter_greeting_bun.webp',male:'assets/avatar-male_starter_greeting.webp'}}
  };
  const courseLocales={};
  function registerCourse(config){
    if(!config||!config.id||!config.targetLanguage||!config.contentKey)return false;
    if(courses[config.id])return false;
    courses[config.id]={...config,storageKey:config.storageKey||`language-journey-course-${config.id}-v1`};
    return true;
  }
  function course(courseId='japanese'){return courses[courseId]||null}
  function content(courseId='japanese'){const selected=course(courseId);return selected?window[selected.contentKey]||null:null}
  function progressKey(courseId='japanese'){return course(courseId)?.storageKey||`language-journey-course-${courseId}-v1`}
  function registerCourseLocale(courseId,uiLanguage,resource){
    if(!course(courseId)||!resource||typeof resource!=='object')return;
    (courseLocales[courseId]??={})[window.LanguageJourneyI18n.language(uiLanguage)]=resource;
  }
  function courseText(courseId,uiLanguage,kind,id,field,fallbackValue=''){
    const locale=window.LanguageJourneyI18n.language(uiLanguage);
    return courseLocales[courseId]?.[locale]?.[kind]?.[id]?.[field]
      ??courseLocales[courseId]?.nl?.[kind]?.[id]?.[field]
      ??fallbackValue;
  }
  function preferences(){
    try{
      const saved=JSON.parse(localStorage.getItem(preferenceKey)||'{}');
      return{uiLanguage:window.LanguageJourneyI18n.language(saved.uiLanguage),courseId:courses[saved.courseId]?saved.courseId:'japanese'};
    }catch{return{uiLanguage:'nl',courseId:'japanese'}}
  }
  function savePreferences(value){
    try{localStorage.setItem(preferenceKey,JSON.stringify({uiLanguage:window.LanguageJourneyI18n.language(value.uiLanguage),courseId:course(value.courseId)?.id||'japanese'}))}catch(error){console.warn('Appvoorkeuren opslaan mislukt:',error)}
  }
  window.LanguageJourneyPlatform={courses,course,content,progressKey,registerCourse,registerCourseLocale,courseText,preferences,savePreferences};
})();
