const fs=require('node:fs');
const path=require('node:path');

const root=path.resolve(__dirname,'..');
const pkg=JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8'));
const required=[pkg.main,'dist-electron/electron/preload.js','dist/index.html'];
const missing=required.filter(relative=>!relative||!fs.existsSync(path.join(root,relative)));

if(missing.length){
  console.error(`Fehlende Paketdateien: ${missing.join(', ')}`);
  process.exit(1);
}

console.log(`Paket-Einstieg geprüft: ${pkg.main}`);
