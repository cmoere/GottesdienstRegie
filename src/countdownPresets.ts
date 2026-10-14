export type CountdownDesignId='clear'|'nature'|'light'|'cross'|'candle'|'geometric';
export type CountdownPreset={id:string;durationSeconds:number;designId:CountdownDesignId};
export const countdownDesigns:readonly {id:CountdownDesignId;label:string}[]=[
  {id:'clear',label:'Klar'},{id:'nature',label:'Natur'},{id:'light',label:'Licht'},
  {id:'cross',label:'Kreuz'},{id:'candle',label:'Kerze'},{id:'geometric',label:'Geometrisch'},
];
export const countdownPresets:readonly CountdownPreset[]=Object.freeze(
  [1200,900,600,300,180,120,60,30,20,10].flatMap(durationSeconds=>countdownDesigns.map(({id:designId})=>Object.freeze({id:`countdown:${durationSeconds}:${designId}`,durationSeconds,designId}))),
);
export function getCountdownPreset(id:string):CountdownPreset|undefined{return countdownPresets.find(preset=>preset.id===id)}
export function createCountdownPresetMetadata(id:string):Record<string,string|number|boolean>|undefined{
  const preset=getCountdownPreset(id);if(!preset)return;
  return {countdownPresetId:preset.id,countdownDesign:preset.designId,countdownDurationSeconds:preset.durationSeconds,countdownSoundEnabled:false,timerDurationSeconds:preset.durationSeconds,timerMode:'countdown'};
}
