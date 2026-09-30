const fs=require('fs'),assert=require('assert');
const pkg=require('../package.json'),releases=require('../public/releases.json');
const notes=fs.readFileSync('RELEASE_NOTES.md','utf8'),main=fs.readFileSync('electron/main.ts','utf8');
assert(Number(pkg.version.split('.')[1])>=71,'package must include V71.1 or newer');
assert(releases.versions.some(line=>line.builds?.some(build=>build.version==='0.71.1')),'release catalog must retain V71.1');
assert(notes.includes('# GottesdienstRegie 0.71.1'),'notes must retain V71.1');
assert(main.includes("sendToLiveWindow(controlWindow,'translation-packs:progress'")&&main.includes("sendToLiveWindow(controlWindow,'remote:command'"),'async window callbacks must use the safe sender');
console.log('V71.1 release guard passed.');
