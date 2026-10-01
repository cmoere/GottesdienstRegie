const fs=require('fs'),assert=require('assert');
const pkg=require('../package.json'),releases=require('../public/releases.json');
const notes=fs.readFileSync('RELEASE_NOTES.md','utf8'),main=fs.readFileSync('electron/main.ts','utf8'),prefs=fs.readFileSync('electron/AppPreferences.ts','utf8'),app=fs.readFileSync('src/App.tsx','utf8');
assert(Number(pkg.version.split('.')[1])>=72,'package must include V72 or newer');
assert(releases.versions.some(line=>line.builds?.some(build=>build.version==='0.72.0')),'release catalog must retain V72');
assert(notes.includes('# GottesdienstRegie 0.72.0'),'notes must retain V72');
assert(main.includes("buttons:['Jetzt installieren','Später','Beim Beenden installieren','Abbrechen']"),'four-way update prompt missing');
assert(prefs.includes('installUpdatesOnQuit')&&app.includes('Heruntergeladene Updates beim Beenden installieren'),'install-on-quit setting missing');
console.log('V72 release guard passed.');
