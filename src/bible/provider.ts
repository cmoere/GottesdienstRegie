export type BiblePassageRequest={translation:string;book:string;bookLabel:string;chapter:number;fromVerse:number;toVerse:number};
export type BiblePassage={reference:string;translation:string;verses:{number:number;text:string}[]};

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
export const BIBLE_BOOKS=bookRows.map(([id,name])=>({id,name}));

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

export async function loadBiblePassage(request:BiblePassageRequest,fetcher:typeof fetch=fetch){
  const key=`gottesdienstregie.bible.${request.translation}.${request.book}.${request.chapter}.${request.fromVerse}-${request.toVerse}`;
  try{const cached=localStorage.getItem(key);if(cached)return JSON.parse(cached) as BiblePassage}catch{}
  const passage=await fetchBiblePassage(request,fetcher);
  try{localStorage.setItem(key,JSON.stringify(passage))}catch{}
  return passage;
}
