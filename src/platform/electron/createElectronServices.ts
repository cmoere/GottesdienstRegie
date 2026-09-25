import type {PresentationDocument} from '../../store';
import type {PlatformServices} from '../PlatformServices';
import {desktopCapabilities} from '../capabilities';
import type {PresentationSummary} from '../types';

export function createElectronServices(bridge:NonNullable<Window['desktop']>):PlatformServices{
  return {
    target:'desktop',
    capabilities:desktopCapabilities,
    auth:{
      login:(email,password,remember)=>bridge.auth.login(email,password,remember),
      verifyTwoFactor:(challengeId,code,recovery)=>bridge.auth.verifyTwoFactor(challengeId,code,recovery),
      cancelTwoFactor:async challengeId=>{await bridge.auth.cancelTwoFactor(challengeId)},
      restore:active=>((bridge.auth.restore as (active?:boolean)=>ReturnType<typeof bridge.auth.restore>)(active)),
      logout:async()=>{await bridge.auth.logout()}
    },
    presentations:{
      list:options=>bridge.presentation.list(options),
      load:async id=>{
        const document=await bridge.presentation.load(id) as PresentationDocument|null;
        return document?{document,revision:document.updatedAt}:null;
      },
      create:async input=>{
        const document=await bridge.presentation.create(input) as PresentationDocument;
        return {document,revision:document.updatedAt};
      },
      save:async document=>{
        const summary=await bridge.presentation.save(document) as PresentationSummary;
        return {summary,revision:summary.updatedAt};
      }
    },
    media:{
      list:()=>bridge.media.list(),
      importFiles:async(_files,onProgress)=>{
        const assets=await bridge.media.import();
        assets.forEach(asset=>onProgress?.(100,asset.fileName));
        return assets;
      },
      remove:id=>bridge.media.remove(id),
      markUsed:id=>bridge.media.markUsed(id),
      status:()=>bridge.media.onlineStatus()
    },
    desktop:{
      displays:()=>bridge.displays(),
      identifyDisplays:assignments=>bridge.identifyDisplays(assignments),
      preflight:(assignments,presentation)=>bridge.preflight(assignments,presentation),
      goOnAir:(assignments,payload)=>bridge.goOnAir(assignments,payload),
      goOffAir:()=>bridge.goOffAir(),
      sendLiveSlide:payload=>bridge.sendLiveSlide(payload),
      openExternal:url=>bridge.openExternal(url),
      updates:{
        currentVersion:()=>bridge.updates.currentVersion(),
        check:()=>bridge.updates.check(),
        download:()=>bridge.updates.download(),
        install:()=>bridge.updates.install()
      }
    }
  };
}
