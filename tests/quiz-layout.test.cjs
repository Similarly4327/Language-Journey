const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const html=fs.readFileSync(require('node:path').join(__dirname,'../index.html'),'utf8');
const source=html.slice(html.indexOf('function quizTextIsJapanese('),html.indexOf('function applyQuizQuestionDisplay('));
const context={};vm.runInNewContext(source,context);
test('Dutch questions and mixed instructions never use Japanese display typography',()=>{
  for(const text of ['Welk Japans woord betekent “waar” in deze situatie?','Gebruik het patroon “どこ です か”.','Welke Japanse zin past bij deze lange Nederlandse omschrijving?'])assert.equal(context.quizTextIsJapanese(text),false);
  for(const text of ['どこ','あそこ です','すみません。としょかん は どこ です か。'])assert.equal(context.quizTextIsJapanese(text),true);
});
test('generated vocabulary wrapper is compact without changing question data',()=>{
  const lesson={goal:'Wijs een plaats dichtbij of verder weg aan.',pattern:'どこ です か'},q={category:'vocab',sourceId:'context-l9-1-word-vocab-どこ',prompt:'Welk Japans woord betekent “waar” in deze situatie?',context:`${lesson.goal} Gebruik het nieuwe woord in het patroon “${lesson.pattern}”.`,correct:'どこ',choices:['どこ','そこ','あそこ'],targetGoalIds:['vocab:どこ']},before=JSON.stringify(q);
  const display=context.quizQuestionDisplay(q,'Kies het nieuwe woord dat de situatie precies aanvult.',q.prompt,lesson);
  assert.equal(display.context,'Patroon: “どこ です か”.');assert.equal(display.instruction,'');assert.equal(display.contextJapanese,false);assert.equal(JSON.stringify(q),before);
});
test('authored disambiguating contexts, builder tasks and instruction constraints stay visible',()=>{
  const display=context.quizQuestionDisplay({context:'De tas ligt naast de stoel.'},'Kies de plaats naast de stoel, niet eronder.','Welk woord past hier?');
  assert.equal(display.context,'De tas ligt naast de stoel.');assert.equal(display.instruction,'Kies de plaats naast de stoel, niet eronder.');
  assert.equal(context.quizQuestionDisplay({kind:'build'},'Bouw de Japanse zin met precies deze tegels.','Dit is mijn boek.').instruction,'Bouw de Japanse zin met precies deze tegels.');
});
test('identical visible question fields are shown once',()=>{
  const display=context.quizQuestionDisplay({context:'Kies de juiste zin.'},'Kies de juiste zin.','Kies de juiste zin.');assert.equal(display.context,'');assert.equal(display.instruction,'');
});
test('shared renderer applies display roles after all question routes, with compact reveal layout',()=>{
  assert.match(html,/else renderLessonQ\(c,q,box\);applyQuizQuestionDisplay\(q\);hideQuizOptions/);
  assert.match(html,/#qChoices\.quiz-options-hidden button:not\(\.quiz-options-reveal\)\{display:none\}/);
  assert.match(html,/body\[data-view="quiz"\] \.app-header\{position:relative;top:auto\}/);
  assert.match(html,/\.word-crash-course \.flashcard-answer-options\.is-hidden \.flashcard-answer-choice\{display:none\}/);
  assert.match(html,/flashcard-face-main\$\{quizTextIsJapanese\(front\)/);
});
