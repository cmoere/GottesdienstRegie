import{expect,it}from'vitest';import{screenTestReport}from'./screenTestReport';
it('exports readable HTML without executing result text and excludes private metadata',()=>{
 const result=screenTestReport({status:'error',steps:[],message:'<script>alert(1)</script>'},{version:'0.87.0',createdAt:'2026-10-23T12:00:00Z',token:'private'} as any,'html');
 expect(result.text).toContain('&lt;script&gt;');expect(result.text).not.toContain('<script>');expect(result.text).not.toContain('private');expect(result.text).toContain('Sichtprüfung');expect(result.filename.endsWith('.html')).toBe(true);
});
it('exports cancelled and completed technical results in structured JSON with version and time',()=>{
 const output=screenTestReport({status:'cancelled',steps:[],message:'Abgebrochen'},{version:'0.87.0',createdAt:'2026-10-23T12:00:00Z'},'json');
 expect(JSON.parse(output.text)).toMatchObject({version:'0.87.0',createdAt:'2026-10-23T12:00:00.000Z',status:'cancelled',steps:[],physicalDisplayVerified:false});
});
