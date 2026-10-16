/** The same version/section identities as the authoring exporter; titles are never identifiers. */
export function indexReleaseTextObjects(root:unknown){
  const paths=new WeakMap<object,string>();const texts:Record<string,string>={};
  function visit(value:unknown,prefix:string){
    if(!value||typeof value!=='object')return;
    if('de' in value&&typeof value.de==='string'){paths.set(value,prefix);texts[prefix]=value.de;return}
    if(Array.isArray(value)){
      value.forEach((item,index)=>{
        const identity=item&&typeof item==='object'?item.version??item.line??item.id:null;
        visit(item,identity?`${prefix}[${identity}]`:`${prefix}.${index}`);
      });return;
    }
    for(const [key,item] of Object.entries(value))visit(item,prefix?`${prefix}.${key}`:key);
  }
  visit(root,'');return {paths,texts};
}

export function localizeReleaseText(value:Record<string,string|undefined>,language:string,stablePath:string|undefined,regional?:Record<string,string>){
  if(language==='de'&&stablePath&&regional&&Object.hasOwn(regional,stablePath))return regional[stablePath];
  return value[language]??value.en??value.de??'';
}
