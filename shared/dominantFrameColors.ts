export type LightingFrameColor = {
  hex: string;
  family: 'red'|'orange'|'yellow'|'green'|'cyan'|'blue'|'purple'|'pink';
  shade: 'light'|'normal'|'dark';
};

/** Local ambient-light recommendations, not exact color-picker samples.
 * Group gradients by hue; neutral text/framing must not displace image colors.
 * Keep this function self-contained: the read-only monitor embeds it directly.
 */
export function dominantFrameColors(pixels: Uint8ClampedArray, width = 0): LightingFrameColor[] {
  // Spatial medians remove narrow foreground strokes before measuring the
  // broad background/image areas. Never hide or alter actual output layers.
  const height = pixels.length / 4 / width;
  if (Number.isInteger(width) && width >= 8 && Number.isInteger(height) && height >= 8) {
    const horizontal = new Uint8ClampedArray(pixels);
    const filtered = new Uint8ClampedArray(pixels);
    const pass = (source: Uint8ClampedArray, target: Uint8ClampedArray, alongX: boolean) => {
      for (let y=0;y<height;y++) for(let x=0;x<width;x++) {
        const offset=(y*width+x)*4;
        if(source[offset+3]<240) continue;
        const red:number[]=[],green:number[]=[],blue:number[]=[];
        for(let delta=-3;delta<=3;delta++) {
          const sx=alongX?Math.max(0,Math.min(width-1,x+delta)):x;
          const sy=alongX?y:Math.max(0,Math.min(height-1,y+delta));
          const sample=(sy*width+sx)*4;
          if(source[sample+3]<240)continue;
          red.push(source[sample]);green.push(source[sample+1]);blue.push(source[sample+2]);
        }
        const middle=Math.floor(red.length/2);
        target[offset]=red.sort((a,b)=>a-b)[middle];
        target[offset+1]=green.sort((a,b)=>a-b)[middle];
        target[offset+2]=blue.sort((a,b)=>a-b)[middle];
      }
    };
    pass(pixels,horizontal,true);pass(horizontal,filtered,false);pixels=filtered;
  }
  type Family = LightingFrameColor['family'];
  const groups = new Map<Family, {count:number; lightness:number}>();
  let total = 0, chromatic = 0;
  for (let index=0; index+3<pixels.length; index+=4) {
    if (pixels[index+3]<240) continue;
    total++;
    const r=pixels[index]/255, g=pixels[index+1]/255, b=pixels[index+2]/255;
    const max=Math.max(r,g,b), min=Math.min(r,g,b), chroma=max-min, lightness=(max+min)/2;
    const saturation=chroma===0?0:chroma/(1-Math.abs(2*lightness-1));
    if(chroma<.14 || saturation<.24 || lightness<.06)continue;
    const hue=(max===r?(g-b)/chroma+(g<b?6:0):max===g?(b-r)/chroma+2:(r-g)/chroma+4)*60;
    const family:Family=hue<15||hue>=345?'red':hue<45?'orange':hue<75?'yellow':hue<170?'green':hue<200?'cyan':hue<255?'blue':hue<290?'purple':'pink';
    chromatic++;
    const group=groups.get(family)??{count:0,lightness:0};
    group.count++;group.lightness+=lightness;groups.set(family,group);
  }
  // A tiny colored detail must not turn a neutral output into a light cue.
  if(!total || chromatic/total<.05)return [];
  const ranked=[...groups.entries()].sort((a,b)=>b[1].count-a[1].count);
  const weight=ranked.reduce((sum,[,group])=>sum+group.count,0);
  const primary=ranked[0];
  const selected=primary[1].count/weight>=.78?ranked.slice(0,1):ranked.filter(([,group],index)=>index===0||group.count/weight>=.18).slice(0,2);
  const palette: Record<Family, [string,string,string]> = {
    red:['#FF8A80','#E53935','#8F1D24'], orange:['#FFC078','#FF8C1A','#B9540A'],
    yellow:['#FFF29A','#F9D648','#B58B12'], green:['#A3E56D','#35B24A','#166534'],
    cyan:['#8DE4EE','#20BED1','#12697A'], blue:['#86C5FF','#2673E8','#173B8F'],
    purple:['#CCA1F2','#934DDB','#522080'], pink:['#FFA5D5','#E94C9E','#951D5D']
  };
  return selected.map(([family,group])=>{
    const lightness=group.lightness/group.count;
    const shade=lightness>=.68?'light':lightness<=.30?'dark':'normal';
    return {hex:palette[family][shade==='light'?0:shade==='normal'?1:2],family,shade};
  });
}
