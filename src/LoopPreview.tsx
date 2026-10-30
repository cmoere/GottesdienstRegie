import {useI18n} from './i18n';
import { useEffect, useState } from 'react';
import {ActiveClockLoopView} from './clockLoop/ClockLoopView';
import {normalizeClockSettings} from './clockLoop/model';
import type { ServiceItem } from './store';
import {ExternalLoopElement} from './externalLoop/Element';
import { AnnouncementService } from './loopDataService';
import type { PublicAnnouncement } from './loopData';
import { announcementPlacement } from './announcementLive';

export function LoopPreview({ item }: { item: ServiceItem }) {
  const {tx}=useI18n();
  const [announcements, setAnnouncements] = useState<PublicAnnouncement[]>([]);
  useEffect(() => {
    if (item.type !== 'announcement') return;
    const placement = announcementPlacement(item.sectionId);
    const service = new AnnouncementService();
    return service.subscribe(placement, (items) => setAnnouncements(items), () => setAnnouncements([]));
  }, [item.type, item.sectionId]);
  if (item.type === 'weather') return <div className="loop-preview loop-preview-weather"><ExternalLoopElement properties={{...item.metadata,loopType:'weather'}} style={{width:'100%',height:'100%'}} mode="editor"/></div>;
  if (item.type === 'clock') return <ActiveClockLoopView settings={normalizeClockSettings(item.metadata)}/>;
  const announcement = announcements[0];
  const text = announcement?.text || String(item.slides[0]?.body || item.metadata.text || item.title);
  return <div className="loop-preview"><strong>{announcement?.title || item.title}</strong><p>{text}</p><small>{item.type === 'announcement' ? tx("{value1} öffentliche Meldungen · Firebase",{value1:announcements.length}) : tx("Loop-Vorschau")}</small></div>;
}
