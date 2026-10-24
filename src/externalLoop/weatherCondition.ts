export type WeatherKind='sun'|'partly-cloudy'|'cloud'|'fog'|'drizzle'|'rain'|'freezing-rain'|'snow'|'thunder'|'hail'|'unknown';
/** Open-Meteo WMO interpretation: explicit codes, no accidental rain for snow/thunder. */
export function weatherCondition(code:number):{kind:WeatherKind;description:string}{
  if(code===0)return{kind:'sun',description:'Sonnig'};
  if(code===1||code===2)return{kind:'partly-cloudy',description:'Heiter bis wolkig'};
  if(code===3)return{kind:'cloud',description:'Bewölkt'};
  if(code===45||code===48)return{kind:'fog',description:'Neblig'};
  if([51,53,55].includes(code))return{kind:'drizzle',description:'Nieselregen'};
  if([56,57,66,67].includes(code))return{kind:'freezing-rain',description:'Gefrierender Regen'};
  if([61,63,65,80,81,82].includes(code))return{kind:'rain',description:code>=80?'Regenschauer':'Regen'};
  if([71,73,75,77,85,86].includes(code))return{kind:'snow',description:code>=85?'Schneeschauer':'Schnee'};
  if(code===95||code===97)return{kind:'thunder',description:'Gewitter'};
  if(code===96||code===99)return{kind:'hail',description:'Gewitter mit Hagel'};
  return{kind:'unknown',description:'Wetterlage nicht verfügbar'};
}
export const weatherAppearance=(code:number,wind:number)=>({...weatherCondition(code),windy:Number.isFinite(wind)&&wind>=30});
