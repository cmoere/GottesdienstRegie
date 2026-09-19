const chordPattern=/\[[A-H](?:#|b)?(?:m|maj|min|sus|dim|aug|add)?\d*(?:\/[A-H](?:#|b)?)?\]/g;
export function maskChordTokens(text:string){const tokens:string[]=[];return{text:text.replace(chordPattern,value=>{const index=tokens.push(value)-1;return `__GR_CHORD_${index}__`}),tokens}}
export function restoreChordTokens(text:string,tokens:readonly string[]){return text.replace(/__GR_CHORD_(\d+)__/g,(_,index)=>tokens[Number(index)]??'')}

let translator: Promise<(text:string)=>Promise<string>>|undefined;
export async function localTranslate(text:string,source:'en'|'de'='en',target:'en'|'de'='de',onProgress?:(message:string)=>void):Promise<string>{
  if(source===target)return text;
  const model=source==='en'?'Xenova/opus-mt-en-de':'Xenova/opus-mt-de-en';
  onProgress?.('Lokales Sprachmodell wird vorbereitet …');
  translator??=import('@huggingface/transformers').then(async({pipeline})=>{const task=await pipeline('translation',model,{progress_callback:(event:unknown)=>onProgress?.(typeof event==='object'&&event&&'status' in event?String((event as {status:unknown}).status):'Modell wird geladen …')});return async(value:string)=>{const result=await task(value) as Array<{translation_text?:string}>;return result[0]?.translation_text??value}});
  const run=await translator,{text:masked,tokens}=maskChordTokens(text),lines=masked.split('\n'),translated:string[]=[];
  for(const line of lines){translated.push(line.trim()?await run(line):'')}
  return restoreChordTokens(translated.join('\n'),tokens);
}
