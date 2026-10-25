import {SaxesParser} from 'saxes';
import {advertisingUrl} from '../../shared/advertising';
export type VastCreative={title:string;url:string;kind:'image'|'video';durationSeconds:number};
export function parseVast(xml:string):{creatives:VastCreative[];wrappers:string[]}{
 if(Buffer.byteLength(xml)>1024*1024||/<!\s*(DOCTYPE|ENTITY)/i.test(xml))throw Error('Ungültige VAST-Datei.');
 const parser=new SaxesParser({xmlns:true}),stack:string[]=[],creatives:VastCreative[]=[],wrappers:string[]=[];let text='',title='Werbung',duration=15,media:VastCreative|null=null,selected:VastCreative|null=null,adDepth=0;
 parser.on('doctype',()=>{throw Error('Ungültige VAST-Datei.')});
 parser.on('opentag',tag=>{stack.push(tag.local);text='';if(stack.length>64)throw Error('VAST-Datei ist zu tief verschachtelt.');if(tag.local==='Ad'){adDepth=stack.length;title='Werbung';duration=15;media=null;selected=null}if(tag.local==='MediaFile'||tag.local==='StaticResource'){const type=Object.values(tag.attributes).find(attr=>attr.local==='type'||attr.local==='creativeType')?.value??'';if(['video/mp4','video/webm','image/png','image/jpeg','image/webp'].includes(type))media={title,url:'',kind:type.startsWith('video/')?'video':'image',durationSeconds:duration}}});
 parser.on('text',value=>{text+=value});parser.on('cdata',value=>{text+=value});
 parser.on('closetag',tag=>{const value=text.trim();if(tag.local==='AdTitle'&&value)title=value.slice(0,300);if(tag.local==='Duration'){const parts=value.match(/^(\d{2}):(\d{2}):(\d{2}(?:\.\d+)?)$/);if(parts)duration=Math.max(1,Math.min(600,Number(parts[1])*3600+Number(parts[2])*60+Number(parts[3])))}
  if(tag.local==='VASTAdTagURI'&&wrappers.length<3){try{wrappers.push(advertisingUrl(value))}catch{}}
  if((tag.local==='MediaFile'||tag.local==='StaticResource')&&media){try{media.url=advertisingUrl(value);media.title=title;media.durationSeconds=duration;if(!selected||(selected.kind==='image'&&media.kind==='video'))selected=media}catch{}media=null}
  if(tag.local==='Ad'&&stack.length===adDepth){if(selected&&creatives.length<20)creatives.push(selected);selected=null;adDepth=0;}stack.pop();text='';
 });parser.write(xml).close();return{creatives,wrappers};
}
