import {expect,it} from 'vitest';
import {parseVast} from './vast';
it('reads actual VAST video assets and wrappers without scripts, click-throughs or tracking pixels',()=>{
 const value=parseVast('<VAST version="4.2"><Ad><InLine><AdTitle>Partner</AdTitle><Impression>https://track.example/one</Impression><Creatives><Creative><Linear><Duration>00:00:20</Duration><MediaFiles><MediaFile type="video/mp4"><![CDATA[https://cdn.example/ad.mp4]]></MediaFile><MediaFile type="application/javascript">https://cdn.example/evil.js</MediaFile></MediaFiles></Linear></Creative></Creatives></InLine></Ad></VAST>');expect(value.creatives).toEqual([{title:'Partner',url:'https://cdn.example/ad.mp4',kind:'video',durationSeconds:20}]);expect(value.wrappers).toEqual([]);
 expect(parseVast('<VAST><Ad><Wrapper><VASTAdTagURI>https://ads.example/vast</VASTAdTagURI></Wrapper></Ad></VAST>').wrappers).toEqual(['https://ads.example/vast']);
 expect(()=>parseVast('<!DOCTYPE foo><VAST/>')).toThrow();
 expect(parseVast('<VAST><Ad><InLine><Creatives><Creative><Linear><MediaFiles><MediaFile type="video/mp4">https://cdn.example/low.mp4</MediaFile><MediaFile type="video/mp4">https://cdn.example/high.mp4</MediaFile></MediaFiles></Linear></Creative></Creatives></InLine></Ad></VAST>').creatives).toHaveLength(1);
});
