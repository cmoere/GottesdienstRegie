import {expect,it} from 'vitest';
import {prepareGermanSpeech} from './prepareGermanSpeech';

it('speaks calendar dates, weekdays and clock times before sentence segmentation',()=>{
 expect(prepareGermanSpeech('So., 25.10.2026 um 12:30 Uhr.')).toBe('Sonntag, der fünfundzwanzigste Oktober zweitausendsechsundzwanzig um zwölf Uhr dreißig.');
 expect(prepareGermanSpeech('Am 01.01.2027 um 09:00 Uhr.')).toBe('Am ersten Januar zweitausendsiebenundzwanzig um neun Uhr.');
 expect(prepareGermanSpeech('Beginn: 2026-10-25.')).toBe('Beginn: der fünfundzwanzigste Oktober zweitausendsechsundzwanzig.');
 expect(prepareGermanSpeech('Der 25.10.2026 ist ein Sonntag.')).toBe('Der fünfundzwanzigste Oktober zweitausendsechsundzwanzig ist ein Sonntag.');
});
it('retains invalid dates and version numbers instead of inventing calendar values',()=>{
 for(const text of ['31.02.2026','29.02.2025','25:90 Uhr','Version 1.10.2026','v1.10.2026','0.91.0','3.14'])expect(prepareGermanSpeech(text)).toBe(text);
 expect(prepareGermanSpeech('Am 29.02.2028.')).toBe('Am neunundzwanzigsten Februar zweitausendachtundzwanzig.');
});
it('handles date ranges with and without a year without changing the original record',()=>{
 expect(prepareGermanSpeech('Vom 14.04.2026 bis zum 08.12.2026.')).toBe('Vom vierzehnten April zweitausendsechsundzwanzig bis zum achten Dezember zweitausendsechsundzwanzig.');
 expect(prepareGermanSpeech('Zeitraum 14.04.–08.12.')).toBe('Zeitraum der vierzehnte April bis zum achten Dezember');
 expect(prepareGermanSpeech('Mo., 01.06.2026, 18:05–20:00 Uhr')).toBe('Montag, der erste Juni zweitausendsechsundzwanzig, achtzehn Uhr fünf bis zwanzig Uhr');
});
