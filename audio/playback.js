(function(root){
  'use strict';
  const safePath=path=>typeof path==='string'&&/^assets\/audio\/ja\/[a-zA-Z0-9_./-]+\.mp3$/.test(path)&&!path.includes('..');
  function resolve(content,manifest,id,text){
    const ref=content.resolveAudioEntry(id,text);if(!ref)return null;
    const lineAsset=(entry,role)=>entry.pronunciation?.status==='specified'&&entry.pronunciation.audioTextKana?manifest.assets.find(asset=>asset.entryId===entry.id&&asset.displayText===entry.displayText&&asset.readingId===entry.pronunciation.readingId&&asset.audioTextKana===entry.pronunciation.audioTextKana&&asset.voiceRole===role&&asset.reviewed===true&&asset.pipelineVersion===manifest.pipelineVersion&&safePath(asset.path)):null;
    const lines=ref.kind==='dialogue'?ref.entry.lines.map(line=>({entry:content.audioEntryById[line.sentenceId],role:line.speakerRole})): [{entry:ref,role:'A'}];
    const assets=lines.map(line=>line.entry&&lineAsset(line.entry,line.role));
    return assets.length&&assets.every(Boolean)?{id:ref.id,entry:ref,assets}:null;
  }
  function createPlayback({createAudio=path=>new Audio(path),delay=(fn,ms)=>setTimeout(fn,ms),cancelDelay=id=>clearTimeout(id),pauseMs=220}={}){
    let active=null,token=0,timer=null,statusCallback=null,rate=1;
    function setRate(value){rate=Number(value)===.75?.75:1;if(active)active.audio.playbackRate=rate}
    function stop(){token++;if(timer!==null){cancelDelay(timer);timer=null}if(active){const old=active;active=null;old.audio.onended=old.audio.onerror=old.audio.onplaying=null;old.audio.pause()}if(statusCallback){statusCallback('idle');statusCallback=null}}
    function play(assets,{volume=1,playbackRate=1,onState=()=>{},onFinish=()=>{}}={}){
      stop();setRate(playbackRate);if(!assets?.length)return false;
      const session=token;let index=0,media=null;statusCallback=onState;
      function next(){
        if(session!==token)return;
        const path='./'+assets[index].path;let audio;
        // Keep the gesture-unlocked media element for subsequent dialogue lines.
        try{if(!media)media=createAudio(path);else media.src=path;audio=media}catch{onState('error');onFinish('error');return}audio.volume=Math.max(0,Math.min(1,volume));audio.preload='auto';
        audio.playbackRate=rate;audio.preservesPitch=true;
        active={audio,status:onState};onState('loading');
        let finished=false;
        const finish=error=>{
          if(finished||session!==token||active?.audio!==audio)return;finished=true;
          audio.onended=audio.onerror=audio.onplaying=null;audio.pause();active=null;
          if(error){onState('error');onFinish('error');return}
          index++;if(index<assets.length){onState('loading');timer=delay(()=>{timer=null;next()},pauseMs)}else{onState('ended');onFinish('ended')}
        };
        audio.onplaying=()=>{if(session===token)onState('playing')};audio.onended=()=>finish(false);audio.onerror=()=>finish(true);
        try{Promise.resolve(audio.play()).catch(()=>finish(true))}catch{finish(true)}
      }
      next();return true;
    }
    return{play,stop,setRate};
  }
  const escape=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  function buttonHtml(resolved,text,label){return resolved?`<button class="audio-speaker" type="button" data-audio-key="${escape(resolved.id)}" data-audio-text="${escape(text)}" data-audio-state="idle" aria-pressed="false" aria-label="${escape(label)}" title="${escape(label)}"><span aria-hidden="true">🔊</span></button>`:''}
  function updateButton(button,status){if(!button)return;button.dataset.audioState=status;button.setAttribute('aria-busy',String(status==='loading'));button.setAttribute('aria-pressed',String(status==='playing'));button.title=status==='error'?'Audio kon niet worden afgespeeld. Tik om opnieuw te proberen.':button.getAttribute('aria-label');const icon=button.querySelector('span');if(icon)icon.textContent=status==='loading'?'…':status==='error'?'!':'🔊'}
  const api={resolve,createPlayback,buttonHtml,updateButton,safePath};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.LanguageJourneyAudio=api;
})(typeof globalThis!=='undefined'?globalThis:this);
