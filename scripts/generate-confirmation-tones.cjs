// Generate three quiet, click-free confirmation sounds for correct answers.
// Run with: node scripts/generate-confirmation-tones.cjs
const fs=require('node:fs');
const path=require('node:path');

const sampleRate=44100;
const peak=10**(-30/20);
const outputDir=path.resolve(__dirname,'../assets/audio');

const tones=[
  {
    name:'correct-soft.wav',
    duration:0.16,
    notes:[{frequency:523.25,start:0,length:0.15,attack:0.012,release:0.095,weight:1,secondHarmonic:0.04}]
  },
  {
    name:'correct-rise.wav',
    duration:0.22,
    notes:[
      {frequency:587.33,start:0,length:0.135,attack:0.012,release:0.075,weight:0.76,secondHarmonic:0.03},
      {frequency:659.25,start:0.07,length:0.14,attack:0.014,release:0.085,weight:0.7,secondHarmonic:0.03}
    ]
  },
  {
    name:'correct-chime.wav',
    duration:0.20,
    notes:[{frequency:659.25,start:0,length:0.19,attack:0.018,release:0.14,weight:1,secondHarmonic:0.12}]
  }
];

function noteValue(note,time){
  const local=time-note.start;
  if(local<0||local>=note.length)return 0;
  const attack=Math.min(1,local/note.attack);
  const release=Math.min(1,(note.length-local)/note.release);
  const envelope=Math.sin(attack*Math.PI/2)**2*Math.sin(release*Math.PI/2)**2;
  const fade=Math.exp(-local/note.length*0.45);
  const phase=2*Math.PI*note.frequency*local;
  return note.weight*envelope*fade*(Math.sin(phase)+note.secondHarmonic*Math.sin(2*phase));
}

function waveBuffer(tone){
  const samples=Math.ceil(tone.duration*sampleRate);
  const raw=new Float64Array(samples);
  let rawPeak=0;
  for(let i=0;i<samples;i++){
    const time=i/sampleRate;
    raw[i]=tone.notes.reduce((sum,note)=>sum+noteValue(note,time),0);
    rawPeak=Math.max(rawPeak,Math.abs(raw[i]));
  }
  const scale=peak/rawPeak;
  const buffer=Buffer.alloc(44+samples*2);
  buffer.write('RIFF',0);
  buffer.writeUInt32LE(buffer.length-8,4);
  buffer.write('WAVEfmt ',8);
  buffer.writeUInt32LE(16,16);
  buffer.writeUInt16LE(1,20);
  buffer.writeUInt16LE(1,22);
  buffer.writeUInt32LE(sampleRate,24);
  buffer.writeUInt32LE(sampleRate*2,28);
  buffer.writeUInt16LE(2,32);
  buffer.writeUInt16LE(16,34);
  buffer.write('data',36);
  buffer.writeUInt32LE(samples*2,40);
  for(let i=0;i<samples;i++)buffer.writeInt16LE(Math.round(Math.max(-1,Math.min(1,raw[i]*scale))*32767),44+i*2);
  return buffer;
}

fs.mkdirSync(outputDir,{recursive:true});
for(const tone of tones){
  const target=path.join(outputDir,tone.name);
  fs.writeFileSync(target,waveBuffer(tone));
  console.log(`${tone.name}: ${Math.round(tone.duration*1000)} ms, peak -30 dBFS`);
}
