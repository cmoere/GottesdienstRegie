import type {CapabilityState,PlatformCapability} from './types';

const available:CapabilityState={availability:'available'};
const unavailable=(reason:string):CapabilityState=>({availability:'unavailable',reason});

export const desktopCapabilities:Record<PlatformCapability,CapabilityState>={
  auth:available,presentations:available,media:available,spotify:available,outputMain:available,outputStage:available,
  outputLivestream:available,updates:available,localTranslation:available,localAi:available,videoInput:available,audioRouting:available
};

export const webCapabilities:Record<PlatformCapability,CapabilityState>={
  auth:available,presentations:available,media:available,spotify:unavailable('Spotify-Verknüpfung benötigt die Desktop-App.'),
  outputMain:unavailable('MAIN-Ausgabe benötigt die Desktop-App.'),
  outputStage:unavailable('STAGE-Ausgabe benötigt die Desktop-App.'),
  outputLivestream:unavailable('Livestream-Ausgabe benötigt die Desktop-App.'),
  updates:unavailable('Programmaktualisierungen werden von der Desktop-App verwaltet.'),
  localTranslation:unavailable('Lokale Übersetzungsmodelle benötigen die Desktop-App.'),
  localAi:unavailable('Lokale KI wird von diesem Browser nicht unterstützt. Bitte verwende die Desktop-App.'),
  videoInput:unavailable('Videoeingänge benötigen die Desktop-App.'),
  audioRouting:unavailable('Audio-Routing benötigt die Desktop-App.')
};
