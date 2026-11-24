import {EventEmitter} from 'node:events';
import {beforeEach,describe,expect,it,vi} from 'vitest';
import {openRadioMetadataStream} from './RadioMetadataRequest';

type GetRequest=NonNullable<Parameters<typeof openRadioMetadataStream>[2]>;
const get=vi.fn();

function response(statusCode:number,headers:Record<string,string>={}){const value=new EventEmitter() as EventEmitter&{statusCode:number;headers:Record<string,string>;resume:()=>void};value.statusCode=statusCode;value.headers=headers;value.resume=vi.fn();return value}
function request(){const value=new EventEmitter() as EventEmitter&{destroy:()=>void};value.destroy=vi.fn();return value}

describe('RadioMetadataService redirects',()=>{
  beforeEach(()=>get.mockReset());
  it('stops at an HTTP downgrade without throwing from the response handler',()=>{
    let onResponse!:(value:ReturnType<typeof response>)=>void;
    const urls:string[]=[];
    const httpsOnly:GetRequest=(url,_options,callback)=>{
      urls.push(url);
      if(new URL(url).protocol!=='https:')throw new TypeError('ERR_INVALID_PROTOCOL');
      onResponse=callback as unknown as typeof onResponse;
      return request() as unknown as ReturnType<GetRequest>;
    };
    const opened=vi.fn();
    openRadioMetadataStream('https://radio.example.test/live',opened,httpsOnly);
    const redirect=response(302,{location:'http://radio.example.test/live'});
    expect(()=>onResponse(redirect)).not.toThrow();
    expect(redirect.resume).toHaveBeenCalledOnce();
    expect(urls).toEqual(['https://radio.example.test/live']);
    expect(opened).not.toHaveBeenCalled();
  });
  it('ignores malformed redirect targets and invalid initial URLs',()=>{
    const opened=vi.fn();
    openRadioMetadataStream('not a URL',opened,get as any);
    expect(get).not.toHaveBeenCalled();

    const redirect=response(302,{location:'https://['});
    get.mockImplementationOnce((_url,_options,callback)=>{callback(redirect);return request()});
    openRadioMetadataStream('https://radio.example.test/live',opened,get as any);
    expect(redirect.resume).toHaveBeenCalledOnce();
    expect(get).toHaveBeenCalledOnce();
    expect(opened).not.toHaveBeenCalled();
  });
  it('follows an HTTPS redirect and emits the redirected stream title',()=>{
    const first=response(302,{location:'https://cdn.example.test/live'}),second=response(200,{'icy-metaint':'1'}),requests=[request(),request()];
    get.mockImplementationOnce((...args:any[])=>{args.at(-1)(first);return requests[0]}).mockImplementationOnce((...args:any[])=>{args.at(-1)(second);return requests[1]});
    let opened:unknown;
    openRadioMetadataStream('https://radio.example.test/stream',value=>{opened=value},get as any);
    expect(get).toHaveBeenNthCalledWith(2,'https://cdn.example.test/live',expect.any(Object),expect.any(Function));
    expect(opened).toBe(second);
  });
});
