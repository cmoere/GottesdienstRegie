import {formatRegionalTemplate as sourceCopy} from '../shared/regional/validation';
const chordPattern=/\[[A-H](?:#|b)?(?:m|maj|min|sus|dim|aug|add)?\d*(?:\/[A-H](?:#|b)?)?\]/g;
export function maskChordTokens(text:string){const tokens:string[]=[];return{text:text.replace(chordPattern,value=>{const index=tokens.push(value)-1;return `__GR_CHORD_${index}__`}),tokens}}
export function restoreChordTokens(text:string,tokens:readonly string[]){return text.replace(/__GR_CHORD_(\d+)__/g,(_,index)=>tokens[Number(index)]??'')}

const translators=new Map<string,Promise<(text:string)=>Promise<string>>>();
export async function localTranslate(text:string,source='en',target='de',onProgress?:(message:string)=>void,copy=sourceCopy):Promise<string>{
  if(source===target)return text;
  const model=`Xenova/opus-mt-${source}-${target}`,key=`${source}-${target}`;
  onProgress?.(copy('Lokales Sprachmodell wird vorbereitet …'));
  if(!translators.has(key))translators.set(key,import('@huggingface/transformers').then(async({pipeline})=>{const task=await pipeline('translation',model,{progress_callback:(event:unknown)=>{const info=event as {status?:unknown;progress?:number};onProgress?.(copy('Modell wird geladen {value1}',{value1:Number.isFinite(info?.progress)?`${Math.round(Number(info.progress))}%`:''}).trim())}});return async(value:string)=>{const result=await task(value) as Array<{translation_text?:string}>;return result[0]?.translation_text??value}}));
  const run=await translators.get(key)!,{text:masked,tokens}=maskChordTokens(text),lines=masked.split('\n'),translated:string[]=[];
  for(let index=0;index<lines.length;index++){onProgress?.(copy('Übersetzung {value1}%',{value1:Math.round(index/Math.max(1,lines.length)*100)}));translated.push(lines[index].trim()?await run(lines[index]):'')}
  onProgress?.(copy('Übersetzung {value1}%',{value1:100}));
  return restoreChordTokens(translated.join('\n'),tokens);
}
