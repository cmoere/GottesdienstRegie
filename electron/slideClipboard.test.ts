import{expect,it,vi}from'vitest';import{copySlideImage}from'./slideClipboard';
it('does not report successful copying before the image has actually reached the clipboard',async()=>{
 let finish:()=>void=()=>{};const write=vi.fn((_items:Array<{blob:Blob}>)=>new Promise<void>(resolve=>{finish=resolve})),image={isEmpty:()=>false,toPNG:()=>Buffer.from([137,80,78,71])};let completed=false;
 const copying=copySlideImage('data:image/png;base64,own',()=>image,blob=>({blob}),write).then(value=>{completed=true;return value});expect(completed).toBe(false);expect(write).toHaveBeenCalledOnce();expect(write.mock.calls[0][0][0].blob.type).toBe('image/png');finish();expect(await copying).toBe(true);
});
it('keeps clipboard failure visible and rejects empty renders before writing',async()=>{
 const write=vi.fn(async()=>{throw Error('clipboard unavailable')}),create=vi.fn((blob:Blob)=>blob);
 await expect(copySlideImage('empty',()=>({isEmpty:()=>true,toPNG:()=>Buffer.alloc(0)}),create,write)).rejects.toThrow('SLIDE_RENDER_FAILED');expect(write).not.toHaveBeenCalled();
 await expect(copySlideImage('own',()=>({isEmpty:()=>false,toPNG:()=>Buffer.from([137,80,78,71])}),create,write)).rejects.toThrow('clipboard unavailable');
});
