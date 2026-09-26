export type BiblePassageRequest={translation:string;book:string;bookLabel:string;chapter:number;fromVerse:number;toVerse:number};
export type BiblePassage={reference:string;translation:string;verses:{number:number;text:string}[]};
export type BibleTranslation={id:string;name:string;language:string};
export type BibleTestament='old'|'new';
export const BIBLE_WORKER_URL='https://bibelstelle.crbnm06.workers.dev';

export const BIBLE_TRANSLATIONS=[
  {id:'luther1545',name:'Luther 1545',language:'Deutsch'},
  {id:'elberfelder',name:'Elberfelder 1871',language:'Deutsch'},
  {id:'elberfelder1905',name:'Elberfelder 1905',language:'Deutsch'},
  {id:'schlachter',name:'Schlachter 1951',language:'Deutsch'},
  {id:'kjv',name:'King James Version',language:'English'},
  {id:'asv',name:'American Standard Version',language:'English'},
] as const;

const bookRows=[
  ['Genesis','1. Mose'],['Exodus','2. Mose'],['Leviticus','3. Mose'],['Numbers','4. Mose'],['Deuteronomy','5. Mose'],['Joshua','Josua'],['Judges','Richter'],['Ruth','Rut'],['1 Samuel','1. Samuel'],['2 Samuel','2. Samuel'],['1 Kings','1. Könige'],['2 Kings','2. Könige'],['1 Chronicles','1. Chronik'],['2 Chronicles','2. Chronik'],['Ezra','Esra'],['Nehemiah','Nehemia'],['Esther','Ester'],['Job','Hiob'],['Psalms','Psalmen'],['Proverbs','Sprüche'],['Ecclesiastes','Prediger'],['Song of Solomon','Hohelied'],['Isaiah','Jesaja'],['Jeremiah','Jeremia'],['Lamentations','Klagelieder'],['Ezekiel','Hesekiel'],['Daniel','Daniel'],['Hosea','Hosea'],['Joel','Joel'],['Amos','Amos'],['Obadiah','Obadja'],['Jonah','Jona'],['Micah','Micha'],['Nahum','Nahum'],['Habakkuk','Habakuk'],['Zephaniah','Zefanja'],['Haggai','Haggai'],['Zechariah','Sacharja'],['Malachi','Maleachi'],['Matthew','Matthäus'],['Mark','Markus'],['Luke','Lukas'],['John','Johannes'],['Acts','Apostelgeschichte'],['Romans','Römer'],['1 Corinthians','1. Korinther'],['2 Corinthians','2. Korinther'],['Galatians','Galater'],['Ephesians','Epheser'],['Philippians','Philipper'],['Colossians','Kolosser'],['1 Thessalonians','1. Thessalonicher'],['2 Thessalonians','2. Thessalonicher'],['1 Timothy','1. Timotheus'],['2 Timothy','2. Timotheus'],['Titus','Titus'],['Philemon','Philemon'],['Hebrews','Hebräer'],['James','Jakobus'],['1 Peter','1. Petrus'],['2 Peter','2. Petrus'],['1 John','1. Johannes'],['2 John','2. Johannes'],['3 John','3. Johannes'],['Jude','Judas'],['Revelation','Offenbarung'],
] as const;
export const BIBLE_BOOKS=bookRows.map(([id,name],index)=>({id,name,testament:(index<39?'old':'new') as BibleTestament}));
const chapterCounts=[50,40,27,36,34,24,21,4,31,24,22,25,29,36,10,13,10,42,150,31,12,8,66,52,5,48,12,14,3,9,1,4,7,3,3,3,2,14,4,28,16,24,21,28,16,16,13,6,6,4,4,5,3,6,4,3,1,13,5,5,3,5,1,1,1,22] as const;
const chapterCountByBook=new Map<string,number>(BIBLE_BOOKS.map((book,index)=>[book.id,chapterCounts[index]]));
export function chapterCountForBook(book:string){return chapterCountByBook.get(book)??1}

const bookAliases:Record<string,string[]>={
  Psalms:['ps','psalm'],John:['joh','johannes','jn'],Matthew:['mt','matth'],Mark:['mk'],Luke:['lk'],
  Revelation:['offb','offenbarung'],Romans:['röm','roemer'],Genesis:['gen','1 mose'],Exodus:['ex','2 mose'],
};

export function searchBibleBooks(query:string){
  const needle=query.trim().toLocaleLowerCase('de');
  if(!needle)return BIBLE_BOOKS;
  return BIBLE_BOOKS.filter(book=>[book.name,book.id,...(bookAliases[book.id]??[])].some(value=>value.toLocaleLowerCase('de').includes(needle)));
}

export async function fetchBibleTranslations(fetcher:typeof fetch=fetch):Promise<BibleTranslation[]>{
  const response=await fetcher('https://api.getbible.net/v2/translations.json',{headers:{accept:'application/json'}});
  if(!response.ok)throw new Error(`BIBLE_TRANSLATIONS_${response.status}`);
  const payload=await response.json() as Record<string,{translation?:string;abbreviation?:string;language?:string;lang?:string}>;
  return Object.values(payload).map(entry=>({id:String(entry.abbreviation??'').trim(),name:String(entry.translation??entry.abbreviation??'').trim(),language:String(entry.language??entry.lang??'').trim()})).filter(entry=>entry.id&&entry.name).sort((a,b)=>{
    const aGerman=/german|deutsch/i.test(a.language)?0:1,bGerman=/german|deutsch/i.test(b.language)?0:1;
    return aGerman-bGerman||a.name.localeCompare(b.name,'de');
  });
}

