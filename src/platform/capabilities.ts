import type {CapabilityState,PlatformCapability} from './types';

const available:CapabilityState={availability:'available'};
const unavailable=(reason:string):CapabilityState=>({availability:'unavailable',reason});

export const desktopCapabilities:Record<PlatformCapability,CapabilityState>={
  auth:available,presentations:available,media:available,outputMain:available,outputStage:available,
  outputLivestream:available,updates:available,localTranslation:available,videoInput:available,audioRouting:available
};

export const webCapabilities:Record<PlatformCapability,CapabilityState>={
  auth:available,presentations:available,media:available,
  outputMain:unavailable('MAIN-Ausgabe benötigt die Desktop-App.'),
  outputStage:unavailable('STAGE-Ausgabe benötigt die Desktop-App.'),
  outputLivestream:unavailable('Livestream-Ausgabe benötigt die Desktop-App.'),
  updates:unavailable('Programmaktualisierungen werden von der Desktop-App verwaltet.'),
  localTranslation:unavailable('Lokale Übersetzungsmodelle benötigen die Desktop-App.'),
  videoInput:unavailable('Videoeingänge benötigen die Desktop-App.'),
  audioRouting:unavailable('Audio-Routing benötigt die Desktop-App.')
};
