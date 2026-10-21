'use strict';
const fs=require('node:fs');
const path=require('node:path');
const BASE='https://cmoere.github.io/GottesdienstRegie/release-notes/';
const xml=value=>String(value??'').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g,'').replace(/[&<>"']/g,character=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[character]));
const text=value=>typeof value==='string'?value:value?.de??value?.en??'';
function generateReleaseFeed(data){
 const builds=(data.versions??[]).flatMap(version=>version.builds??[]);
 const items=builds.map(build=>{
  if(!/^\d+\.\d+\.\d+$/.test(build.version)||!/^\d{4}-\d{2}-\d{2}$/.test(build.releaseDate))throw new Error('Invalid release identity or date');
  const date=new Date(`${build.releaseDate}T00:00:00Z`);
  if(!Number.isFinite(date.getTime()))throw new Error('Invalid release date');
  const link=BASE+'#version-'+build.version;
  const entries=[...(build.overview?[build.overview]:[]),...Object.values(build.sections??{}).flat()];
  const description=entries.map(entry=>[text(entry.label),text(entry.text)].filter(Boolean).join('\n')).join('\n\n');
  return `<item><title>GottesdienstRegie ${xml(build.version)}</title><link>${xml(link)}</link><guid isPermaLink="true">${xml(link)}</guid><pubDate>${date.toUTCString()}</pubDate><description>${xml(description)}</description></item>`;
 }).join('\n');
 return `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom"><channel><title>GottesdienstRegie – Versionshinweise</title><link>${BASE}</link><description>Neue Versionen, Verbesserungen und Fehlerbehebungen für GottesdienstRegie.</description><language>de</language><atom:link href="${BASE}feed.xml" rel="self" type="application/rss+xml"/>\n${items}\n</channel></rss>\n`;
}
module.exports={generateReleaseFeed};
if(require.main===module){
 const root=path.resolve(__dirname,'..');
 const data=JSON.parse(fs.readFileSync(path.join(root,'public/releases.json'),'utf8'));
 fs.writeFileSync(path.join(root,'public/release-notes/feed.xml'),generateReleaseFeed(data));
 console.log('RSS feed generated from public/releases.json');
}
