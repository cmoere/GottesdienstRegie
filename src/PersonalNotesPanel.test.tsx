// @vitest-environment jsdom
import React from 'react';
import {act,cleanup,fireEvent,render,screen} from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import {afterEach,beforeEach,describe,expect,it,vi} from 'vitest';
import {PersonalNotesPanel} from './PersonalNotesPanel';

const noteKey={userId:'user-1',presentationId:'presentation-1'};

function editor(){return screen.getByRole('textbox')}
function enter(value:string){
  const element=editor();
  element.innerHTML=value;
  fireEvent.input(element);
}

describe('PersonalNotesPanel save status',()=>{
  beforeEach(()=>{
    vi.useFakeTimers();
    vi.clearAllTimers();
    localStorage.clear();
  });

  afterEach(()=>{
    cleanup();
    vi.clearAllTimers();
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('shows sync dots while saving, a success check, then the private lock again',()=>{
    render(<PersonalNotesPanel noteKey={noteKey} label="Notizen"/>);
    expect(screen.getByRole('status')).toHaveTextContent('Diese Notiz ist nur für dich sichtbar.');
    expect(screen.getByRole('status').querySelector('.material-symbols-outlined')).toHaveTextContent('lock');

    enter('Erste Notiz');
    expect(screen.getByRole('status')).toHaveTextContent('Speichert .');
    expect(screen.getByRole('status').querySelector('.material-symbols-outlined')).toHaveTextContent('sync');

    act(()=>vi.advanceTimersByTime(400));
    expect(screen.getByRole('status')).toHaveTextContent('Speichert ..');

    act(()=>vi.advanceTimersByTime(100));
    expect(screen.getByRole('status')).toHaveTextContent('Gespeichert');
    expect(screen.getByRole('status').querySelector('.material-symbols-outlined')).toHaveTextContent('check_circle');

    act(()=>vi.advanceTimersByTime(4999));
    expect(screen.getByRole('status')).toHaveTextContent('Gespeichert');
    act(()=>vi.advanceTimersByTime(1));
    expect(screen.getByRole('status')).toHaveTextContent('Diese Notiz ist nur für dich sichtbar.');
    expect(screen.getByRole('status').querySelector('.material-symbols-outlined')).toHaveTextContent('lock');
  });

  it('does not let an older debounce save a newer edit early',()=>{
    render(<PersonalNotesPanel noteKey={noteKey} label="Notizen"/>);
    enter('A');
    act(()=>vi.advanceTimersByTime(300));
    enter('AB');
    act(()=>vi.advanceTimersByTime(200));
    expect(screen.getByRole('status')).toHaveTextContent('Speichert');
    act(()=>vi.advanceTimersByTime(300));
    expect(screen.getByRole('status')).toHaveTextContent('Gespeichert');
    expect(localStorage.getItem('gottesdienstregie.personal-note.user-1.presentation-1.presentation')).toBe('AB');
  });

  it('keeps a later save error visible instead of running an old success timer',()=>{
    const write=vi.spyOn(Storage.prototype,'setItem');
    render(<PersonalNotesPanel noteKey={noteKey} label="Notizen"/>);
    enter('Erfolg');
    act(()=>vi.advanceTimersByTime(500));
    expect(screen.getByRole('status')).toHaveTextContent('Gespeichert');

    write.mockImplementationOnce(()=>{throw new Error('storage full')});
    enter('Fehler');
    act(()=>vi.advanceTimersByTime(500));
    expect(screen.getByRole('status')).toHaveTextContent('Speichern fehlgeschlagen');
    expect(screen.getByRole('status').querySelector('.material-symbols-outlined')).toHaveTextContent('error');
    act(()=>vi.advanceTimersByTime(5000));
    expect(screen.getByRole('status')).toHaveTextContent('Speichern fehlgeschlagen');
  });

  it('cleans every pending timer when the panel unmounts',()=>{
    const view=render(<PersonalNotesPanel noteKey={noteKey} label="Notizen"/>);
    const baseline=vi.getTimerCount();
    enter('Noch offen');
    expect(vi.getTimerCount()).toBeGreaterThan(baseline);
    view.unmount();
    expect(vi.getTimerCount()).toBe(baseline);
  });

  it('announces one stable saving message while visual dots animate separately',()=>{
    render(<PersonalNotesPanel noteKey={noteKey} label="Notizen"/>);
    enter('Barrierefrei');
    const status=screen.getByRole('status');
    expect(status).toHaveAttribute('aria-live','polite');
    expect(status).toHaveTextContent('Notiz wird gespeichert');
    expect(status.querySelector('[aria-hidden="true"].personal-note-status-visual')).toHaveTextContent('Speichert .');
  });

  it('opens presentation notes with a compact text button and extended formatting tools',()=>{
    render(<PersonalNotesPanel noteKey={noteKey} label="Präsentationsnotizen" presentation/>);
    const opener=screen.getByRole('button',{name:'Präsentationsnotizen'});
    expect(opener.querySelector('.material-symbols-outlined')).toBeNull();
    fireEvent.click(opener);
    expect(screen.getByRole('toolbar',{name:'Notiz formatieren'})).toBeInTheDocument();
    expect(screen.getByRole('button',{name:'Durchstreichen'})).toBeInTheDocument();
    expect(screen.getByRole('button',{name:'Rechtsbündig'})).toBeInTheDocument();
    expect(screen.getByRole('button',{name:'Einzug vergrößern'})).toBeInTheDocument();
    expect(screen.getByRole('button',{name:'Formatierung entfernen'})).toBeInTheDocument();
  });

  it('limits notes to 5000 characters and shows the counter at the bottom right',()=>{
    render(<PersonalNotesPanel noteKey={noteKey} label="Notizen"/>);
    enter('x'.repeat(5001));
    expect(editor()).toHaveTextContent('x'.repeat(5000));
    expect(screen.getByText('5000/5000')).toBeInTheDocument();
  });
});
