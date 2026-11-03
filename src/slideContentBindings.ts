import type {Slide,SlideElement} from './store';
type Role='title'|'body';
export function cloneUnboundElement(element:SlideElement){const clone=structuredClone(element);delete clone.properties.contentRole;return clone}
function bindings(slide:Slide,ai:boolean){
 const roles=new Map<string,Role>();for(const element of slide.elements)if(element.type==='text'&&(element.properties.contentRole==='title'||element.properties.contentRole==='body'))roles.set(element.id,element.properties.contentRole);
 if(roles.size||!ai)return roles;
 // v97 drafts predate explicit roles. These are stored document layer names,
 // preserved across interface languages, not labels to translate at runtime.
 const texts=slide.elements.filter(element=>element.type==='text'),title=texts.find(element=>element.name==='Titel')??texts.find(element=>element.properties.text===slide.title),body=texts.find(element=>element!==title&&element.name==='Text')??texts.find(element=>element!==title&&element.properties.text===slide.body);
 if(title)roles.set(title.id,'title');if(body)roles.set(body.id,'body');return roles;
}
export function updateSlideTextBindings(slide:Slide,patch:Partial<Slide>,ai=false){
 const elements=patch.body!==undefined?slide.elements:patch.elements??slide.elements;
 if(patch.body===undefined&&patch.title===undefined)return elements;
 const roles=bindings({...slide,elements},ai);
 if(!roles.size&&patch.body===undefined)return elements;
 return elements.map((element,index)=>{const role=roles.get(element.id),value=role==='title'?patch.title:role==='body'?patch.body:!ai&&!roles.size&&index===0&&element.type==='text'?patch.body:undefined;return value===undefined||element.properties.text===value?element:{...element,properties:{...element.properties,text:value}}});
}
export function boundElementTextFields(slide:Slide,element:SlideElement|undefined,patch:Partial<SlideElement>,ai=false):Partial<Pick<Slide,'title'|'body'>>{
 if(!element||typeof patch.properties?.text!=='string')return{};const role=bindings(slide,ai).get(element.id),value=patch.properties.text;if(!role||slide[role]===value)return{};return role==='title'?{title:value}:{body:value};
}
