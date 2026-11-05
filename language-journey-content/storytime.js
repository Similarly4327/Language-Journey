/* Optional reading content. Deliberately separate from vocabulary, tests and Recall. */
(function(root){
  'use strict';
  const stories=[{
    id:'storytime-home-1',level:11,title:'Weer thuis',
    setting:'Na een dag buiten is het tijd om thuis iets te drinken.',
    roles:{ren:{name:'Ren',japanese:'レン',gender:'male'},miku:{name:'Miku',japanese:'ミク',gender:'female'}},
    lines:[
      {speaker:'ren',japanese:'ただいま。',dutch:'Ik ben thuis.'},
      {speaker:'miku',japanese:'おかえりなさい。',dutch:'Welkom thuis.'},
      {speaker:'miku',japanese:'みず を どうぞ。',dutch:'Hier, water voor je.'},
      {speaker:'ren',japanese:'ありがとう。',dutch:'Dank je.'}
    ],
    references:[
      'https://www.erin.jpf.go.jp/materials/basic/download/erin_lesson03_basic_script.pdf',
      'https://www.mext.go.jp/a_menu/nihongo_kyoiku/kyoiku/nanmin_nihongokyoiku/kyozai_1/pdf/01.pdf'
    ]
  }];
  const api={stories,byId:Object.fromEntries(stories.map(story=>[story.id,story]))};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.LanguageJourneyStorytime=api;
})(typeof globalThis!=='undefined'?globalThis:this);