export async function fetchBiblePassage(request:BiblePassageRequest,fetcher:typeof fetch=fetch):Promise<BiblePassage>{
  const range=request.fromVerse===request.toVerse?String(request.fromVerse):`${request.fromVerse}-${request.toVerse}`;
  const reference=`${request.book} ${request.chapter}:${range}`;
  const response=await fetcher(`https://query.getbible.net/v2/${encodeURIComponent(request.translation)}/${encodeURIComponent(reference)}`,{headers:{accept:'application/json'}});
  if(!response.ok)throw new Error(`BIBLE_PROVIDER_${response.status}`);
  const payload=await response.json() as Record<string,{translation?:string;verses?:{verse?:number;text?:string}[]}>;
  const chapter=Object.values(payload)[0],verses=(chapter?.verses??[]).map(verse=>({number:Number(verse.verse),text:String(verse.text??'').trim()})).filter(verse=>verse.number>0&&verse.text);
  if(!verses.length)throw new Error('BIBLE_PASSAGE_EMPTY');
  return{reference:`${request.bookLabel} ${request.chapter},${request.fromVerse}${request.toVerse>request.fromVerse?`–${request.toVerse}`:''}`,translation:chapter?.translation??request.translation,verses};
}

const workerFallbackTranslation:Record<string,string>={glm:'luther1545',glo:'luther1545',gel:'elberfelder',gsc:'schlachter',niv:'kjv',kjv:'kjv'};
const workerTranslations:BibleTranslation[]=[
  {id:'glm',name:'Lutherbibel 1984 – modern (GLM)',language:'Deutsch'},
  {id:'glo',name:'Lutherbibel – Original (GLO)',language:'Deutsch'},
  {id:'gel',name:'Elberfelder Bibel (GEL)',language:'Deutsch'},
  {id:'gsc',name:'Schlachter Bibel (GSC)',language:'Deutsch'},
  {id:'niv',name:'New International Version (NIV)',language:'English'},
  {id:'kjv',name:'King James Version (KJV)',language:'English'},
];

export async function fetchWorkerBibleTranslations(fetcher:typeof fetch=fetch):Promise<BibleTranslation[]>{
  const response=await fetcher(`${BIBLE_WORKER_URL}/versions?lang=de&all=1`,{headers:{accept:'application/json'}});
  if(!response.ok)throw new Error(`BIBLE_WORKER_VERSIONS_${response.status}`);
  const payload=await response.json() as {versions?:{code?:string;label?:string;language?:string}[]};
  const entries=(payload.versions??[]).map(entry=>({id:String(entry.code??''),name:String(entry.label??entry.code??''),language:entry.language==='en'?'English':'Deutsch'})).filter(entry=>entry.id&&entry.name);
  return entries.length?entries:workerTranslations;
}

export async function fetchWorkerBiblePassage(request:BiblePassageRequest,fetcher:typeof fetch=fetch):Promise<BiblePassage>{
  const range=request.fromVerse===request.toVerse?String(request.fromVerse):`${request.fromVerse}-${request.toVerse}`;
  const lang=/^(niv|kjv)$/.test(request.translation)?'en':'de';
  const separator=lang==='en'?':':',';
  const reference=`${request.bookLabel} ${request.chapter}${separator}${range}`;
  const url=new URL(`${BIBLE_WORKER_URL}/text`);
  url.searchParams.set('ref',reference);url.searchParams.set('lang',lang);url.searchParams.set('v',request.translation);
  const response=await fetcher(url.toString(),{headers:{accept:'text/plain'}});
  if(!response.ok)throw new Error(`BIBLE_WORKER_${response.status}`);
  const raw=await response.text();
  const verses=raw.split(/\r?\n/).map(line=>line.trim()).filter(Boolean).map((line,index)=>{
    const match=line.match(/^(?:(\d+):)?(\d+)\s+(.+)$/);
    return match?{number:Number(match[2]),text:match[3].trim()}:{number:request.fromVerse+index,text:line};
  }).filter(verse=>verse.number>0&&verse.text);
  if(!verses.length)throw new Error('BIBLE_PASSAGE_EMPTY');
  const label=decodeURIComponent(response.headers.get('x-bibel-version-label')??request.translation);
  return{reference:`${request.bookLabel} ${request.chapter},${request.fromVerse}${request.toVerse>request.fromVerse?`–${request.toVerse}`:''}`,translation:label,verses};
}

export async function loadBiblePassage(request:BiblePassageRequest,fetcher:typeof fetch=fetch){
  const key=`gottesdienstregie.bible.${request.translation}.${request.book}.${request.chapter}.${request.fromVerse}-${request.toVerse}`;
  try{const cached=localStorage.getItem(key);if(cached)return JSON.parse(cached) as BiblePassage}catch{}
  let passage:BiblePassage;
  try{passage=await fetchWorkerBiblePassage(request,fetcher)}catch{
    passage=await fetchBiblePassage({...request,translation:workerFallbackTranslation[request.translation]??request.translation},fetcher);
  }
  try{localStorage.setItem(key,JSON.stringify(passage))}catch{}
  return passage;
}

export async function loadBibleTranslations(fetcher:typeof fetch=fetch){
  const [worker,publicSource]=await Promise.all([
    fetchWorkerBibleTranslations(fetcher).catch(()=>workerTranslations),
    fetchBibleTranslations(fetcher).catch(()=>[] as BibleTranslation[]),
  ]);
  const unique=new Map<string,BibleTranslation>();
  for(const entry of [...worker,...publicSource])if(!unique.has(entry.id))unique.set(entry.id,entry);
  return [...unique.values()].sort((a,b)=>{
    const aGerman=/german|deutsch/i.test(a.language)?0:1,bGerman=/german|deutsch/i.test(b.language)?0:1;
    return aGerman-bGerman||a.name.localeCompare(b.name,'de');
  });
}
