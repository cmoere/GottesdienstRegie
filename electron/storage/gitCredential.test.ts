import {afterEach,expect,it,vi} from 'vitest';
import {EventEmitter} from 'node:events';
import {PassThrough} from 'node:stream';
const spawn=vi.hoisted(()=>vi.fn());
const windowsRead=vi.hoisted(()=>vi.fn().mockResolvedValue(null));
vi.mock('node:child_process',()=>({spawn,default:{spawn}}));
vi.mock('./windowsCredential',()=>({readWindowsGitHubCredential:windowsRead}));
import {createGitHubCredentialReader} from './gitCredential';
afterEach(()=>{vi.useRealTimers();vi.clearAllMocks();windowsRead.mockResolvedValue(null)});
function processStub(){const child=Object.assign(new EventEmitter(),{stdout:new PassThrough(),stdin:new PassThrough(),kill:vi.fn()});spawn.mockReturnValue(child);return child;}
it('bounds a stalled credential helper, disables prompts and coalesces concurrent lookups',async()=>{vi.useFakeTimers();const child=processStub(),read=createGitHubCredentialReader(),a=read('team'),b=read('team');expect(spawn).toHaveBeenCalledTimes(1);const options=spawn.mock.calls[0][2];expect(options.env).toMatchObject({GIT_TERMINAL_PROMPT:'0',GCM_INTERACTIVE:'never'});await vi.advanceTimersByTimeAsync(5000);expect(await a).toBeNull();expect(await b).toBeNull();expect(child.kill).toHaveBeenCalled();});
it('caches a successful read briefly and does not force the repository owner as account',async()=>{const child=processStub(),input:string[]=[];child.stdin.on('data',chunk=>input.push(String(chunk)));const read=createGitHubCredentialReader(),pending=read('team');child.stdout.write('username=contributor\npassword=test=credential\n');child.emit('close',0);expect(await pending).toBe('test=credential');expect(input.join('')).not.toContain('username=team');expect(await read('team')).toBe('test=credential');expect(spawn).toHaveBeenCalledTimes(1);});
it('returns no credential when git is unavailable and handles pipe errors',async()=>{const child=processStub(),read=createGitHubCredentialReader(),pending=read();child.stdin.emit('error',new Error('EPIPE'));child.emit('error',Object.assign(new Error('missing'),{code:'ENOENT'}));expect(await pending).toBeNull();});
it('uses the existing Windows GitHub entry when the normal app has no git executable',async()=>{windowsRead.mockResolvedValue('existing-token');const child=processStub(),read=createGitHubCredentialReader(),pending=read('team');child.emit('error',Object.assign(new Error('missing'),{code:'ENOENT'}));expect(await pending).toBe('existing-token');expect(windowsRead).toHaveBeenCalledWith('team');});
