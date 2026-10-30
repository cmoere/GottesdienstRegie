import{expect,it}from'vitest';import{screenTestReport}from'./screenTestReport';
it('exports readable HTML without executing result text and excludes private metadata',()=>{
 const result=screenTestReport({status:'error',steps:[],message:'<script>alert(1)</script>'},{version:'0.87.0',createdAt:'2026-10-23T12:00:00Z',token:'private'} as any,'html');
 expect(result.text).toContain('&lt;script&gt;');expect(result.text).not.toContain('<script>');expect(result.text).not.toContain('private');expect(result.text).toContain('Sichtprüfung');expect(result.filename.endsWith('.html')).toBe(true);
});
it('exports cancelled and completed technical results in structured JSON with version and time',()=>{
 const output=screenTestReport({status:'cancelled',steps:[],message:'Abgebrochen'},{version:'0.87.0',createdAt:'2026-10-23T12:00:00Z'},'json');
 expect(JSON.parse(output.text)).toMatchObject({version:'0.87.0',createdAt:'2026-10-23T12:00:00.000Z',status:'cancelled',steps:[],physicalDisplayVerified:false});
});

it('localizes report display without changing the measured results or physical-verification flag',()=>{
 const summary={status:'error' as const,message:'Angehalten',steps:[{runId:'a'.repeat(32),pattern:'grid' as const,ok:true,width:1920,height:1080,frames:12,elapsedMs:5000}]};
 const before=structuredClone(summary),metadata={version:'0.95.0',createdAt:'2026-10-30T10:00:00Z'};
 const copy=(key:string)=>key==='screenReportTitle'?'<script>Test</script>':'regional:'+key;
 const html=screenTestReport(summary,metadata,'html',copy);
 expect(html.text).toContain('&lt;script&gt;Test&lt;/script&gt;');
 expect(html.text).toContain('regional:screenReportPatternGrid');
 expect(html.text).toContain('regional:screenReportPassed');
 const json=JSON.parse(screenTestReport(summary,metadata,'json',copy).text);
 expect(json).toMatchObject({status:'error',physicalDisplayVerified:false,visualInspection:'regional:screenReportInspection',steps:[{pattern:'grid',width:1920,height:1080,frames:12,elapsedMs:5000}]});
 expect(summary).toEqual(before);
});
