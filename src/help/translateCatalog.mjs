// Build-time authoring helper; the application uses only the checked-in JSON.
import fs from 'node:fs';
import ts from 'typescript';
const legacy = process.argv.includes('--legacy');
const source = fs.readFileSync(new URL(legacy ? './legacyGerman.ts' : './english.ts', import.meta.url), 'utf8');
const js = ts.transpile(source, {module: ts.ModuleKind.CommonJS});
const module = {exports:{}};
new Function('exports', js)(module.exports);
const entries = legacy ? Object.entries(module.exports.legacyGerman).map(([id,body])=>[id,{title:id,body}]) : Object.entries(module.exports.helpEnglish);
const locales = legacy ? ['en','fr','da','sv','no','fi','nl','es','it','pl','pt-BR','uk','ru','tr','ar'] : ['de','da','sv','no','fi','nl','es','it','pl','pt-BR','uk','ru','tr','ar'];
const result = Object.fromEntries(locales.map(l=>[l,{}]));
const jobs = locales.flatMap(locale=>entries.map(([id,a])=>({locale,id,text:a.title+'\n\n'+a.body})));
let cursor=0;
async function worker() {
  while(cursor<jobs.length) {
    const {locale,id,text}=jobs[cursor++];
    let translated;
    for(let attempt=0;attempt<4;attempt++) {
      try {
        const url='https://translate.googleapis.com/translate_a/single?'+new URLSearchParams({client:'gtx',sl:legacy?'de':'en',tl:locale==='pt-BR'?'pt':locale,dt:'t',q:text});
        const response=await fetch(url);
        if(!response.ok) throw new Error(String(response.status));
        const data=await response.json();
        translated=data[0].map(row=>row[0]||'').join('');
        if(!translated.includes('\n')) throw new Error('Missing article boundary');
        break;
      } catch(error) {
        if(attempt===3) throw error;
        await new Promise(resolve=>setTimeout(resolve,1000*(attempt+1)));
      }
    }
    const split=translated.indexOf('\n');
    result[locale][id]={title:translated.slice(0,split).trim(),body:translated.slice(split).trim()};
  }
}
await Promise.all(Array.from({length:6},worker));
const output=process.argv.find(arg=>arg.startsWith('--output='));
if(output)fs.writeFileSync(output.slice('--output='.length),JSON.stringify(result,null,2));
else process.stdout.write(JSON.stringify(result,null,2));
