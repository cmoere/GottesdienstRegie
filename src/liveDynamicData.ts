import type { Slide } from "./store";
import { getLatestPublicEvents } from "./dynamicEventSlide";
import {prepareEventOverview} from './eventOverviewPresentation';
import {nowPlayingDisplay} from './nowPlayingModel';

export function hydrateNowPlayingData(slide:Slide):Slide{
 const audio=nowPlayingDisplay();
 return {...slide,elements:slide.elements.map(element=>element.type==='loop'&&element.properties.loopType==='nowPlaying'?{...element,properties:{...element.properties,nowPlayingActive:audio.active,nowPlayingTitle:audio.title,nowPlayingArtist:audio.artist,nowPlayingAlbum:audio.album,nowPlayingArtwork:audio.artworkUrl,nowPlayingSource:audio.source}}:element)};
}
export function nowPlayingSnapshotMatches(current:Slide|null,prepared:Slide){
 if(current?.id!==prepared.id)return false;
 const keys=['nowPlayingActive','nowPlayingTitle','nowPlayingArtist','nowPlayingAlbum','nowPlayingArtwork','nowPlayingSource'];
 return prepared.elements.filter(element=>element.type==='loop'&&element.properties.loopType==='nowPlaying').every(element=>{
  const old=current.elements.find(entry=>entry.id===element.id);return Boolean(old&&keys.every(key=>old.properties[key]===element.properties[key]));
 });
}

export function hydrateDynamicEventData(slide: Slide): Slide {
  const events = getLatestPublicEvents();
  return {
    ...structuredClone(slide),
    elements: slide.elements.map((element) => {
      const loopType = String(element.properties.loopType ?? "");
      if (
        element.type !== "loop" ||
        (loopType !== "event" && loopType !== "nextEvents")
      )
        return structuredClone(element);
      return {
        ...structuredClone(element),
        properties: {
          ...element.properties,
          eventItemsJson: JSON.stringify(events),
          eventStartedAtMs:Date.now(),
        },
      };
    }),
  };
}

export function eventOverviewMinimumDuration(slide:Slide|undefined){
 if(!slide)return 0;
 return Math.max(0,...hydrateDynamicEventData(slide).elements.filter(element=>element.type==='loop'&&['event','nextEvents'].includes(String(element.properties.loopType))).map(element=>prepareEventOverview(element.properties).minDurationMs));
}
