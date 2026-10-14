// Editorial/mechanical migration. Emits a patch; never edits source files itself.
import fs from 'node:fs';
import path from 'node:path';
const kind=process.argv.find(arg=>arg.startsWith('--kind='))?.split('=')[1];
const data=JSON.parse(fs.readFileSync('public/releases.json','utf8'));
const replacements=[[/Smoke-Tests?/g,'Integrationstests'],[/Smoke tests?/gi,'integration tests'],[/Roundtrip/g,'Speichern und erneutes Öffnen'],[/kompakte professionelle Bedienoberfläche/g,'kompakte, übersichtliche Bedienoberfläche'],[/compact professional interface/g,'compact, clearly arranged interface']];
function edit(value){if(typeof value==='string'){for(const [pattern,replacement]of replacements)value=value.replace(pattern,replacement);return value}if(Array.isArray(value))return value.map(edit);if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).map(([key,item])=>[key,edit(item)]));return value}
const revised=edit(data);
for(const line of revised.versions)for(const build of line.builds){
  const overview=build.overview?.text?.en;
  if(overview?.startsWith('This archived release focuses on')){
    const changes=['new','improved','fixed'].flatMap(section=>build.sections[section]??[]).map(item=>item.text?.en).filter(Boolean);
    if(changes.length)build.overview.text.en=changes.slice(0,3).join(' ');
  }
}
function preserveJsonFormatting(before,after,source){
  const changes=new Map();
  function walk(a,b){if(typeof a==='string'&&typeof b==='string'&&a!==b)changes.set(JSON.stringify(a),JSON.stringify(b));else if(a&&typeof a==='object')for(const key of Object.keys(a))walk(a[key],b[key])}
  walk(before,after);for(const [from,to]of changes){if(!source.includes(from))throw Error('Cannot locate original JSON value');source=source.replaceAll(from,to)}return source;
}
const absolute=relative=>path.resolve(relative).replaceAll('\\','/');
function add(file,content){return `*** Add File: ${absolute(file)}\n${content.replace(/\r/g,'').trimEnd().split('\n').map(line=>'+'+line).join('\n')}\n`}
function update(file,content){
  const old=fs.readFileSync(file,'utf8').replace(/\r/g,'').trimEnd(),next=content.replace(/\r/g,'').trimEnd();
  if(old===next)return '';
  if(file.endsWith('.json')){
    const a=old.split('\n'),b=next.split('\n');
    if(a.length!==b.length)throw Error('Unexpected JSON structural change');
    let patch=`*** Update File: ${absolute(file)}\n`;
    for(let i=0;i<a.length;i++)if(a[i]!==b[i])patch+=`@@\n-${a[i]}\n+${b[i]}\n`;
    return patch;
  }
  return `*** Update File: ${absolute(file)}\n@@\n${old.split('\n').map(line=>'-'+line).join('\n')}\n${next.split('\n').map(line=>'+'+line).join('\n')}\n`;
}
let patch='';
if(kind==='archive'){
  if(fs.existsSync('public/releases-archive-before-v82.md'))throw Error('Original archive already exists');
  patch=add('public/releases-archive-before-v82.md',fs.readFileSync('RELEASE_NOTES.md','utf8'));
}else if(kind==='json')patch=update('public/releases.json',preserveJsonFormatting(data,revised,fs.readFileSync('public/releases.json','utf8')));
else if(kind==='markdown'){
  const headings={new:'Neu',improved:'Verbessert',fixed:'Behoben',known:'Bekannte Einschränkungen'};
  const parts=[];
  for(const line of revised.versions)for(const build of line.builds){
    parts.push(`# GottesdienstRegie ${build.version}`);
    if(build.releaseDate)parts.push(`Veröffentlicht: ${new Date(`${build.releaseDate}T12:00:00Z`).toLocaleDateString('de-DE',{weekday:'short',day:'2-digit',month:'2-digit',year:'numeric',timeZone:'UTC'})}`);
    if(build.overview?.text?.de)parts.push(build.overview.text.de);
    for(const [key,title]of Object.entries(headings)){
      const entries=build.sections[key]??[];if(!entries.length)continue;
      parts.push(`## ${title}`);
      for(const item of entries)parts.push(`### ${item.label?.de??title}\n\n${item.text?.de??item.text?.en??''}`);
    }
    parts.push('---');
  }
  parts.push('<!-- Einheitlich aus public/releases.json aufbereitet. -->','[Ursprüngliche archivierte Detailnotizen vor v82](public/releases-archive-before-v82.md)');
  patch=update('RELEASE_NOTES.md',parts.join('\n\n')+'\n');
}else throw Error('Expected --kind=archive|json|markdown');
if(patch)process.stdout.write(`*** Begin Patch\n${patch}*** End Patch\n`);
