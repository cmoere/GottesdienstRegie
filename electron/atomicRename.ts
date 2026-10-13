import fs from 'node:fs/promises';

// Antivirus/indexing can briefly lock an existing Windows destination. Keep the
// old valid file intact and retry the atomic replacement, never unlink it.
export async function atomicRename(source:string,destination:string){
 for(let attempt=0;;attempt++){
  try{await fs.rename(source,destination);return}
  catch(error){
   if(attempt>=5||!['EPERM','EACCES','EBUSY'].includes((error as NodeJS.ErrnoException).code??''))throw error;
   await new Promise(resolve=>setTimeout(resolve,25*2**attempt));
  }
 }
}
