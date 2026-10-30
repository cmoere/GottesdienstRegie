import { act, render, renderHook, screen } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import { translate, useI18n } from '../i18n';
import { usePreferences } from '../preferences';
import {loadRegionalInterfacePack} from './resources';

const initial=usePreferences.getState();
afterEach(()=>usePreferences.setState(initial,true));
function OperatorLabel(){const {t,locale}=useI18n();return <p lang={locale}>{t('updateChecking')}</p>}

it('retains administrator guidance through the public base translation API',()=>{
  expect(translate('de','authNoAccess')).toBe('Das Konto ist gültig, besitzt aber keinen freigeschalteten GottesdienstRegie-Zugang. Bitte wende dich an den Administrator.');
});

it('updates existing operator translations after loading a local dialect without changing audio preferences',async()=>{
  usePreferences.setState({language:'de',germanRegion:null});
  const audio=usePreferences.getState().audioRouting;
  render(<OperatorLabel/>);
  expect(screen.getByText('Suche nach Updates …')).toBeVisible();
  act(()=>usePreferences.getState().setGermanRegion('ruhr'));
  expect(await screen.findByText('Wir gucken nach Updates …')).toHaveAttribute('lang','de-DE');
  expect(usePreferences.getState().audioRouting).toBe(audio);
  act(()=>usePreferences.getState().setGermanRegion(null));
  expect(screen.getByText('Suche nach Updates …')).toBeVisible();
});

it('uses the current region in an operator action captured before the language change',async()=>{
  expect(await loadRegionalInterfacePack('ruhr')).toBe(true);
  usePreferences.setState({language:'de',germanRegion:null});
  const audio=usePreferences.getState().audioRouting;
  const {result}=renderHook(()=>useI18n());
  const capturedAction=result.current.tx;
  expect(capturedAction('Element hinzufügen')).toBe('Element hinzufügen');
  act(()=>usePreferences.setState({germanRegion:'ruhr'}));
  expect(capturedAction('Element hinzufügen')).toBe('Element dazutun');
  expect(usePreferences.getState().audioRouting).toBe(audio);
});
