export const screenTestPatterns=[{id:'bars',label:'Farbbalken'},{id:'grid',label:'Raster und Bildränder'},{id:'grayscale',label:'Graustufen'},{id:'white',label:'Weiß'},{id:'black',label:'Schwarz'},{id:'red',label:'Rot'},{id:'green',label:'Grün'},{id:'blue',label:'Blau'}] as const;
export type ScreenTestPatternId=typeof screenTestPatterns[number]['id'];
export type ScreenTestReceipt={runId:string;pattern:ScreenTestPatternId;ok:boolean;width:number;height:number;frames:number;elapsedMs:number;reason?:'canvas-unavailable'|'pattern-mismatch'|'geometry'};
export type ScreenTestSummary={status:'complete'|'error'|'cancelled';steps:ScreenTestReceipt[];message:string};
export function readScreenTestReceipt(value:unknown):ScreenTestReceipt|null{
  if(!value||typeof value!=='object'||Array.isArray(value))return null;
  const v=value as ScreenTestReceipt;
  if(Object.keys(v).some(k=>!['runId','pattern','ok','width','height','frames','elapsedMs','reason'].includes(k))||typeof v.runId!=='string'||!/^[a-f0-9]{32}$/.test(v.runId)||!screenTestPatterns.some(p=>p.id===v.pattern)||typeof v.ok!=='boolean')return null;
  if(![v.width,v.height].every(n=>Number.isInteger(n)&&n>=0&&n<=32768)||!Number.isInteger(v.frames)||v.frames<0||v.frames>10000||!Number.isFinite(v.elapsedMs)||v.elapsedMs<0||v.elapsedMs>60000)return null;
  if(v.ok&&(v.width===0||v.height===0||v.frames<12||v.elapsedMs<1000))return null;
  if(v.reason!==undefined&&!['canvas-unavailable','pattern-mismatch','geometry'].includes(v.reason))return null;
  return {...v};
}

// Operator-only coordinator. Sending is not a passing step: only a matching
// validated MAIN renderer receipt permits advancement. Timeout is a failure.
export function createScreenTestSession(options:{runId:string;show:(pattern:ScreenTestPatternId)=>Promise<unknown>;restore:()=>void|Promise<void>;onProgress?:(pattern:ScreenTestPatternId,completed:number)=>void}){
  let pending:{pattern:ScreenTestPatternId;resolve:(value:ScreenTestReceipt|null)=>void}|null=null;
  let started=false,stopped=false,cancelled=false,shouldRestore=true;
  const steps:ScreenTestReceipt[]=[];
  return {
    receive(value:unknown){const report=readScreenTestReceipt(value);if(stopped||!pending||!report||report.runId!==options.runId||report.pattern!==pending.pattern)return false;const current=pending;pending=null;current.resolve(report);return true},
    cancel(restore=true){if(stopped)return;cancelled=true;shouldRestore=restore;stopped=true;pending?.resolve(null);pending=null},
    async start():Promise<ScreenTestSummary>{
      if(started)throw Error('SCREEN_TEST_ALREADY_STARTED');started=true;
      let message='Alle acht Muster wurden im MAIN-Ausgabefenster technisch geprüft.',status:ScreenTestSummary['status']='complete';
      try{
        for(const {id} of screenTestPatterns){
          if(stopped)break;
          options.onProgress?.(id,steps.length);
          let timer:ReturnType<typeof setTimeout>|undefined;
          const result=new Promise<ScreenTestReceipt|null>(resolve=>{pending={pattern:id,resolve};timer=setTimeout(()=>{pending=null;resolve(null)},15000)});
          try{
            // Dispatch and receipt are raced against the same bounded wait; even
            // a hanging IPC Promise cannot keep this session alive indefinitely.
            const sent=Promise.resolve(options.show(id)).then(value=>{if(value===false)throw Error('MAIN-Ausgabe nicht verfügbar.');return result});
            const report=await Promise.race([sent,result]);
            if(cancelled)break;
            if(!report)throw Error('Keine gültige Rückmeldung von MAIN. Der Test wurde angehalten.');
            steps.push(report);
            if(!report.ok)throw Error('Die Musterprüfung auf MAIN ist fehlgeschlagen. Der Test wurde angehalten.');
          }finally{clearTimeout(timer);pending=null}
        }
      }catch(error){status='error';message=error instanceof Error?error.message:'Bildschirmtest fehlgeschlagen.'}
      finally{
        stopped=true;pending=null;
        if(shouldRestore){let timer:ReturnType<typeof setTimeout>|undefined;
          try{await Promise.race([Promise.resolve().then(options.restore),new Promise<never>((_,reject)=>{timer=setTimeout(()=>reject(Error('RESTORE_TIMEOUT')),3000)})])}
          catch{status='error';message='Die vorherige Schnellanzeige konnte nicht wiederhergestellt werden.'}
          finally{clearTimeout(timer)}
        }
      }
      if(cancelled&&status!=='error'){status='cancelled';message='Bildschirmtest abgebrochen.'}
      return {status,steps:[...steps],message};
    },
  };
}
