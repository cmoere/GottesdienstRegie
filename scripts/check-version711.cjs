const fs=require('fs'),assert=require('assert');
const pkg=require('../package.json'),releases=require('../public/releases.json');
const notes=fs.readFileSync('RELEASE_NOTES.md','utf8'),main=fs.readFileSync('electron/main.ts','utf8');
assert(pkg.version==='0.71.1'&&pkg.releaseSeries==='0.71','package must identify V71.1');
assert(releases.versions[0]?.builds[0]?.version==='0.71.1'&&releases.versions[0].builds[0].current===true,'V71.1 must lead the release catalog');
assert(notes.startsWith('# GottesdienstRegie 0.71.1'),'notes must start with V71.1');
assert(main.includes("sendToLiveWindow(controlWindow,'translation-packs:progress'")&&main.includes("sendToLiveWindow(controlWindow,'remote:command'"),'async window callbacks must use the safe sender');
console.log('V71.1 release guard passed.');
