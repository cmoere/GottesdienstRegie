import {expect,it} from 'vitest';
import {replaceRadioTrack} from './backgroundAudioSelection';
const fileA=Object.freeze({assetId:'file:a',name:'Lied A',url:'file:///a.mp3'}),fileB=Object.freeze({assetId:'file:b',name:'Lied B',url:'file:///b.mp3'});
const old={assetId:'radio:old',name:'Alt',url:'https://example.test/old'},selected={assetId:'radio:new',name:'Neu',url:'https://example.test/new'};
it('replaces all old stations at their first playlist position without changing ordinary files or input',()=>{
 const input=[fileA,old,fileB,{...old,assetId:'radio:duplicate'}];Object.freeze(input);
 const result=replaceRadioTrack(input,selected);
 expect(result).toEqual([fileA,selected,fileB]);expect(result[0]).toBe(fileA);expect(result[2]).toBe(fileB);expect(input).toHaveLength(4);
});
it('appends the first station and selecting the same station never duplicates it',()=>{
 expect(replaceRadioTrack([fileA,fileB],selected)).toEqual([fileA,fileB,selected]);
 expect(replaceRadioTrack([fileA,selected],selected)).toEqual([fileA,selected]);expect(replaceRadioTrack([],selected)).toEqual([selected]);
});
