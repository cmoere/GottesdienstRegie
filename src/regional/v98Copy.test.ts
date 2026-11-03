import {expect,it} from 'vitest';
import templates from '../../shared/regional/v98Templates.json';
import availability from '../../shared/regional/availability.json';
import {loadRegionalInterfacePack} from './resources';
import {resolveOperatorCopy} from './operatorCopy';
import {getBaseTemplate} from '../i18nBase';
const packs=import.meta.glob('../../shared/regional/packs/*.json',{eager:true,import:'default'}) as Record<string,{ui:Record<string,string>}>;
it('resolves new model and design controls through all31 authored editions',async()=>{
 for(const id of availability.regionIds){expect(await loadRegionalInterfacePack(id)).toBe(true);const pack=packs['../../shared/regional/packs/'+id+'.json'];for(const [key,source]of Object.entries(templates.ui))expect(resolveOperatorCopy({language:'de',germanRegion:id} as any,source),id+' '+key).toBe(pack.ui[key])}
 expect(getBaseTemplate('en','v98Images')).toBe('Images and visual motifs');
});
