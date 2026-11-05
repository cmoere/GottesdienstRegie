import {expect,it} from 'vitest';
import {imageArguments} from './runImageWorker';
it('passes a literal bounded prompt with fixed quality settings and CPU text encoding',()=>{
 const args=imageArguments('/owned/model','/owned/image.png','A church; echo secret',true);
 expect(args[args.indexOf('-p')+1]).toBe('A church; echo secret');expect(args).toContain('te=cpu,vae=vulkan0,diffusion=vulkan0');expect(args[args.indexOf('--steps')+1]).toBe('4');expect(args[args.indexOf('-W')+1]).toBe('1024');expect(args).not.toContain('--lora-model-dir');
});
it('uses a single CPU thread at a smaller resolution for live image inference',()=>{
 const args=imageArguments('/owned/model','/owned/image.png','A church',false,true);
 expect(args[args.indexOf('--backend')+1]).toBe('cpu');
 expect(args[args.indexOf('-t')+1]).toBe('1');
 expect(args[args.indexOf('-W')+1]).toBe('640');
 expect(args[args.indexOf('-H')+1]).toBe('384');
 expect(args).not.toContain('--max-vram');
 const accelerated=imageArguments('/owned/model','/owned/image.png','A church',true,true);
 expect(accelerated[accelerated.indexOf('--max-vram')+1]).toBe('1.2');
});
