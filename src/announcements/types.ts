import type {AnnouncementPriority} from '../loopData';

/** Public speech data only; never pass the raw Firebase record to a player. */
export interface SpokenAnnouncement {
  id:string;
  title:string;
  text:string;
  revision:string;
  priority:AnnouncementPriority;
}
