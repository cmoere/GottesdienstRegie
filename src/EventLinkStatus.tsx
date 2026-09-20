import type { ChurchEvent } from './events';
import type { EventLink } from './store';
import type { Ref } from 'react';

export interface EventLinkViewModel {
  state: 'unlinked' | 'linked' | 'cancelled' | 'missing';
  title: string;
  plannedDate: string;
  plannedTime: string;
  detail: string;
  warning: string;
}

const cancelled = (event: ChurchEvent) =>
  event.cancel === true ||
  (typeof event.cancel === 'object' && event.cancel?.enabled === true) ||
  event.cancelled === true ||
  String(event.cancelled).toLowerCase() === 'true';

export function eventLinkViewModel(
  link: EventLink | undefined,
  events: ChurchEvent[],
  _now = new Date(),
): EventLinkViewModel {
  if (!link?.eventKey) return { state: 'unlinked', title: 'Veranstaltung verknüpfen', plannedDate: '', plannedTime: '', detail: 'Noch keine Veranstaltung ausgewählt', warning: '' };
  const event = events.find((entry) => entry.eventKey === link.eventKey);
  const plannedDate = link.dateSnapshot ?? event?.start_datum ?? '';
  const plannedTime = link.timeSnapshot ?? event?.start_uhrzeit ?? '';
  const title = link.titleSnapshot ?? event?.titel ?? 'Verknüpfte Veranstaltung';
  const detail = [plannedDate ? new Intl.DateTimeFormat('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(`${plannedDate}T12:00:00`)) : '', plannedTime ? `${plannedTime} Uhr` : ''].filter(Boolean).join(' · ');
  if (!event) return { state: 'missing', title, plannedDate, plannedTime, detail: detail || 'Gespeicherte Verknüpfung', warning: 'Die verknüpfte Veranstaltung ist derzeit nicht erreichbar.' };
  if (cancelled(event)) return { state: 'cancelled', title, plannedDate, plannedTime, detail, warning: 'Diese Veranstaltung fällt aus.' };
  return { state: 'linked', title, plannedDate, plannedTime, detail, warning: '' };
}

export function EventLinkStatus({ link, event, onClick, buttonRef }: { link?: EventLink; event: ChurchEvent | null; onClick: () => void; buttonRef?: Ref<HTMLButtonElement> }) {
  const view = eventLinkViewModel(link, event ? [event] : []);
  return <button ref={buttonRef} type="button" className={`event-link-status ${view.state}`} onClick={onClick} title={view.warning || view.detail}>
    <span className="material-symbols-outlined" aria-hidden="true">{view.state === 'cancelled' || view.state === 'missing' ? 'warning' : 'event'}</span>
    <span className="event-link-status-copy"><strong>{view.title}</strong><small>{view.warning || view.detail}</small></span>
    <span className="event-link-change">{view.state === 'unlinked' ? 'AUSWÄHLEN' : 'ÄNDERN'}</span>
  </button>;
}
