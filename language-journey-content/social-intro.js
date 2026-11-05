/* An additive chapter before Level 7. Numeric legacy levels/IDs never move. */
(function(root){
  'use strict';
  const reference='https://www.irodori.jpf.go.jp/assets/data/starter/pdf/X_L01.pdf';
  const introductions='https://www.irodori.jpf.go.jp/assets/data/starter/pdf/X_L03.pdf';
  const socialExpressions='https://yg.jpf.go.jp/wp-content/uploads/2025/11/JP_-Waku-Waku-Nihongo202251125.pdf';
  function apply(m){
    const groups=[
      {id:'intro-greetings',title:'Iemand begroeten',explanation:'In de ochtend zeg je おはようございます. Overdag gebruik je こんにちは. In de avond begroet je iemand met こんばんは.',words:[
        ['おはようございます','ohayou gozaimasu','goedemorgen (beleefd)','おはようございます'],
        ['こんにちは','konnichiwa','hallo / goedendag','こんにちわ'],
        ['こんばんは','konbanwa','goedenavond','こんばんわ']
      ],models:[['こんにちは。','Hallo.','こんにちわ。']],dialogue:[['A','こんにちは。','Hallo.'],['B','こんにちは。','Hallo.']],checks:[['Je ontmoet iemand in de avond. Wat zeg je?','こんばんは',['こんにちは','おはようございます']]]},
      {id:'intro-goodbyes',title:'Afscheid nemen',explanation:'またね is informeel: tot ziens. さようなら gebruik je bij een duidelijker afscheid. おやすみなさい zeg je voor het slapen of wanneer je aan het einde van de avond afscheid neemt.',words:[
        ['おやすみなさい','oyasuminasai','welterusten','おやすみなさい'],
        ['またね','mata ne','tot ziens (informeel)','またね'],
        ['さようなら','sayounara','tot ziens / vaarwel','さようなら']
      ],models:[['おやすみなさい。','Welterusten.','おやすみなさい。']],dialogue:[['A','またね。','Tot ziens.'],['B','またね。','Tot ziens.']],checks:[['Wat zeg je als iemand gaat slapen?','おやすみなさい',['またね','さようなら']]]},
      {id:'intro-meeting',title:'Jezelf voorstellen',explanation:'Bij een eerste ontmoeting begin je met はじめまして. Met わたし は … です noem je je naam. よろしくおねがいします sluit de kennismaking vriendelijk af; een letterlijke Nederlandse vertaling past hier niet goed.',words:[
        ['はじめまして','hajimemashite','aangenaam (bij een eerste ontmoeting)','はじめまして'],
        ['おなまえ は なん です か','onamae wa nan desu ka','hoe heet u?','おなまえ わ なん です か'],
        ['よろしくおねがいします','yoroshiku onegaishimasu','prettig kennis te maken','よろしくおねがいします']
      ],models:[['わたし は {{avatarNameJapanese}} です。','Ik ben {{avatarName}}.','わたし わ {{avatarNameJapanese}} です。']],dialogue:[['A','はじめまして。','Aangenaam.'],['B','おなまえ は なん です か。','Hoe heet u?'],['A','わたし は {{avatarNameJapanese}} です。','Ik ben {{avatarName}}.'],['B','よろしくおねがいします。','Prettig kennis te maken.']],checks:[['Je reisgenoot {{avatarName}} noemt de eigen naam. Welke zin past?','わたし は {{avatarNameJapanese}} です。',['おなまえ は なん です か。','はじめまして。']],['Welke vraag betekent: hoe heet u?','おなまえ は なん です か',['はじめまして','よろしくおねがいします']]]},
      {id:'intro-thanks',title:'Aanbieden en bedanken',explanation:'Met どうぞ bied je iemand iets aan: alsjeblieft. Met ありがとう bedank je iemand. Tegen iemand die je niet goed kent, is ありがとうございます beleefder; hier oefen je de korte vorm met je reisgenoot.',words:[
        ['どうぞ','douzo','alsjeblieft (bij aanbieden)','どうぞ'],
        ['ありがとう','arigatou','dank je','ありがとう']
      ],models:[['どうぞ。','Alsjeblieft.','どうぞ。'],['ありがとう。','Dank je.','ありがとう。']],dialogue:[['A','どうぞ。','Alsjeblieft.'],['B','ありがとう。','Dank je.']],checks:[['Iemand biedt je iets aan met どうぞ. Hoe bedank je?','ありがとう',['どうぞ']]]}
    ];
    const lessons=groups.map((group,index)=>{
      const wordIds=group.words.map(([form,romaji,meaning,audioTextKana])=>{
        const existing=m.vocabulary.find(w=>w.japanese===form&&w.coreOrContext!=='legacy');
        if(existing)return existing.id;
        const id='vocab-intro-'+['morning','day','evening','goodnight','see-you','goodbye','first-meeting','your-name','nice-to-meet','offer','thanks'][[0,3,6,9][index]+group.words.findIndex(w=>w[0]===form)];
        m.vocabulary.push({id,japanese:form,reading:form,romaji,meaning,meanings:[meaning],partOfSpeech:'expression',themes:['greetings','social'],coreOrContext:'core',recallCore:true,introducedAt:`7-${index+1}`,availableFrom:`7-${index+1}`,lessonId:group.id,routeId:'social-intro',kanjiForm:null,kanjiIntroducedAt:null,audioId:null,audioTextKana,source:index===2?introductions:reference,notes:index===2&&form==='よろしくおねがいします'?'Een vaste sociale uitdrukking; de betekenis volgt hier de kennismakingscontext.':form==='さようなら'?'Geen universeel equivalent van elk informeel Nederlands doei. Met een bekende is またね vaak natuurlijker.':''});
        return id;
      });
      const lesson={id:group.id,level:7,order:index+1,kind:'social-intro',routeId:'social-intro',title:group.title,goal:group.explanation.split('.')[0]+'.',explanation:group.explanation,wordIds,grammarIds:[],patternIds:[],models:group.models.map(([sentence,meaning,audioTextKana],i)=>({id:`sentence-${group.id}-${i+1}`,sentence,meaning,audioTextKana,parts:[],linkedWordIds:wordIds})),dialogue:group.dialogue,checks:group.checks,reference:index===2?introductions:reference};
      return lesson;
    });
    for(const lesson of lessons){
      for(const [,text] of lesson.dialogue){
        if(text.includes('{{'))continue;
        const word=m.vocabulary.find(w=>w.japanese===text.replace(/。$/,''));
        if(word&&!m.didacticUtterances.some(entry=>entry.text===text))m.didacticUtterances.push({id:`sentence-${lesson.id}-dialogue-${lesson.dialogue.findIndex(line=>line[1]===text)+1}`,text,audioTextKana:(word.audioTextKana||word.reading)+'。',level:7,lessonId:lesson.id});
      }
      for(const id of lesson.wordIds)for(const direction of ['jp-nl','nl-jp']){
        const word=m.vocabulary.find(w=>w.id===id),correct=direction==='jp-nl'?word.meaning:word.japanese;
        m.exercises.push({id:`exercise-${lesson.id}-${id}-${direction}`,lessonId:lesson.id,type:'mc',payload:['mc',direction==='jp-nl'?word.japanese:word.meaning,correct,lesson.wordIds.map(other=>m.vocabulary.find(w=>w.id===other)).map(w=>direction==='jp-nl'?w.meaning:w.japanese)],requiredVocabIds:lesson.wordIds.slice(),requiredGrammarIds:[]});
      }
      lesson.checks.forEach(([prompt,correct,others],index)=>m.exercises.push({id:`exercise-${lesson.id}-situation-${index+1}`,lessonId:lesson.id,type:'mc',payload:['mc',prompt,correct,[correct,...others]],requiredVocabIds:lesson.wordIds.slice(),requiredGrammarIds:[]}));
    }
    m.lessons.push(...lessons);
    m.socialIntro={id:'social-intro',title:'Kennismaken',placementBeforeLevel:7,lessonIds:lessons.map(l=>l.id),examId:'intro-exam',revision:1,compatibility:{numericLevels:'unchanged',oldLessonIds:'unchanged',oldRankIds:'unchanged',oldVocabIds:'unchanged'}};
    for(const word of m.vocabulary.filter(w=>w.routeId==='social-intro'))word.references=[word.source,socialExpressions];
    m.contentVersion='1.9.0';
  }
  const api={apply};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.LanguageJourneySocialIntro=api;
})(typeof globalThis!=='undefined'?globalThis:this);
