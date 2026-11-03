import {expect,it} from 'vitest';
import {prepareFloat16Compatibility} from './inferenceCompatibility';
it('makes a fresh isolated inference scope use Uint16 float16 storage for the pinned native ORT binding',()=>{const scope={Float16Array:class NativeFloat16{},Uint16Array};prepareFloat16Compatibility(scope);expect(scope.Float16Array).toBeUndefined();expect(scope.Uint16Array).toBe(Uint16Array);prepareFloat16Compatibility(scope);expect(scope.Float16Array).toBeUndefined();});
