const fs=require('fs'),assert=require('assert');
const pkg=require('../package.json'),releases=require('../public/releases.json');
const notes=fs.readFileSync('RELEASE_NOTES.md','utf8'),main=fs.readFileSync('electron/main.ts','utf8'),prefs=fs.readFileSync('electron/AppPreferences.ts','utf8'),app=fs.readFileSync('src/App.tsx','utf8');
assert(pkg.version==='0.72.0'&&pkg.releaseSeries==='0.72','package must identify V72');
assert(releases.versions[0]?.builds[0]?.version==='0.72.0'&&releases.versions[0].builds[0].current===true,'V72 must lead the release catalog');
assert(notes.startsWith('# GottesdienstRegie 0.72.0'),'notes must start with V72');
assert(main.includes("buttons:['Jetzt installieren','Später','Beim Beenden installieren','Abbrechen']"),'four-way update prompt missing');
assert(prefs.includes('installUpdatesOnQuit')&&app.includes('Heruntergeladene Updates beim Beenden installieren'),'install-on-quit setting missing');
console.log('V72 release guard passed.');
