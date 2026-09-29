import {EventEmitter} from 'node:events';
import {beforeEach,describe,expect,it,vi} from 'vitest';
import {openRadioMetadataStream} from './RadioMetadataRequest';

const get=vi.fn();

function response(statusCode:number,headers:Record<string,string>={}){const value=new EventEmitter() as EventEmitter&{statusCode:number;headers:Record<string,string>;resume:()=>void};value.statusCode=statusCode;value.headers=headers;value.resume=vi.fn();return value}
function request(){const value=new EventEmitter() as EventEmitter&{destroy:()=>void};value.destroy=vi.fn();return value}

describe('RadioMetadataService redirects',()=>{
  beforeEach(()=>get.mockReset());
  it('follows an HTTPS redirect and emits the redirected stream title',()=>{
    const first=response(302,{location:'https://cdn.example.test/live'}),second=response(200,{'icy-metaint':'1'}),requests=[request(),request()];
    get.mockImplementationOnce((...args:any[])=>{args.at(-1)(first);return requests[0]}).mockImplementationOnce((...args:any[])=>{args.at(-1)(second);return requests[1]});
    let opened:unknown;
    openRadioMetadataStream('https://radio.example.test/stream',value=>{opened=value},get as any);
    expect(get).toHaveBeenNthCalledWith(2,'https://cdn.example.test/live',expect.any(Object),expect.any(Function));
    expect(opened).toBe(second);
  });
});
