// Authoring only: translate public help prose, return an apply_patch document.
// The shipped application reads static bundled JSON and makes no translation calls.
import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
const locale=process.argv.find(arg=>arg.startsWith('--locale='))?.split('=')[1];
if(!['de','da','sv','no','fi','nl','fr','es','it','pl','pt-BR','uk','ru','tr','ar'].includes(locale))throw Error('Unsupported locale');
const module={exports:{}};
new Function('exports',ts.transpile(fs.readFileSync('src/help/enhancementsEnglish.ts','utf8'),{module:ts.ModuleKind.CommonJS}))(module.exports);
const entries=Object.entries(module.exports.helpEnhancementsEnglish),result={};let cursor=0;
async function worker(){
  while(cursor<entries.length){
    const [id,article]=entries[cursor++];let body;
    for(let attempt=0;attempt<5;attempt++){
      try{
        const url='https://translate.googleapis.com/translate_a/single?'+new URLSearchParams({client:'gtx',sl:'en',tl:locale==='pt-BR'?'pt':locale,dt:'t',q:article.body});
        const response=await fetch(url,{signal:AbortSignal.timeout(20000)});if(!response.ok)throw Error(`Translation HTTP ${response.status}`);
        const data=await response.json();body=data[0].map(row=>row[0]??'').join('').replace(/(^|\n)##\s*/g,'$1## ');
        if(body.length<150||!body.includes('\n'))throw Error('Incomplete translated article');break;
      }catch(error){if(attempt===4)throw error;await new Promise(resolve=>setTimeout(resolve,(attempt+1)*1500))}
    }
    result[id]={body,related:article.related};
  }
}
await Promise.all(Array.from({length:3},worker));
const ordered=Object.fromEntries(entries.map(([id])=>[id,result[id]]));
const target=path.resolve(`src/help/enhancements/${locale}.json`).replaceAll('\\','/');
process.stdout.write(`*** Begin Patch\n*** Add File: ${target}\n${JSON.stringify(ordered,null,2).split('\n').map(line=>'+'+line).join('\n')}\n*** End Patch\n`);
