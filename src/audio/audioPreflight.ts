import {formatRegionalTemplate as sourceCopy} from '../../shared/regional/validation';
import type {BackgroundAudioHealth} from './backgroundAudioHealth';
export function audioPreflight(health:BackgroundAudioHealth|undefined,copy=sourceCopy){return{warnings:!health?[copy("AudioEngine-Diagnose ist noch nicht verfügbar.")]:health.status==='output-unavailable'?[copy("Der konfigurierte Background-Audio-Ausgang ist nicht verfügbar.")]:health.status==='stream-error'?[copy("Background Audio meldet einen Streamfehler.")]:[]}}
