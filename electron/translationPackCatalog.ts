import type {TranslationPackDescriptor} from './TranslationPackService';
export interface TranslationPackCapability extends TranslationPackDescriptor{requiredFiles:string[]}
const languages=['en','fr','es','it','nl','pl','pt','uk','ru','tr','ar','da','sv','no'];
export const translationPackCatalog:TranslationPackCapability[]=languages.flatMap(code=>([
  {key:`${code}-de`,source:code,target:'de',model:`Xenova/opus-mt-${code}-de`,revision:'main',status:'not-downloaded' as const,requiredFiles:['config.json','tokenizer.json','onnx/model_quantized.onnx']},
  {key:`de-${code}`,source:'de',target:code,model:`Xenova/opus-mt-de-${code}`,revision:'main',status:'not-downloaded' as const,requiredFiles:['config.json','tokenizer.json','onnx/model_quantized.onnx']},
]));
export const packForPair=(source:string,target:string)=>translationPackCatalog.find(item=>item.source===source&&item.target===target);
