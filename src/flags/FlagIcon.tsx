import{useState}from'react';import{flagAssetForLanguage}from'./flagCatalog';
const fallback=new URL('./assets/globe.svg',import.meta.url).href;
export function FlagIcon({languageCode,decorative=false}:{languageCode:string;decorative?:boolean}){const[src,setSrc]=useState(()=>flagAssetForLanguage(languageCode));return <img className="translation-language-flag" src={src} onError={()=>setSrc(fallback)} alt={decorative?'':`Sprachsymbol ${languageCode.toUpperCase()}`} aria-hidden={decorative||undefined}/>}
