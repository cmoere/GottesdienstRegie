const fs=require('fs'),assert=require('assert'),pkg=require('../package.json'),releases=require('../public/releases.json'),read=file=>fs.readFileSync(file,'utf8');
assert(Number(pkg.version.split('.')[1])>=73,'package must include V73 or newer');
assert(releases.versions.some(entry=>entry.builds?.some(build=>build.version==='0.73.0')),'catalog must retain V73');
assert(read('RELEASE_NOTES.md').includes('# GottesdienstRegie 0.73.0'),'notes must retain V73');
const main=read('electron/main.ts'),startup=read('electron/windowStartup.ts');
assert(main.includes('UPDATE_CHECK_DELAY_AFTER_WORKSPACE_MS')&&startup.includes('UPDATE_CHECK_DELAY_AFTER_WORKSPACE_MS=2000'),'post-loading update delay missing');
assert(!main.includes('setTimeout(()=>void checkForUpdates(),5000)'),'renderer-load update timer must be removed');
assert(read('src/i18n.ts').includes('Bitte wende dich an den Administrator.'),'administrator guidance missing');
console.log('V73 release guard passed.');
