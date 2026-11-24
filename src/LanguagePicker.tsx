import {UiIcon} from './icons/UiIcon';
import {useI18n} from "./i18n";
import { useMemo, useState } from 'react';
import { languageByCode, searchLanguages } from './languageCatalog';
import { downloadTranslationPack, isTranslationPackInstalled, translationPackCapability } from './translationPackManager';
import type { TranslationPackProgress } from './translationPackTypes';
import { FlagIcon } from './flags/FlagIcon';

export function LanguagePicker({ value, onChange, source = 'en', disabled = false }: { value: string; onChange: (code: string) => void; source?: string; disabled?: boolean }) {
 const {tx}=useI18n();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [progress, setProgress] = useState<Record<string, TranslationPackProgress | undefined>>({});
  const languages = useMemo(() => searchLanguages(query), [query]);
  const selected = languageByCode(value);
  const choose = async (code: string) => {
    const capability = translationPackCapability(source, code);
    if (!isTranslationPackInstalled(source, code) && capability.supported) {
      setProgress(current => ({ ...current, [code]: { key: `${source}-${code}`, status: 'downloading', downloadedBytes: 0, percent: 0 } }));
      try {
        await downloadTranslationPack(source, code, value => setProgress(current => ({ ...current, [code]: value })));
      } finally {
        setProgress(current => ({ ...current, [code]: undefined }));
      }
    }
    onChange(code);
    setOpen(false);
  };
  return <div className="language-picker">
    <button type="button" disabled={disabled} onClick={() => setOpen(value => !value)}><FlagIcon languageCode={selected.code} decorative /> {selected.name} <UiIcon name="arrow_drop_down" aria-hidden="true" /></button>
    {open && <div className="language-picker-popover" role="dialog" aria-label={tx("Übersetzungssprache")}>
      <input autoFocus placeholder={tx("Sprache suchen …")} value={query} onChange={event => setQuery(event.target.value)} />
      <div>{languages.map(language => {
        const ready = isTranslationPackInstalled(source, language.code), capability = translationPackCapability(source, language.code), busy = progress[language.code];
        return <button type="button" key={language.code} onClick={() => void choose(language.code)}>
          <FlagIcon languageCode={language.code} decorative />
          <span><b>{language.name}</b><small>{language.nativeName}{!capability.supported && source !== language.code ? " "+tx("· Kein lokales Modell verfügbar") : ''}</small></span>
          <span>{busy ? (busy.totalBytes ? `${busy.percent}%` : <UiIcon name="progress_activity" className="rotating" aria-label={tx("Wird geladen")} />) : ready ? <UiIcon name="check_circle" aria-label={tx("BEREIT")} /> : capability.supported ? <UiIcon name="cloud_download" aria-label={tx("Herunterladen")} /> : <UiIcon name="cloud_off" aria-label={tx("Nur gespeicherten Text verwenden")} />}</span>
        </button>;
      })}</div>
    </div>}
  </div>;
}
