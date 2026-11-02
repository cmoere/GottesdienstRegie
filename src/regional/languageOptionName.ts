import {regionalVariants,type RegionalSelection} from '../../shared/regional/catalog';
/** Display only; language and regional IDs retain their existing persistence. */
export function languageOptionName(value:string,name:string,selection:RegionalSelection){
 const region=value==='de'&&selection.language==='de'?regionalVariants.find(item=>item.id===selection.germanRegion):undefined;
 return region?name+' · '+region.name:name;
}
