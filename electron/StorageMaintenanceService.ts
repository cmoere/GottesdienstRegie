import * as fs from 'node:fs/promises';
import * as path from 'node:path';

export type StorageCategory = 'translation-packs' | 'transformers-cache' | 'media-cache' | 'thumbnails' | 'temporary-downloads' | 'web-cache';
export interface StorageCategorySnapshot { category: StorageCategory; bytes: number; files: number; error?: string }
export interface StorageSnapshot { totalBytes: number; categories: StorageCategorySnapshot[] }

const knownCategories: StorageCategory[] = ['translation-packs','transformers-cache','media-cache','thumbnails','temporary-downloads','web-cache'];
export const isStorageCategory = (value: string): value is StorageCategory => knownCategories.includes(value as StorageCategory);

export class StorageMaintenanceService {
  constructor(private roots: Record<StorageCategory,string>) {}

  private async validateRoot(category: StorageCategory) {
    const configured = path.resolve(this.roots[category]);
    const parent = path.dirname(configured);
    await fs.mkdir(parent,{recursive:true});
    let parentReal = await fs.realpath(parent);
    let rootReal = configured;
    try { rootReal = await fs.realpath(configured); } catch (error: any) { if (error?.code !== 'ENOENT') throw error; }
    const relative = path.relative(parentReal,rootReal);
    if (!relative || relative.startsWith('..') || path.isAbsolute(relative)) throw new Error('STORAGE_ROOT_OUTSIDE_APPROVED_PARENT');
    return configured;
  }

  private async inspect(root:string): Promise<{bytes:number;files:number}> {
    let entries;
    try { entries = await fs.readdir(root,{withFileTypes:true}); } catch (error:any) { if(error?.code==='ENOENT') return {bytes:0,files:0}; throw error; }
    let bytes=0,files=0;
    for(const entry of entries){
      const target=path.join(root,entry.name),stat=await fs.lstat(target);
      if(stat.isSymbolicLink()) throw new Error('STORAGE_SYMLINK_REJECTED');
      if(stat.isDirectory()){const nested=await this.inspect(target);bytes+=nested.bytes;files+=nested.files;}
      else if(stat.isFile()){bytes+=stat.size;files++;}
    }
    return {bytes,files};
  }

  async snapshot():Promise<StorageSnapshot>{
    const categories:StorageCategorySnapshot[]=[];
    for(const category of knownCategories){
      try{const root=await this.validateRoot(category),value=await this.inspect(root);categories.push({category,...value});}
      catch(error){categories.push({category,bytes:0,files:0,error:error instanceof Error?error.message:String(error)});}
    }
    return {totalBytes:categories.reduce((sum,item)=>sum+item.bytes,0),categories};
  }

  async clear(categories:StorageCategory[]):Promise<StorageSnapshot>{
    for(const category of [...new Set(categories)]){
      if(!isStorageCategory(category))throw new Error('UNKNOWN_STORAGE_CATEGORY');
      const root=await this.validateRoot(category);
      try{
        await this.inspect(root);
        for(const entry of await fs.readdir(root,{withFileTypes:true})){
          const target=path.join(root,entry.name),stat=await fs.lstat(target);
          if(stat.isSymbolicLink())throw new Error('STORAGE_SYMLINK_REJECTED');
          await fs.rm(target,{recursive:true,force:true});
        }
      }catch(error:any){if(error?.code!=='ENOENT')throw error;}
    }
    return this.snapshot();
  }
}
