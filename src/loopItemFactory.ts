import {
  WEATHER_SCREEN_DURATION_MS,
  WEATHER_SCREEN_URL,
  type LoopItemType,
} from './loopDomain';

export interface LoopItemDraft {
  type: LoopItemType;
  title: string;
  sectionId: string;
  body: string;
  metadata: Record<string, string | number | boolean>;
  durationMs: number;
}

const titles: Record<LoopItemType, string> = {
  announcement: 'Meldungen',
  birthday: 'Geburtstage',
  event: 'Veranstaltungen',
  weather: 'Wetter',
  loopQuiz: 'Loop-Quiz',
  loopCountdown: 'Loop-Countdown',
  clock: 'Uhrzeit',
  bibleVerse: 'Bibelvers',
  loopQr: 'QR-Code',
  infoCard: 'Infokarte',
  today: 'Heute bei uns',
  nextEvents: 'Nächste Termine',
};

export function createLoopItem(
  type: LoopItemType,
  sectionId: string,
  _now = Date.now(),
  input: { body?: string; url?: string } = {},
): LoopItemDraft {
  const durationMs = type === 'weather' ? WEATHER_SCREEN_DURATION_MS : 15_000;
  let body = input.body ?? '';
  const metadata: Record<string, string | number | boolean> = {
    source: ['announcement', 'birthday', 'event'].includes(type) ? 'firebase' : 'local',
  };
  if (type === 'weather') {
    metadata.weatherScreenUrl = WEATHER_SCREEN_URL;
    metadata.weatherDurationMs = durationMs;
    body ||= 'Wetterscreen · empfohlen: 20 Sekunden';
  } else if (type === 'loopQr') {
    metadata.url = input.url ?? body;
    body ||= input.url ?? '';
  } else if (type === 'loopQuiz') {
    body ||= 'Frage\n\nA  Antwort 1\nB  Antwort 2\nC  Antwort 3';
    metadata.questionDurationMs = 8_000;
  } else if (type === 'clock') {
    metadata.format = 'HH:mm:ss';
    body ||= 'Aktuelle Uhrzeit';
  }
  return { type, title: titles[type], sectionId, body, metadata, durationMs };
}

const insertionGuards = new Map<string, number>();

export function consumeInsertionGuard(key: string, now = Date.now(), windowMs = 400): boolean {
  const previous = insertionGuards.get(key) ?? Number.NEGATIVE_INFINITY;
  if (now - previous < windowMs) return false;
  insertionGuards.set(key, now);
  return true;
}

export function resetInsertionGuards(): void {
  insertionGuards.clear();
}
