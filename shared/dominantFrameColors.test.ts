import {expect, it} from 'vitest';
import {dominantFrameColors} from './dominantFrameColors';
function frame(...colors: [number, number, number, number][]) {return new Uint8ClampedArray(colors.flat());}
it('recommends clear orange and dark blue for two substantial image colors', () => {
  const result = dominantFrameColors(frame(...Array(60).fill([220,120,45,255]),...Array(40).fill([18,35,80,255])));
  expect(result).toEqual([{hex:'#FF8C1A',family:'orange',shade:'normal'},{hex:'#173B8F',family:'blue',shade:'dark'}]);
});
it('shows only the dominant light color instead of a small contrasting detail', () => {
  const result=dominantFrameColors(frame(...Array(90).fill([110,180,245,255]),...Array(10).fill([230,60,50,255])));
  expect(result).toEqual([{hex:'#86C5FF',family:'blue',shade:'light'}]);
});
it('combines gradients and compression variations from the same color family', () => {
  const pixels=frame(...Array(40).fill([45,90,180,255]),...Array(35).fill([60,120,220,255]),...Array(25).fill([30,70,160,255]));
  expect(dominantFrameColors(pixels)).toEqual([{hex:'#2673E8',family:'blue',shade:'normal'}]);
});
it('does not recommend white text or black framing alongside substantial chromatic content', () => {
  const result=dominantFrameColors(frame(...Array(40).fill([230,90,30,255]),...Array(35).fill([20,40,90,255]),...Array(15).fill([255,255,255,255]),...Array(10).fill([0,0,0,255])));
  expect(result.map(color=>color.family)).toEqual(['orange','blue']);
});
it('keeps neutral images honest and ignores fully transparent pixels', () => {
  expect(dominantFrameColors(frame([0,0,0,255],[255,255,255,255])).map(color=>color.hex)).toEqual(['#000000','#FFFFFF']);
  expect(dominantFrameColors(frame([0,0,0,255]))).toEqual([{hex:'#000000',family:'black',shade:'normal'}]);
  expect(dominantFrameColors(frame([255,0,0,0]))).toEqual([]);
});
it('runs as a standalone browser function without module dependencies', () => {
  const run=new Function('return ('+dominantFrameColors.toString()+')')();
  expect(run(frame([18,35,80,255]))).toEqual([{hex:'#173B8F',family:'blue',shade:'dark'}]);
});
it('downweights narrow colored text strokes over a broad neutral background', () => {
  const width=32,height=24,pixels=new Uint8ClampedArray(width*height*4);
  for(let y=0;y<height;y++)for(let x=0;x<width;x++)pixels.set(x%4===1?[230,40,30,255]:[255,255,255,255],(y*width+x)*4);
  expect(dominantFrameColors(pixels,width)).toEqual([{hex:'#FFFFFF',family:'white',shade:'normal'}]);
});
it('keeps broad background color areas when removing fine foreground details', () => {
  const width=32,height=24,pixels=new Uint8ClampedArray(width*height*4);
  for(let y=0;y<height;y++)for(let x=0;x<width;x++)pixels.set(x<16?[220,120,45,255]:[18,35,80,255],(y*width+x)*4);
  expect(dominantFrameColors(pixels,width).map(color=>color.family)).toEqual(['orange','blue']);
});
