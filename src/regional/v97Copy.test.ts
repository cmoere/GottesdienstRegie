import {describe,it,expect} from 'vitest';
import templates from '../../shared/regional/v97Templates.json';
import availability from '../../shared/regional/availability.json';
import {loadRegionalInterfacePack} from './resources';
import {resolveOperatorCopy} from './operatorCopy';
import {getBaseTemplate} from '../i18nBase';
const packs=import.meta.glob('../../shared/regional/packs/*.json',{eager:true,import:'default'}) as Record<string,{ui:Record<string,string>}>;
describe('v97 local AI and diagnostics copy',()=>{
 it('resolves every authored source string through all31 full regional packs',async()=>{
  for(const id of availability.regionIds){
   expect(await loadRegionalInterfacePack(id)).toBe(true);
   const pack=packs['../../shared/regional/packs/'+id+'.json'];
   for(const [key,source]of Object.entries(templates.ui))expect(resolveOperatorCopy({language:'de',germanRegion:id} as any,source),id+' '+key).toBe(pack.ui[key]);
  }
 });
 it('provides English captions without sending the local prompt online',()=>{
  expect(getBaseTemplate('en','v97AiSlides')).toBe('Create slides with AI');
  expect(getBaseTemplate('en','v97AiPrivacy')).toContain('stay on this computer');
 });
});
