import {describe,expect,it,vi} from 'vitest';
import {SpotifyAuthService,createPkcePair} from './SpotifyAuthService';

describe('SpotifyAuthService',()=>{
  it('creates a verifier and matching SHA-256 challenge',()=>{const pair=createPkcePair();expect(pair.verifier.length).toBeGreaterThan(42);expect(pair.challenge).toMatch(/^[A-Za-z0-9_-]+$/)});
  it('reports a missing client id without opening a browser',async()=>{const open=vi.fn();const service=new SpotifyAuthService({clientId:'',redirectUri:'gottesdienstregie://spotify-callback',openExternal:open,request:vi.fn(),readRefreshToken:async()=>null,writeRefreshToken:async()=>{}});await expect(service.connect()).rejects.toThrow('SPOTIFY_CLIENT_ID_MISSING');expect(open).not.toHaveBeenCalled()});
  it('rejects a callback with the wrong state',async()=>{const service=new SpotifyAuthService({clientId:'client',redirectUri:'gottesdienstregie://spotify-callback',openExternal:vi.fn(),request:vi.fn(),readRefreshToken:async()=>null,writeRefreshToken:async()=>{}});await service.connect();await expect(service.completeCallback('gottesdienstregie://spotify-callback?code=x&state=wrong')).rejects.toThrow('SPOTIFY_STATE_MISMATCH')});
});
