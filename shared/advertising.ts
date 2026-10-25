export type AdSource={kind:'direct'|'vast';url:string};
export type AdCreative={id:string;title:string;url:string;kind:'image'|'video';durationSeconds:number};
export type AdCampaign={source:AdSource;fetchedAt:number;creatives:AdCreative[]};
export type AdSelection={source?:AdSource;creatives:AdCreative[];intervalMinutes:number;sectionId?:'pre'|'post'};
export function readAdSelection(value:unknown):AdSelection{
 if(!value||typeof value!=='object')throw Error('Ungültige Werbeauswahl.');const selection=value as AdSelection;
 const campaign=readAdCampaign({source:selection.source??{kind:'direct',url:'https://local-file.invalid/'},fetchedAt:0,creatives:selection.creatives});
 if(!Number.isFinite(selection.intervalMinutes)||selection.intervalMinutes<1||selection.intervalMinutes>120)throw Error('Bitte ein Intervall zwischen 1 und 120 Minuten wählen.');
 if(selection.sectionId!==undefined&&!['pre','post'].includes(selection.sectionId))throw Error('Werbung ist nur im Vor- und Nachprogramm zulässig.');
 return{...(selection.source?{source:campaign.source}:{}),creatives:campaign.creatives,intervalMinutes:selection.intervalMinutes,...(selection.sectionId?{sectionId:selection.sectionId}:{})};
}
export function advertisingUrl(value:unknown):string{
 if(typeof value!=='string'||value.length>4096)throw Error('Bitte eine gültige HTTPS-Medien- oder Kampagnenadresse angeben.');const url=new URL(value.trim());if(url.protocol!=='https:'||url.username||url.password||url.port||url.hostname==='localhost'||url.hostname.endsWith('.local'))throw Error('Nur öffentliche HTTPS-Adressen sind erlaubt.');url.hash='';return url.href;
}
export function readAdSource(value:unknown):AdSource{
 if(!value||typeof value!=='object'||Array.isArray(value))throw Error('Ungültige Werbequelle.');const source=value as AdSource;if(!['direct','vast'].includes(source.kind)||Object.keys(source).some(key=>!['kind','url'].includes(key)))throw Error('Ungültige Werbequelle.');return{kind:source.kind,url:advertisingUrl(source.url)};
}
export function readAdCampaign(value:unknown):AdCampaign{
 if(!value||typeof value!=='object')throw Error('Ungültige Werbekampagne.');const result=value as AdCampaign,source=readAdSource(result.source);if(!Number.isFinite(result.fetchedAt)||!Array.isArray(result.creatives)||!result.creatives.length||result.creatives.length>20)throw Error('Die Kampagne enthält keine unterstützten Medien.');
 for(const item of result.creatives){if(!item||typeof item.id!=='string'||item.id.length>200||typeof item.title!=='string'||item.title.length>300||!['image','video'].includes(item.kind)||!Number.isFinite(item.durationSeconds)||item.durationSeconds<1||item.durationSeconds>600||typeof item.url!=='string'||!/^gottesdienst-media:\/\/media\/[a-f0-9]{64}\.(png|jpg|jpeg|webp|mp4|webm)$/.test(item.url))throw Error('Ungültiges Werbemedium.')}
 return{source,fetchedAt:result.fetchedAt,creatives:structuredClone(result.creatives)};
}
