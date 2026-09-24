import {blankPresentationDocument,type PresentationDocument} from '../../store';
import type {PresentationService} from '../PlatformServices';
import {RevisionConflictError,type PresentationSummary} from '../types';

interface StoredRecord{document:PresentationDocument;revision:number}
const PREFIX='gottesdienstregie.web.presentation.';
const summary=(document:PresentationDocument):PresentationSummary=>({
  id:document.presentationId,title:document.title,date:document.date,createdAt:document.createdAt,updatedAt:document.updatedAt,
  archived:Boolean(document.archived),trashed:Boolean(document.trashed),itemCount:document.items.length,
  slideCount:document.items.reduce((total,item)=>total+item.slides.length,0)
});
export function createLocalPresentationService(storage:Storage):PresentationService{
  const read=(id:string):StoredRecord|null=>{const raw=storage.getItem(`${PREFIX}${id}`);return raw?JSON.parse(raw) as StoredRecord:null};
  const write=(record:StoredRecord)=>storage.setItem(`${PREFIX}${record.document.presentationId}`,JSON.stringify(record));
  return {
    list:async options=>Object.keys(storage).filter(key=>key.startsWith(PREFIX)).map(key=>JSON.parse(storage.getItem(key)!) as StoredRecord)
      .map(record=>summary(record.document)).filter(item=>(options?.archived===true||!item.archived)&&(options?.trashed===true||!item.trashed))
      .sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt)),
    load:async id=>{const record=read(id);return record?{document:structuredClone(record.document),revision:String(record.revision)}:null},
    create:async input=>{
      const document=input.template?structuredClone(input.template):blankPresentationDocument(input.title,input.date);
      if(input.title)document.title=input.title;
      if(input.date)document.date=input.date;
      const record={document,revision:1};write(record);return {document:structuredClone(document),revision:'1'};
    },
    save:async(document,baseRevision)=>{
      const current=read(document.presentationId);
      if(current&&baseRevision!==undefined&&String(current.revision)!==baseRevision)throw new RevisionConflictError(document,structuredClone(current.document));
      const next={document:structuredClone(document),revision:(current?.revision??0)+1};write(next);
      return {summary:summary(next.document),revision:String(next.revision)};
    }
  };
}
