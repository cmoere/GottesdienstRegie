const bundled:Record<string,string>={
 de:new URL('./assets/de.svg',import.meta.url).href,en:new URL('./assets/en.svg',import.meta.url).href,fr:new URL('./assets/fr.svg',import.meta.url).href,es:new URL('./assets/es.svg',import.meta.url).href,it:new URL('./assets/it.svg',import.meta.url).href,nl:new URL('./assets/nl.svg',import.meta.url).href,pl:new URL('./assets/pl.svg',import.meta.url).href,pt:new URL('./assets/pt.svg',import.meta.url).href,uk:new URL('./assets/uk.svg',import.meta.url).href,ru:new URL('./assets/ru.svg',import.meta.url).href,tr:new URL('./assets/tr.svg',import.meta.url).href,ar:new URL('./assets/ar.svg',import.meta.url).href,da:new URL('./assets/da.svg',import.meta.url).href,sv:new URL('./assets/sv.svg',import.meta.url).href,no:new URL('./assets/no.svg',import.meta.url).href,
};
const neutral=new URL('./assets/globe.svg',import.meta.url).href;
export function flagAssetForLanguage(code:string){return bundled[code.toLowerCase()]??neutral}
