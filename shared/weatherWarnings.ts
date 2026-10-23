export type PublicWeatherWarning={id:string;event:string;headline:string;description:string;instruction?:string;validFrom:string;validUntil:string;severity:'Minor'|'Moderate'|'Severe'|'Extreme';areaName:string;source:'DWD'};
export type WeatherWarningReply={status:'ready'|'stale'|'unavailable';fetchedAt:number;warnings:PublicWeatherWarning[]};
export type WeatherWarningState={revision:number;cycleStartedAtMs:number;fetchedAt:number;items:PublicWeatherWarning[]};
export function warningDurationMs(warning:PublicWeatherWarning){return Math.max(20000,(warning.headline.length+warning.description.length+(warning.instruction?.length??0))*70)}
const record=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v);
const date=(v:unknown)=>typeof v==='string'&&/(Z|[+-]\d\d:\d\d)$/.test(v)&&Number.isFinite(Date.parse(v));
export function validWeatherWarning(value:unknown):value is PublicWeatherWarning{
 if(!record(value)||Object.keys(value).some(k=>!['id','event','headline','description','instruction','validFrom','validUntil','severity','areaName','source'].includes(k)))return false;
 for(const [key,max]of Object.entries({id:500,event:300,headline:2000,description:20000,areaName:500}))if(typeof value[key]!=='string'||!(value[key] as string).trim()||(value[key] as string).length>max)return false;
 return(value.instruction===undefined||(typeof value.instruction==='string'&&value.instruction.length<=20000))&&date(value.validFrom)&&date(value.validUntil)&&Date.parse(String(value.validUntil))>Date.parse(String(value.validFrom))&&['Minor','Moderate','Severe','Extreme'].includes(String(value.severity))&&value.source==='DWD';
}
export function readWeatherWarningState(value:unknown):WeatherWarningState|null{
 if(!record(value)||Object.keys(value).length!==4||!Number.isSafeInteger(value.revision)||Number(value.revision)<0||typeof value.cycleStartedAtMs!=='number'||!Number.isFinite(value.cycleStartedAtMs)||typeof value.fetchedAt!=='number'||!Number.isFinite(value.fetchedAt)||value.fetchedAt<0||!Array.isArray(value.items)||value.items.length>30||!value.items.every(validWeatherWarning))return null;
 return structuredClone(value) as WeatherWarningState;
}
export function readWeatherWarningReply(value:unknown):WeatherWarningReply|null{
 if(!record(value)||Object.keys(value).length!==3||!['ready','stale','unavailable'].includes(String(value.status))||typeof value.fetchedAt!=='number'||!Number.isFinite(value.fetchedAt)||value.fetchedAt<0||!Array.isArray(value.warnings)||value.warnings.length>30||!value.warnings.every(validWeatherWarning)||(value.status==='unavailable'&&value.warnings.length))return null;
 return structuredClone(value) as WeatherWarningReply;
}
export function warningEligible(context:{onAir:boolean;liveSection:string;countdownActive:boolean;quickType:string|null}){return context.onAir&&(context.quickType?context.quickType==='countdown':context.countdownActive||context.liveSection==='pre'||context.liveSection==='post')}
export function validWarningGeometry(geometry:unknown):boolean{
 if(!record(geometry)||!Array.isArray(geometry.coordinates))return false;
 const polygons=geometry.type==='Polygon'?[geometry.coordinates]:geometry.type==='MultiPolygon'?geometry.coordinates:null;let count=0;
 return !!polygons&&polygons.length>0&&polygons.length<=1000&&polygons.every(polygon=>Array.isArray(polygon)&&polygon.length>0&&polygon.length<=1000&&polygon.every(ring=>Array.isArray(ring)&&ring.length>=4&&(count+=ring.length)<=50000&&ring.every(p=>Array.isArray(p)&&p.length>=2&&p.length<=3&&Number.isFinite(p[0])&&Number.isFinite(p[1])&&Math.abs(p[0])<=180&&Math.abs(p[1])<=90)&&ring[0][0]===ring.at(-1)[0]&&ring[0][1]===ring.at(-1)[1]));
}
export function pointInWarningGeometry(geometry:unknown,longitude:number,latitude:number):boolean{
 if(!validWarningGeometry(geometry)||!record(geometry)||!Array.isArray(geometry.coordinates))return false;
 const polygons=geometry.type==='Polygon'?[geometry.coordinates]:geometry.type==='MultiPolygon'?geometry.coordinates:null;
 if(!polygons||polygons.length>1000)return false;let points=0;
 const inRing=(ring:unknown):boolean=>{
  if(!Array.isArray(ring)||ring.length<4||(points+=ring.length)>50000)return false;
  if(!ring.every(p=>Array.isArray(p)&&p.length>=2&&p.length<=3&&Number.isFinite(p[0])&&Number.isFinite(p[1])&&Math.abs(p[0])<=180&&Math.abs(p[1])<=90))return false;
  if(ring[0][0]!==ring.at(-1)[0]||ring[0][1]!==ring.at(-1)[1])return false;
  let inside=false;
  for(let i=0,j=ring.length-1;i<ring.length;j=i++){
   const[a,b]=ring[i],[c,d]=ring[j],cross=(longitude-a)*(d-b)-(latitude-b)*(c-a);
   if(Math.abs(cross)<1e-10&&longitude>=Math.min(a,c)&&longitude<=Math.max(a,c)&&latitude>=Math.min(b,d)&&latitude<=Math.max(b,d))return true;
   if((b>latitude)!==(d>latitude)&&longitude<(c-a)*(latitude-b)/(d-b)+a)inside=!inside;
  }return inside;
 };
 return polygons.some(polygon=>Array.isArray(polygon)&&polygon.length>0&&polygon.length<=1000&&inRing(polygon[0])&&!polygon.slice(1).some(inRing));
}
