import {expect,it,vi} from 'vitest';
import {remotePage} from './RemotePage';
it('localizes German control chrome while escaping captions and keeping the mirror protocol unchanged',()=>{
 const copy=vi.fn((key:string)=>key==='remoteWaiting'?'</script><img src=x>':'regional:'+key);
 const html=remotePage('remote','Prediger <Saal>','de','secret</script>',copy);
 expect(html).toContain('regional:remoteAdvance ▶');
 expect(html).toContain('Prediger &lt;Saal&gt;');
 expect(html).toContain('&lt;/script&gt;&lt;img src=x&gt;');
 expect(html).not.toContain('</script><img src=x>');
 expect(html).toContain('value="#699f3e"');
 expect(html).toContain('/api/frame?token=');
 const script=html.match(/<script>([\s\S]*?)<\/script>/)![1];
 expect(()=>new Function(script)).not.toThrow();
 expect(script).not.toContain('<img src=x>');
});
it('retains the viewer’s explicit English language without applying German regional captions',()=>{
 const copy=vi.fn(()=>{throw Error('German localization must not override explicit English')});
 const html=remotePage('monitor','Presenter','en','token',copy);
 expect(html).toContain('Waiting for presentation …');
 expect(html).toContain('Next ▶');
 expect(copy).not.toHaveBeenCalled();
 expect(html).toContain('<footer hidden>');
});
