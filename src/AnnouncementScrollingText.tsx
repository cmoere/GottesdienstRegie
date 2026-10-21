import {AnnouncementRichText} from './AnnouncementRichTextRenderer';
import {EventScrollViewport,useEventPresentationClock} from './EventScrollViewport';
import {eventScrollOffset,prepareEventScrollPlan} from './eventScroll';
import {usePreferences} from './preferences';
export function AnnouncementScrollingText({properties,startedAtMs,live}:{properties:Record<string,string|number|boolean>;startedAtMs:number;live:boolean}){
 const plan=prepareEventScrollPlan({contentHeight:Number(properties.announcementScrollHeight),viewportHeight:Number(properties.announcementViewportHeight)});
 const reduceMotion=usePreferences(state=>state.reduceMotion);
 const {elapsed,reduced}=useEventPresentationClock(startedAtMs,reduceMotion);
 const content=<AnnouncementRichText value={properties.announcementRichLines} text={String(properties.text??'')}/>;
 if(!live)return content;
 if(reduced){const offset=eventScrollOffset(plan,elapsed);return <div style={{height:'100%',overflow:'hidden'}}><div style={{transform:`translateY(-${offset/19.2}cqw)`}}>{content}</div></div>}
 return <EventScrollViewport className="announcement-scroll-viewport" plan={plan} elapsed={elapsed}>{content}</EventScrollViewport>;
}
