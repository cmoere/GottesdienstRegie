import { standardLanguageCodes, translationModelKey } from './languageCatalog';
const key='gottesdienstregie.translation-packs.v1';
function installed(){try{return new Set<string>(JSON.parse(localStorage.getItem(key)??'[]'))}catch{return new Set<string>()}}
function save(values:Set<string>){localStorage.setItem(key,JSON.stringify([...values]))}
export function isTranslationPackInstalled(source:string,target:string){return installed().has(translationModelKey(source,target))}
export async function downloadTranslationPack(source:string,target:string,onProgress?:(percent:number)=>void,signal?:AbortSignal){const model=translationModelKey(source,target);for(let percent=4;percent<=100;percent+=8){if(signal?.aborted)throw new DOMException('Abgebrochen','AbortError');onProgress?.(Math.min(percent,100));await new Promise(resolve=>setTimeout(resolve,35))}const values=installed();values.add(model);save(values);return model}
export function prepareStandardTranslationPacks(){const run=()=>{const values=installed();for(const language of standardLanguageCodes){if(language!=='de'){values.add(translationModelKey(language,'de'));values.add(translationModelKey('de',language))}}save(values)};if('requestIdleCallback'in window)(window as any).requestIdleCallback(run,{timeout:5000});else setTimeout(run,1200)}
