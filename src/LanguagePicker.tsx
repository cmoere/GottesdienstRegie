import { useMemo, useState } from 'react';
import { languageByCode, searchLanguages } from './languageCatalog';
import { downloadTranslationPack, isTranslationPackInstalled, translationPackCapability } from './translationPackManager';
import type { TranslationPackProgress } from './translationPackTypes';
import { FlagIcon } from './flags/FlagIcon';

export function LanguagePicker({ value, onChange, source = 'en', disabled = false }: { value: string; onChange: (code: string) => void; source?: string; disabled?: boolean }) {
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
    <button type="button" disabled={disabled} onClick={() => setOpen(value => !value)}><FlagIcon languageCode={selected.code} decorative /> {selected.name} <span className="material-symbols-outlined" aria-hidden="true">arrow_drop_down</span></button>
    {open && <div className="language-picker-popover" role="dialog" aria-label="Übersetzungssprache">
      <input autoFocus placeholder="Sprache suchen …" value={query} onChange={event => setQuery(event.target.value)} />
      <div>{languages.map(language => {
        const ready = isTranslationPackInstalled(source, language.code), capability = translationPackCapability(source, language.code), busy = progress[language.code];
        return <button type="button" key={language.code} onClick={() => void choose(language.code)}>
          <FlagIcon languageCode={language.code} decorative />
          <span><b>{language.name}</b><small>{language.nativeName}{!capability.supported && source !== language.code ? ' · Kein lokales Modell verfügbar' : ''}</small></span>
          <span>{busy ? (busy.totalBytes ? `${busy.percent}%` : <span className="material-symbols-outlined rotating" aria-label="Wird geladen">progress_activity</span>) : ready ? <span className="material-symbols-outlined" aria-label="Bereit">check_circle</span> : capability.supported ? <span className="material-symbols-outlined" aria-label="Herunterladen">cloud_download</span> : <span className="material-symbols-outlined" aria-label="Nur gespeicherten Text verwenden">cloud_off</span>}</span>
        </button>;
      })}</div>
    </div>}
  </div>;
}
