import {describe,expect,it,vi} from 'vitest';
import {RadioArtworkService} from './RadioArtworkService';

const jsonResponse=(body:unknown)=>({ok:true,status:200,json:async()=>body}) as Response;

describe('RadioArtworkService',()=>{
  it('resolves an exact recording to its approved front cover without an API key',async()=>{
    const fetcher=vi.fn()
      .mockResolvedValueOnce(jsonResponse({releases:[{id:'release-1',title:'Samba de Janeiro','artist-credit':[{name:'Bellini'}]}]}))
      .mockResolvedValueOnce(jsonResponse({images:[{front:true,approved:true,thumbnails:{'500':'http://coverartarchive.org/release/release-1/front-500.jpg'}}]}));
    const service=new RadioArtworkService(fetcher as typeof fetch,0);
    await expect(service.resolve('Samba de Janeiro','Bellini')).resolves.toEqual({imageUrl:'https://coverartarchive.org/release/release-1/front-500.jpg',album:'Samba de Janeiro'});
    expect(String(fetcher.mock.calls[0][0])).toContain('musicbrainz.org/ws/2/release');
    expect(fetcher.mock.calls[0][1]).toMatchObject({headers:{'User-Agent':expect.stringContaining('GottesdienstRegie/67')}});
    expect(fetcher.mock.calls[0][1]?.headers).not.toHaveProperty('Authorization');
  });

  it('caches a title so repeated metadata does not trigger more requests',async()=>{
    const fetcher=vi.fn().mockResolvedValueOnce(jsonResponse({recordings:[]}));
    const service=new RadioArtworkService(fetcher as typeof fetch,0);
    await service.resolve('Unbekannt','Band');
    await service.resolve('Unbekannt','Band');
    expect(fetcher).toHaveBeenCalledOnce();
  });
});
