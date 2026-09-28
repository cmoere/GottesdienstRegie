import {describe,expect,it} from 'vitest';
import {sanitizeSpotifyReference} from './spotifyReference';

describe('sanitizeSpotifyReference',()=>{
  it('keeps presentation-safe track metadata only',()=>{
    expect(sanitizeSpotifyReference({id:'abc123',title:'Lied',artists:['Band'],album:'Album',durationMs:123000,imageUrl:'https://i.scdn.co/image/a',externalUrl:'https://open.spotify.com/track/abc123',uri:'spotify:track:abc123',accessToken:'secret'})).toEqual({provider:'spotify',id:'abc123',title:'Lied',artists:['Band'],album:'Album',durationMs:123000,imageUrl:'https://i.scdn.co/image/a',externalUrl:'https://open.spotify.com/track/abc123',uri:'spotify:track:abc123'});
  });
  it('rejects unsupported hosts and resource schemes',()=>{
    expect(()=>sanitizeSpotifyReference({id:'x',title:'x',artists:[],externalUrl:'https://evil.example/track/x',uri:'spotify:track:x'})).toThrow('INVALID_SPOTIFY_REFERENCE');
    expect(()=>sanitizeSpotifyReference({id:'x',title:'x',artists:[],externalUrl:'https://open.spotify.com/album/x',uri:'spotify:album:x'})).toThrow('INVALID_SPOTIFY_REFERENCE');
  });
});
