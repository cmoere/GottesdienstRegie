// Own disposable parent for a real native producer; no Office document belongs to it.
const fs=require('node:fs'),path=require('node:path');
const file=path.resolve(process.argv[2]);if(!fs.existsSync(path.join(path.dirname(file),'.probe-owned')))throw Error('OWN_PARENT_FIXTURE_REQUIRED');
setTimeout(()=>process.exit(3),10000).unref();
(async()=>{const config=JSON.parse(fs.readFileSync(file,'utf8'));await require('../../scripts/powerpoint-gpu-probe/producer-client.cjs').startGpuProducer(config);process.on('message',value=>{if(value?.exitOwnParent===true)process.exit(0)});process.send({ready:true});})().catch(error=>{console.error(error);process.exit(1)});
