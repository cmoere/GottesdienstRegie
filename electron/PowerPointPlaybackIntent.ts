type Command='play'|'pause'|'next'|'previous'|'goto';
/** Quick screens temporarily mask playback; they do not erase an operator's
 * explicit pause or start a source that has never been asked to play. */
export function createPowerPointPlaybackIntent(){
 let playing=false,quick=false;
 return{
  command(operation:Command){if(operation==='play')playing=true;if(operation==='pause')playing=false;return quick&&operation==='play'?'pause':operation},
  quick(active:boolean){if(active===quick)return null;quick=active;return active||!playing?'pause' as const:'play' as const},
  reset(){playing=false;quick=false},
 };
}
