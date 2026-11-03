export type OutputDelivery={revision:number;sentAtMs:number};
export type OutputPaintReceipt={revision:number;receivedAtMs:number;paintedAtMs:number};
export type OutputTimingSummary={role:string;status:'pending'|'confirmed';samples:number;lastMs:number|null;renderMs:number|null;p95Ms:number|null;previewDeltaMs?:number};
export function readOutputTimingSummaries(value:unknown):OutputTimingSummary[]{
 if(!Array.isArray(value)||value.length>5)return [];
 const result:OutputTimingSummary[]=[],roles=new Set<string>();
 const metric=(field:unknown):field is number|null=>field===null||(typeof field==='number'&&Number.isFinite(field)&&field>=0&&field<=121000);
 for(const entry of value){
  if(!entry||typeof entry!=='object'||Array.isArray(entry))return [];
  const row=entry as Record<string,unknown>;
  if(typeof row.role!=='string'||!['main','stage','notes','livestream','lobby'].includes(row.role)||roles.has(row.role)||(row.status!=='pending'&&row.status!=='confirmed')||typeof row.samples!=='number'||!Number.isInteger(row.samples)||row.samples<0||row.samples>30||!metric(row.lastMs)||!metric(row.renderMs)||!metric(row.p95Ms))return [];
  if(row.status==='confirmed'&&(row.samples===0||row.lastMs===null||row.renderMs===null||row.p95Ms===null))return [];
  if(row.previewDeltaMs!==undefined&&(typeof row.previewDeltaMs!=='number'||!Number.isFinite(row.previewDeltaMs)||Math.abs(row.previewDeltaMs)>121000))return [];
  roles.add(row.role);result.push({role:row.role,status:row.status,samples:row.samples,lastMs:row.lastMs,renderMs:row.renderMs,p95Ms:row.p95Ms,...(typeof row.previewDeltaMs==='number'?{previewDeltaMs:row.previewDeltaMs}:{})});
 }
 return result;
}
export function readOutputPaintReceipt(value:unknown):OutputPaintReceipt|null{
 if(!value||typeof value!=='object'||Array.isArray(value))return null;
 const data=value as Record<string,unknown>;
 if(Object.keys(data).length!==3||Object.keys(data).some(key=>!['revision','receivedAtMs','paintedAtMs'].includes(key)))return null;
 const {revision,receivedAtMs,paintedAtMs}=data;
 if(typeof revision!=='number'||!Number.isSafeInteger(revision)||revision<1||typeof receivedAtMs!=='number'||typeof paintedAtMs!=='number'||!Number.isFinite(receivedAtMs)||!Number.isFinite(paintedAtMs)||receivedAtMs<0||paintedAtMs<receivedAtMs)return null;
 return{revision,receivedAtMs,paintedAtMs};
}
