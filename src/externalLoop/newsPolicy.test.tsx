import{cleanup,render,screen}from'@testing-library/react';import{afterEach,expect,it}from'vitest';
import{normalizeExternalSettings,visibleExternalPayload}from'./model';import{ExternalLoopDesigner}from'./Designer';import{createServiceItem}from'../store';import{readExternalRequest}from'../../shared/externalLoopRequest';
afterEach(cleanup);
it('migrates stored WDR selections and IPC requests to Westfalen-Blatt',()=>{
 for(const sources of ['wdr-owl','westfalen-blatt,wdr-owl'])expect(normalizeExternalSettings({newsSources:sources})).toMatchObject({sources:['westfalen-blatt']});
 expect(readExternalRequest({kind:'news',sources:['wdr-owl']})).toEqual({kind:'news',sources:['westfalen-blatt']});
});
it('does not render WDR entries from an old mixed snapshot and offers no WDR selection',()=>{
 const settings=normalizeExternalSettings({newsSources:'wdr-owl'}),snapshot:any={payload:{kind:'news',entries:[{id:'old',source:'wdr-owl',title:'Old WDR',url:'https://www1.wdr.de/a'},{id:'current',source:'westfalen-blatt',title:'WB',url:'https://www.westfalen-blatt.de/a'}]}};
 expect(visibleExternalPayload(snapshot,settings)).toMatchObject({entries:[{id:'current'}]});
 render(<ExternalLoopDesigner item={createServiceItem('news',{metadata:{externalKind:'news',newsSources:'wdr-owl'}})}/>);
 expect(screen.queryByText(/WDR/)).toBeNull();expect(screen.getByText(/Westfalen-Blatt/)).toBeInTheDocument();
});
