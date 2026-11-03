type Item={id:string;slides:unknown[]};
function items(value:unknown):value is Item[]{
 return Array.isArray(value)&&value.every(item=>item&&typeof item==='object'&&typeof item.id==='string'&&Array.isArray(item.slides))&&new Set(value.map(item=>item.id)).size===value.length;
}

// Older slide edits embedded both complete presentations. Keep their actual
// before/after changes, ids and all audit metadata; never reinterpret other
// history shapes or modify the source document in place.
export function compactSlideHistoryEntry<T extends {entityType?:unknown;before?:unknown;after?:unknown}>(entry:T):T{
 if(!entry||entry.entityType!=='slide'||!items(entry.before)||!items(entry.after))return entry;
 try{
  const before=new Map(entry.before.map(item=>[item.id,JSON.stringify(item)])),after=new Map(entry.after.map(item=>[item.id,JSON.stringify(item)]));
  const old=entry.before.filter(item=>before.get(item.id)!==after.get(item.id)),next=entry.after.filter(item=>before.get(item.id)!==after.get(item.id));
  if(old.length===entry.before.length&&next.length===entry.after.length)return entry;
  return {...entry,before:old,after:next};
 }catch{return entry}
}

export function compactPresentationHistory<T extends {editHistory?:unknown}>(document:T):T{
 if(!document||!Array.isArray(document.editHistory))return document;
 return {...document,editHistory:document.editHistory.map(entry=>entry&&typeof entry==='object'?compactSlideHistoryEntry(entry):entry)};
}
