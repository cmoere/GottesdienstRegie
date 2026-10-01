const fs=require('fs'),assert=require('assert');
const pkg=require('../package.json'),releases=require('../public/releases.json'),read=file=>fs.readFileSync(file,'utf8');
assert(Number(pkg.version.split('.')[1])>=72,'package must include V72.1 or newer');
assert(releases.versions.some(line=>line.builds?.some(build=>build.version==='0.72.1')),'catalog must retain V72.1');
assert(read('RELEASE_NOTES.md').includes('# GottesdienstRegie 0.72.1'),'notes must retain V72.1');
assert(read('src/ProductionWorkspace.tsx').includes('<EventSlideDesigner item={item} canEdit={canEdit} />'),'production event designer missing');
assert(read('src/community/EventService.ts').includes('new RoomService')&&read('electron/FirebaseGemeindeService.ts').includes("watchCollection('rooms'"),'central room resolution missing');
assert(read('src/dynamicEventSlide.ts').includes('effectiveEnd'),'event end time missing');
console.log('V72.1 release guard passed.');
