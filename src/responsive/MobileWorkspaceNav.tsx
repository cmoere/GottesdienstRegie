import {useI18n} from '../i18n';
import {useState} from 'react';
import {useWorkspaceLayout} from './useWorkspaceLayout';

const areas = [
  ['list_alt', 'order', 'service-sidebar-shell'],
  ['music_note', 'song', 'song-context'],
  ['edit_square', 'slide', 'production-workspace'],
  ['preview', 'preview', 'production-workspace'],
] as const;
type Area = typeof areas[number][1];
type Mode = 'edit' | 'preview';

export function MobileWorkspaceNav({mode, onModeChange, showSong = true}: {
  mode: Mode;
  onModeChange?: (mode: Mode) => void;
  showSong?: boolean;
}) {
  const {t, tx} = useI18n();
  const labels = {order: tx("Ablauf"), song: tx("Song"), slide: t('slidesOne'), preview: tx("Vorschau")};
  const layout = useWorkspaceLayout();
  const [selection, setSelection] = useState<{area: Area; mode: Mode}>({area: 'order', mode});
  const active = selection.mode !== mode ? (mode === 'preview' ? 'preview' : 'slide')
    : selection.area === 'song' && !showSong ? 'slide' : selection.area;
  if (layout === 'desktop') return null;
  return <nav className="mobile-workspace-nav" aria-label={tx("Arbeitsbereiche")}>
    {areas.filter(([, area]) => area !== 'song' || showSong).map(([icon, area, target]) =>
      <button key={area} type="button" aria-current={active === area ? 'page' : undefined} onClick={() => {
        const nextMode = !onModeChange || area === 'order' ? mode : area === 'preview' ? 'preview' : 'edit';
        setSelection({area, mode: nextMode});
        if (nextMode !== mode) onModeChange?.(nextMode);
        requestAnimationFrame(() => {
          document.querySelector<HTMLElement>(`.${target}`)?.scrollIntoView({block: 'nearest', inline: 'nearest'});
        });
      }}>
        <span className="material-symbols-outlined" aria-hidden="true">{icon}</span>
        <span>{labels[area]}</span>
      </button>)}
  </nav>;
}
