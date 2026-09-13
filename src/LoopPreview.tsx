import { useEffect, useState } from 'react';
import type { ServiceItem } from './store';
import { WEATHER_SCREEN_URL } from './loopDomain';
import { AnnouncementService } from './loopDataService';
import type { PublicAnnouncement } from './loopData';

export function LoopPreview({ item }: { item: ServiceItem }) {
  const [now, setNow] = useState(() => new Date());
  const [announcements, setAnnouncements] = useState<PublicAnnouncement[]>([]);
  useEffect(() => {
    if (item.type !== 'clock') return;
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, [item.type]);
  useEffect(() => {
    if (item.type !== 'announcement') return;
    const placement = item.sectionId === 'post' ? 'postLoop' : item.sectionId === 'pre' ? 'preProgram' : 'preLoop';
    const service = new AnnouncementService();
    return service.subscribe(placement, (items) => setAnnouncements(items), () => setAnnouncements([]));
  }, [item.type, item.sectionId]);
  if (item.type === 'weather') return <div className="loop-preview loop-preview-weather"><iframe src={WEATHER_SCREEN_URL} title="Wetterscreen-Vorschau" sandbox="allow-scripts allow-same-origin" /></div>;
  if (item.type === 'clock') return <div className="loop-preview loop-preview-clock"><strong>{now.toLocaleTimeString('de-DE')}</strong><span>{now.toLocaleDateString('de-DE', { weekday: 'long', day: '2-digit', month: 'long' })}</span></div>;
  const announcement = announcements[0];
  const text = announcement?.text || String(item.slides[0]?.body || item.metadata.text || item.title);
  return <div className="loop-preview"><strong>{announcement?.title || item.title}</strong><p>{text}</p><small>{item.type === 'announcement' ? `${announcements.length} öffentliche Meldungen · Firebase` : 'Loop-Vorschau'}</small></div>;
}
