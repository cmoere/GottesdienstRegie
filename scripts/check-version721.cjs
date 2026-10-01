const fs=require('fs'),assert=require('assert');
const pkg=require('../package.json'),releases=require('../public/releases.json'),read=file=>fs.readFileSync(file,'utf8');
assert(pkg.version==='0.72.1'&&pkg.releaseSeries==='0.72','package must identify V72.1');
assert(releases.versions[0]?.builds[0]?.version==='0.72.1'&&releases.versions[0].builds[0].current===true,'V72.1 must lead the catalog');
assert(read('RELEASE_NOTES.md').startsWith('# GottesdienstRegie 0.72.1'),'notes must start with V72.1');
assert(read('src/ProductionWorkspace.tsx').includes('<EventSlideDesigner item={item} canEdit={canEdit} />'),'production event designer missing');
assert(read('src/community/EventService.ts').includes('new RoomService')&&read('electron/FirebaseGemeindeService.ts').includes("watchCollection('rooms'"),'central room resolution missing');
assert(read('src/dynamicEventSlide.ts').includes('effectiveEnd'),'event end time missing');
console.log('V72.1 release guard passed.');
