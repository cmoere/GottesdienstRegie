import {getCountdownPreset} from '../src/countdownPresets';
export type CountdownMediaContext={purpose?:string;targetType?:'section'|'serviceItem';targetId?:string;mediaKind?:string};
export function countdownMediaSelection(presetId:unknown,senderId:number,mediaSenderId:number|undefined,context:CountdownMediaContext){
  if(senderId!==mediaSenderId||context.purpose==='audio'||typeof presetId!=='string'||!getCountdownPreset(presetId))return null;
  return {kind:'countdown-preset' as const,presetId,purpose:'item' as const,...(context.targetType?{targetType:context.targetType}:{}),...(context.targetId?{targetId:context.targetId}:{})};
}
