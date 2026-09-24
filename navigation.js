(() => {
  const parents={levels:'home',level:'levels',module:'level',flashcards:'home',session:'home'};
  function parentOf(screen,{courseId='japanese'}={}){
    // The route table belongs to the platform. Courses may add their own child routes.
    return parents[screen]||null;
  }
  window.LanguageJourneyNavigation={parents,parentOf};
})();
