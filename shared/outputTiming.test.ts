import {describe,it,expect} from 'vitest';
import {readOutputPaintReceipt,readOutputTimingSummaries} from './outputTiming';
describe('output timing receipt boundary',()=>{
 it('treats absent or malformed summary payloads as unavailable diagnostics',()=>{
  for(const value of [null,undefined,{},[{}],[{role:null}],Array(6).fill({role:'main'})])expect(readOutputTimingSummaries(value)).toEqual([]);
 });
 it('accepts finite bounded current measurements and rejects invalid statuses',()=>{
  const row={role:'main',status:'confirmed',samples:1,lastMs:50,renderMs:20,p95Ms:50,previewDeltaMs:-5};
  expect(readOutputTimingSummaries([row])).toEqual([row]);
  for(const patch of [{status:'unknown'},{samples:-1},{lastMs:NaN},{previewDeltaMs:Infinity}])expect(readOutputTimingSummaries([{...row,...patch}])).toEqual([]);
 });
 it('accepts a finite ordered application paint receipt',()=>{
  expect(readOutputPaintReceipt({revision:8,receivedAtMs:100,paintedAtMs:130})).toEqual({revision:8,receivedAtMs:100,paintedAtMs:130});
 });
 it('rejects unknown fields, fractional revisions, reversed dates and nonfinite values',()=>{
  for(const value of [null,{}, {revision:1.5,receivedAtMs:1,paintedAtMs:2},{revision:1,receivedAtMs:2,paintedAtMs:1},{revision:1,receivedAtMs:1,paintedAtMs:Infinity},{revision:1,receivedAtMs:1,paintedAtMs:2,body:'private'}])expect(readOutputPaintReceipt(value)).toBeNull();
 });
});
