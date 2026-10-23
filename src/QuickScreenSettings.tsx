import { useState } from "react";
import {
  usePreferences,
  type QuickScreenConfig,
  type QuickScreenType,
} from "./preferences";
import { OsbSettings } from './osb/OsbSettings';
import {useI18n} from './i18n';
import {ScreenTestPattern} from './ScreenTestPattern';
import {screenTestPatterns} from './screenTest';

export function QuickScreenSettings() {
  const {t}=useI18n();
  const showServiceCountdown=usePreferences(state=>state.showServiceCountdown),setShowServiceCountdown=usePreferences(state=>state.setShowServiceCountdown);
  const items = usePreferences((s) => s.quickScreens),
    save = usePreferences((s) => s.setQuickScreens),
    [selected, setSelected] = useState(items[0]?.id ?? "logo"),
    active = items.find((item) => item.id === selected) ?? items[0];
  const patch = (id: string, value: Partial<QuickScreenConfig>) =>
    save(items.map((item) => (item.id === id ? { ...item, ...value } : item)));
  const drop = (from: string, to: string) => {
    const ordered = [...items].sort((a, b) => a.order - b.order),
      source = ordered.findIndex((item) => item.id === from),
      target = ordered.findIndex((item) => item.id === to);
    if (source < 0 || target < 0) return;
    const [moved] = ordered.splice(source, 1);
    ordered.splice(target, 0, moved);
    save(ordered.map((item, order) => ({ ...item, order })));
  };
  const add = () => {
    const name = prompt(t('quickScreenNamePrompt'));
    if (!name) return;
    const id = `custom-${Date.now()}`;
    save([
      ...items,
      {
        id,
        type: "custom",
        name,
        enabled: true,
        targets: ["main"],
        text: name,
        background: "#162d36",
        order: items.length,
      },
    ]);
    setSelected(id);
  };
  const image = (file?: File) => {
    if (!file || !active) return;
    const reader = new FileReader();
    reader.onload = () => patch(active.id, { imageUrl: String(reader.result) });
    reader.readAsDataURL(file);
  };
  if(active?.type==='bible')return <section><button onClick={()=>setSelected(items.find(item=>item.type!=='bible')?.id??'logo')}>← {t('quickScreens')}</button><OsbSettings/></section>;
  return (
    <section>
      <h3>{t('quickScreens')}</h3>
      <p>{t('quickScreensExplanation')}</p>
      <label><input type="checkbox" checked={showServiceCountdown} onChange={event=>setShowServiceCountdown(event.target.checked)}/>Kleinen Countdown bis zum Gottesdienst unten links auf MAIN anzeigen</label>
      <div className="quick-settings-layout">
        <div className="quick-list">
          <h4>{t('quickScreens').toUpperCase()}</h4>
          {[...items]
            .sort((a, b) => a.order - b.order)
            .map((item) => (
              <button
                draggable
                onDragStart={(e) =>
                  e.dataTransfer.setData("text/plain", item.id)
                }
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) =>
                  drop(e.dataTransfer.getData("text/plain"), item.id)
                }
                className={selected === item.id ? "active" : ""}
                key={item.id}
                onClick={() => setSelected(item.id)}
              >
                <span className="material-symbols-outlined" aria-hidden="true">
                  drag_indicator
                </span>
                <input
                  type="checkbox"
                  checked={item.enabled}
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) =>
                    patch(item.id, { enabled: e.target.checked })
                  }
                />
                <b>{item.name}</b>
                <small>{item.enabled ? t('quickScreenActive') : t('quickScreenInactive')}</small>
              </button>
            ))}
          <button className="add-quick" onClick={add}>
            {t('quickScreenAdd')}
          </button>
        </div>
        {active && (
          <div className="quick-details">
            <h4>{active.name.toUpperCase()}</h4>
            {active.type==='screenTest'&&<><p>Der automatische Bildschirmtest schaltet erst nach erfolgreicher Rückmeldung aus dem MAIN-Ausgabefenster weiter. Keine feste Anzeigedauer. Bei einer fehlenden Rückmeldung wird der Test mit einem Hinweis beendet. Schärfe, Kabel und Beamerfarben benötigen eine Sichtprüfung.</p><div className="screen-test-tiles">{screenTestPatterns.map(pattern=><button key={pattern.id} type="button" aria-label={pattern.label} aria-pressed={(active.testPattern??'bars')===pattern.id} onClick={()=>patch(active.id,{testPattern:pattern.id})}><ScreenTestPattern pattern={pattern.id}/><span>{pattern.label}</span></button>)}</div><p>Die Auswahl bestimmt das Vorschaubild. Der automatische Durchlauf prüft immer alle acht Muster, ohne Ton und ohne den ON-AIR-Status zu verändern.</p></>}
            <label>
              {t('quickScreenName')}
              <input
                value={active.name}
                onChange={(e) => patch(active.id, { name: e.target.value })}
              />
            </label>
            {!["black", "noText", "screenTest"].includes(active.type) && (
              <label>
                {t('text')}
                <textarea
                  value={active.text ?? ""}
                  placeholder={
                    active.type === "logo"
                      ? "Philippus Gemeinde Bielefeld e. V."
                      : ""
                  }
                  onChange={(e) => patch(active.id, { text: e.target.value })}
                />
              </label>
            )}
            {active.id==='technical-issue'&&active.type==='custom'&&<label>English text (automatischer Wechsel alle 8 Sekunden)<textarea value={active.technicalIssueEnglishText??'Technical difficulties\nThank you for your patience.'} maxLength={5000} onChange={event=>patch(active.id,{technicalIssueEnglishText:event.target.value})}/></label>}
            {active.type === "logo" && (
              <>
                <label>
                  {t('quickScreenChurchLogo')}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => image(e.target.files?.[0])}
                  />
                </label>
                {active.imageUrl && (
                  <button
                    onClick={() => patch(active.id, { imageUrl: undefined })}
                  >
                    {t('quickScreenRemoveLogo')}
                  </button>
                )}
              </>
            )}
            {!["black", "noText", "screenTest"].includes(active.type) && (
              <label>
                {t('background')}
                <input
                  type="color"
                  value={active.background ?? "#000000"}
                  onChange={(e) =>
                    patch(active.id, { background: e.target.value })
                  }
                />
              </label>
            )}
            {active.type === "countdown" && (
              <>
                <label>
                  {t('quickScreenDurationSeconds')}
                  <input
                    type="number"
                    min="1"
                    value={active.duration ?? 300}
                    onChange={(e) =>
                      patch(active.id, { duration: Number(e.target.value) })
                    }
                  />
                </label>
                <label>
                  {t('quickScreenEndText')}
                  <input
                    value={active.endText ?? ""}
                    onChange={(e) =>
                      patch(active.id, { endText: e.target.value })
                    }
                  />
                </label>
              </>
            )}
            {active.type!=='screenTest'&&<fieldset>
              <legend>{t('quickScreenTargets')}</legend>
              {["main", "stage", "notes", "livestream"].map((role) => (
                <label className="setting-check" key={role}>
                  <input
                    type="checkbox"
                    checked={active.targets.includes(role)}
                    onChange={(e) =>
                      patch(active.id, {
                        targets: e.target.checked
                          ? [...active.targets, role]
                          : active.targets.filter((value) => value !== role),
                      })
                    }
                  />
                  <span>
                    <b>{role.toUpperCase()}</b>
                  </span>
                </label>
              ))}
            </fieldset>}
            {active.type === "custom" && (
              <label>
                {t('quickScreenType')}
                <select
                  value={active.type}
                  onChange={(e) =>
                    patch(active.id, {
                      type: e.target.value as QuickScreenType,
                    })
                  }
                >
                  <option value="custom">{t('text')}</option>
                  <option value="logo">{t('quickScreenImageLogo')}</option>
                  <option value="countdown">{t('quickScreenCountdown')}</option>
                </select>
              </label>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
