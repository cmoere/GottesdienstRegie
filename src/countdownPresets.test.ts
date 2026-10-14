import {describe,expect,it} from 'vitest';
import {countdownPresets,getCountdownPreset,createCountdownPresetMetadata} from './countdownPresets';
import {blankPresentationDocument,createServiceItem,usePresentation} from './store';
describe('offline countdown presets',()=>{
  it('offers each supported duration in six distinct native designs',()=>{
    expect(countdownPresets).toHaveLength(60);expect(new Set(countdownPresets.map(p=>p.id)).size).toBe(60);
    for(const seconds of [1200,900,600,300,180,120,60,30,20,10])expect(countdownPresets.filter(p=>p.durationSeconds===seconds).map(p=>p.designId)).toEqual(['clear','nature','light','cross','candle','geometric']);
  });
  it('rejects untrusted preset identifiers and never turns them into paths',()=>{
    for(const id of ['../../private','countdown:0:clear','countdown:11:clear','countdown:60:unknown',''])expect(createCountdownPresetMetadata(id)).toBeUndefined();
    expect(getCountdownPreset('countdown:1200:cross')).toEqual({id:'countdown:1200:cross',durationSeconds:1200,designId:'cross'});
  });
  it('restores silent native metadata and holds at zero unless configured to advance',()=>{
    const metadata=createCountdownPresetMetadata('countdown:60:candle')!;
    expect(metadata).toMatchObject({countdownPresetId:'countdown:60:candle',countdownDesign:'candle',countdownDurationSeconds:60,countdownSoundEnabled:false});
    const item=createServiceItem('countdown',{title:'Beginn',metadata});
    expect(item.autoAdvance).toBe(false);expect(item.plannedDuration).toBe(60000);
    const doc=blankPresentationDocument();doc.items=[item];usePresentation.getState().loadDocument(JSON.parse(JSON.stringify(doc)));
    expect(usePresentation.getState().items.find(i=>i.id===item.id)?.metadata).toMatchObject(metadata);
  });
});
