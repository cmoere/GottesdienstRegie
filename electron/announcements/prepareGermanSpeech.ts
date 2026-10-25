const small=['null','eins','zwei','drei','vier','fünf','sechs','sieben','acht','neun','zehn','elf','zwölf','dreizehn','vierzehn','fünfzehn','sechzehn','siebzehn','achtzehn','neunzehn'];
const tens=['','','zwanzig','dreißig','vierzig','fünfzig','sechzig','siebzig','achtzig','neunzig'];
const months=['Januar','Februar','März','April','Mai','Juni','Juli','August','September','Oktober','November','Dezember'];
function number(n:number):string{if(n<20)return small[n];if(n<100)return(n%10?(n%10===1?'ein':small[n%10])+'und':'')+tens[Math.floor(n/10)];if(n<1000)return(Math.floor(n/100)===1?'ein':number(Math.floor(n/100)))+'hundert'+(n%100?number(n%100):'');return(Math.floor(n/1000)===1?'ein':number(Math.floor(n/1000)))+'tausend'+(n%1000?number(n%1000):'')}
function day(n:number,inflected:boolean){const stem=({1:'erst',3:'dritt',7:'siebt',8:'acht'} as Record<number,string>)[n]??(number(n)+(n<20?'t':'st'));return stem+(inflected?'en':'e')}
function date(d:number,m:number,y:number|undefined,prefix:string){
 const year=y??2000,probe=new Date(Date.UTC(year,m-1,d));
 if(year<1900||year>2199||probe.getUTCFullYear()!==year||probe.getUTCMonth()!==m-1||probe.getUTCDate()!==d)return null;
 if(/(?:\bversion\s*|\bv)\s*$/i.test(prefix))return null;
 const inflected=/(?:\bam|\bvom|\bzum|\bab|\bseit|\bden)\s*$/i.test(prefix),until=/\bbis\s*$/i.test(prefix),article=inflected||/\bder\s*$/i.test(prefix)?'':until?'zum ':'der ';
 return article+day(d,inflected||until)+' '+months[m-1]+(y?' '+number(y):'');
}
/** Native speech-only preparation: source records and visible text are never rewritten. */
export function prepareGermanSpeech(text:string):string{
 let result=text.replace(/(?<=[\d.])\s*[–—]\s*(?=\d)/g,' bis ');
 result=result.replace(/(?<![\d.])\b(\d{1,2})\.(\d{1,2})\.(\d{4})(?!\d|\.\d)/g,(full,d,m,y,offset)=>date(+d,+m,+y,result.slice(Math.max(0,offset-20),offset))??full);
 result=result.replace(/\b(\d{4})-(\d{2})-(\d{2})\b/g,(full,y,m,d,offset)=>date(+d,+m,+y,result.slice(Math.max(0,offset-20),offset))??full);
 result=result.replace(/(?<![\d.])\b(\d{1,2})\.(\d{1,2})\.(?!\d)/g,(full,d,m,offset)=>date(+d,+m,undefined,result.slice(Math.max(0,offset-20),offset))??full);
 const weekdays:Record<string,string>={Mo:'Montag',Di:'Dienstag',Mi:'Mittwoch',Do:'Donnerstag',Fr:'Freitag',Sa:'Samstag',So:'Sonntag'};
 result=result.replace(/\b(Mo|Di|Mi|Do|Fr|Sa|So)\.(?=\s|,|$)/g,(_,value)=>weekdays[value]);
 result=result.replace(/\b([01]?\d|2[0-3]):([0-5]\d)(?:\s*Uhr)?\b/g,(_,h,m)=>number(+h)+' Uhr'+(+m?' '+number(+m):''));

 return result;
}
