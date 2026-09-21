# Web-Editor Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Einen browserfähigen GottesdienstRegie-Editor für PC, Tablet und Smartphone bereitstellen, ohne die bestehende Electron-Ausgabe oder lokale Desktop-Funktionen zu beschädigen.

**Architecture:** Ein gemeinsamer React-Anwendungskern greift ausschließlich über typisierte Plattformdienste auf Anmeldung, Präsentationen, Medien und Desktopfähigkeiten zu. Electron und Browser erhalten getrennte Adapter; der Browser speichert Präsentationen revisionssicher in Firestore und zeigt nicht verfügbare Desktopfähigkeiten explizit an. Dieser Plan liefert Etappe 1 und 2 des Designs; PWA/Offline-Konfliktauflösung und gekoppelte Fernsteuerung folgen als eigenständig testbare Pläne.

**Tech Stack:** React 19, TypeScript 5.9, Vite 7, Zustand 5, Firebase Auth/Firestore/Storage, Vitest, Testing Library, Playwright, Electron 37.

**Spec:** `docs/superpowers/specs/2026-09-21-web-editor-remote-design.md`

## Global Constraints

- Die Desktop-App bleibt für MAIN, STAGE, Livestream, lokale Geräte, Audio, Videoeingänge, Updates und lokale Übersetzungsmodelle verantwortlich.
- Die erste Browserversion erzeugt keine eigenständige MAIN-, STAGE- oder Livestream-Ausgabe.
- Direkte Zugriffe auf `window.desktop` sind außerhalb des Electron-Adapters und des Electron-Bootstraps verboten.
- Nicht verfügbare Webfunktionen werden erklärt und nicht als wirkungslose Bedienelemente dargestellt.
- Persönliche Notizen werden weder synchronisiert noch in die spätere Fernsteuerung übertragen.
- Präsentationsänderungen dürfen bei Revisionskonflikten niemals still überschrieben werden.
- Web- und Desktopveröffentlichungen verwenden getrennte Release-Kanäle.
- Bestehende Electron-Builds und Desktop-Regressionen müssen nach jeder Aufgabe weiter bestehen.

## Review Focus

- Browser ohne `window.desktop`: Der Editor muss starten, statt mit `DESKTOP_REQUIRED` oder einem undefinierten Methodenaufruf abzubrechen; geprüft in Task 3 und Task 7.
- Abgelaufene oder fehlende Anmeldung: Präsentationsdaten dürfen nicht geladen werden und die Anmeldung muss sichtbar erscheinen; geprüft in Task 4 und Task 6.
- Zwei Editoren mit derselben Basisrevision: Der zweite Speichervorgang muss einen Konflikt liefern und darf die erste Fassung nicht überschreiben; geprüft in Task 5.
- Fehlendes Cloudmedium: Das Element bleibt erhalten und erhält einen verständlichen Preflight-Hinweis; geprüft in Task 8.
- Kleine Smartphone-Breite mit langem Titel und vielen Ablaufpunkten: Navigation und Grundbearbeitung bleiben ohne horizontales Abschneiden erreichbar; geprüft in Task 9.

---

### Task 1: Test- und Browser-Build-Grundlage

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `vite.config.ts`
- Modify: `src/vite-env.d.ts`
- Create: `vitest.config.ts`
- Create: `src/test/setup.ts`
- Create: `playwright.config.ts`
- Create: `tests/smoke/browser-shell.spec.ts`

**Interfaces:**
- Consumes: vorhandener Vite-Einstieg `src/main.tsx`.
- Produces: `npm run test:unit`, `npm run test:web`, `npm run build:web` und die Buildausgabe `dist-web/`.

- [ ] **Step 1: Testwerkzeuge installieren und Skripte definieren**

In `package.json` ergänzen:

```json
{
  "scripts": {
    "build:web": "tsc -b && vite build --mode web --outDir dist-web",
    "test:unit": "vitest run",
    "test:web": "playwright test"
  },
  "devDependencies": {
    "@playwright/test": "^1.55.0",
    "@testing-library/jest-dom": "^6.8.0",
    "@testing-library/react": "^16.3.0",
    "firebase-tools": "^14.12.0",
    "jsdom": "^26.1.0",
    "vitest": "^3.2.4"
  }
}
```

Run: `npm install`

Expected: `package-lock.json` enthält die neuen Testabhängigkeiten ohne Peer-Dependency-Fehler.

Run: `npx playwright install chromium`

Expected: Der von `npm run test:web` benötigte Chromium-Browser ist installiert.

- [ ] **Step 2: Unit-Test-Konfiguration erstellen**

`vitest.config.ts`:

```ts
import {defineConfig} from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins:[react()],
  test:{environment:'jsdom',setupFiles:['src/test/setup.ts'],clearMocks:true}
});
```

`src/test/setup.ts`:

```ts
import '@testing-library/jest-dom/vitest';
Object.defineProperty(window,'matchMedia',{value:()=>({matches:false,addEventListener(){},removeEventListener(){}})});
```

- [ ] **Step 3: Getrennten Web-Build konfigurieren**

`vite.config.ts` erhält einen Modus-basierten Build:

```ts
export default defineConfig(({mode})=>({
  plugins:[react()],
  base:mode==='web'?'/' : './',
  define:{__APP_TARGET__:JSON.stringify(mode==='web'?'web':'desktop')}
}));
```

In `src/vite-env.d.ts` ergänzen:

```ts
declare const __APP_TARGET__:'desktop'|'web';
```

- [ ] **Step 4: Einen zunächst fehlschlagenden Browser-Smoke-Test schreiben**

`tests/smoke/browser-shell.spec.ts`:

```ts
import {test,expect} from '@playwright/test';

test('startet ohne Electron-Bridge',async({page})=>{
  await page.goto('/');
  await expect(page.getByText('GottesdienstRegie').first()).toBeVisible();
  await expect(page.locator('body')).not.toContainText('DESKTOP_REQUIRED');
});
```

`playwright.config.ts` startet `npm run dev:web` auf Port 4173; dafür zusätzlich `"dev:web":"vite --mode web --port 4173"` eintragen.

- [ ] **Step 5: Tests und Builds als Baseline ausführen**

Run: `npm run test:unit && npm run build && npm run build:web`

Expected: Unit-Suite und beide Builds bestehen; der Playwright-Smoke-Test darf bis Task 7 wegen der Desktopkopplung noch fehlschlagen.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json vite.config.ts vitest.config.ts playwright.config.ts src/test/setup.ts src/vite-env.d.ts tests/smoke/browser-shell.spec.ts
git commit -m "test: add web build and browser test foundation"
```

### Task 2: Typisierter Plattformvertrag und Fähigkeitsmodell

**Files:**
- Create: `src/platform/types.ts`
- Create: `src/platform/PlatformServices.ts`
- Create: `src/platform/capabilities.ts`
- Create: `src/platform/PlatformContext.tsx`
- Create: `src/platform/capabilities.test.ts`

**Interfaces:**
- Consumes: `AuthSession`, `LoginResult` aus `src/auth.ts`; `PresentationDocument` aus `src/store.ts`; vorhandene globale Medientypen aus `src/vite-env.d.ts` werden in `types.ts` überführt.
- Produces: `PlatformServices`, `PlatformCapability`, `CapabilityState`, `PlatformProvider`, `usePlatform()`.

- [ ] **Step 1: Den fehlschlagenden Fähigkeitstest schreiben**

```ts
import {describe,it,expect} from 'vitest';
import {webCapabilities} from './capabilities';

describe('webCapabilities',()=>{
  it('erklärt Desktop-Ausgabe statt sie verfügbar zu melden',()=>{
    expect(webCapabilities.outputMain).toEqual({
      availability:'unavailable',
      reason:'MAIN-Ausgabe benötigt die Desktop-App.'
    });
  });
});
```

Run: `npx vitest run src/platform/capabilities.test.ts`

Expected: FAIL, Modul existiert noch nicht.

- [ ] **Step 2: Plattformtypen definieren**

`src/platform/types.ts` definiert:

```ts
export type PlatformTarget='desktop'|'web';
export type CapabilityAvailability='available'|'unavailable'|'disconnected';
export interface CapabilityState{availability:CapabilityAvailability;reason?:string}
export type PlatformCapability='auth'|'presentations'|'media'|'outputMain'|'outputStage'|'outputLivestream'|'updates'|'localTranslation'|'videoInput'|'audioRouting';
export interface SaveResult{summary:PresentationSummary;revision:string}
export class RevisionConflictError extends Error{
  constructor(public readonly local:PresentationDocument,public readonly remote:PresentationDocument){super('REVISION_CONFLICT')}
}
```

Die bereits in `src/vite-env.d.ts` definierten gemeinsam benötigten Typen `PresentationSummary`, `MediaAsset`, `OnlineMediaAsset`, `CloudMediaAsset` und `MediaStorageStatus` werden exportierbar nach `types.ts` verschoben; `vite-env.d.ts` importiert sie nur noch für den Window-Vertrag.

- [ ] **Step 3: Servicevertrag definieren**

`src/platform/PlatformServices.ts` enthält konkrete Schnittstellen:

```ts
export interface AuthService{
  login(email:string,password:string,remember:boolean):Promise<LoginResult>;
  verifyTwoFactor(challengeId:string,code:string,recovery:boolean):Promise<AuthSession>;
  cancelTwoFactor(challengeId:string):Promise<void>;
  restore(activeSession?:boolean):Promise<AuthSession|null>;
  logout():Promise<void>;
}
export interface PresentationService{
  list(options?:{archived?:boolean;trashed?:boolean}):Promise<PresentationSummary[]>;
  load(id:string):Promise<{document:PresentationDocument;revision:string}|null>;
  create(input:{title?:string;date?:string;template?:PresentationDocument}):Promise<{document:PresentationDocument;revision:string}>;
  save(document:PresentationDocument,baseRevision?:string):Promise<SaveResult>;
}
export interface PlatformServices{
  target:PlatformTarget;
  capabilities:Record<PlatformCapability,CapabilityState>;
  auth:AuthService;
  presentations:PresentationService;
  media:MediaService;
  desktop:DesktopOnlyService;
}
```

`MediaService` umfasst `list`, `importFiles`, `remove` und `status`; `DesktopOnlyService` umfasst Ausgabe, Displays, Updates und Betriebssystemaktionen und wirft bei fehlender Fähigkeit `CapabilityUnavailableError`.

- [ ] **Step 4: Context und Fähigkeitskatalog implementieren**

```tsx
const PlatformContext=createContext<PlatformServices|null>(null);
export function PlatformProvider({services,children}:PropsWithChildren<{services:PlatformServices}>){
  return <PlatformContext.Provider value={services}>{children}</PlatformContext.Provider>;
}
export function usePlatform(){
  const value=useContext(PlatformContext);
  if(!value)throw new Error('PLATFORM_PROVIDER_MISSING');
  return value;
}
```

`desktopCapabilities` markiert alles verfügbar; `webCapabilities` markiert Auth, Präsentationen und Cloudmedien verfügbar, lokale Ausgabe/Geräte/Updates/Übersetzungsmodelle mit deutscher Begründung nicht verfügbar.

- [ ] **Step 5: Test ausführen**

Run: `npx vitest run src/platform/capabilities.test.ts`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/platform src/vite-env.d.ts
git commit -m "feat: define cross-platform service contract"
```

### Task 3: Electron-Adapter ohne Verhaltensänderung

**Files:**
- Create: `src/platform/electron/createElectronServices.ts`
- Create: `src/platform/electron/createElectronServices.test.ts`
- Modify: `src/main.tsx`
- Modify: `src/auth.ts`

**Interfaces:**
- Consumes: `PlatformServices` aus Task 2 und die bestehende `window.desktop`-Bridge.
- Produces: `createElectronServices(bridge:NonNullable<Window['desktop']>):PlatformServices`.

- [ ] **Step 1: Adapter-Vertrag als fehlschlagenden Test schreiben**

```ts
it('delegiert Präsentationsspeicherung an Electron',async()=>{
  const save=vi.fn().mockResolvedValue({id:'p1',title:'Test'});
  const services=createElectronServices(fakeBridge({presentation:{save}}));
  const document=blankPresentationDocument('Test');
  await services.presentations.save(document);
  expect(save).toHaveBeenCalledWith(document);
});
```

Run: `npx vitest run src/platform/electron/createElectronServices.test.ts`

Expected: FAIL, Factory fehlt.

- [ ] **Step 2: Electron-Adapter implementieren**

Der Adapter kapselt alle Bridge-Aufrufe. Lokale Präsentationen verwenden `updatedAt` als Revision:

```ts
save:async document=>{
  const summary=await bridge.presentation.save(document) as PresentationSummary;
  return {summary,revision:summary.updatedAt};
}
```

Nicht im gemeinsamen Vertrag benötigte Bridge-Funktionen bleiben zunächst über `desktop` gekapselt, aber niemals direkt in UI-Komponenten.

- [ ] **Step 3: Auth-Helfer auf injizierbaren Dienst umstellen**

`src/auth.ts` enthält nur Typen, Meldungsaufbereitung und Funktionen, die einen `AuthService` annehmen:

```ts
export const loginWith=(auth:AuthService,email:string,password:string,remember:boolean)=>
  auth.login(email.trim().toLowerCase(),password,remember);
```

Direkte `window.desktop`-Zugriffe werden dort entfernt.

- [ ] **Step 4: Desktop-Bootstrap einführen**

In `src/main.tsx`:

```tsx
const services=__APP_TARGET__==='desktop'
  ? createElectronServices(requireDesktopBridge())
  : createWebServices();

createRoot(root).render(
  <React.StrictMode>
    <PlatformProvider services={services}><AppErrorBoundary><App/></AppErrorBoundary></PlatformProvider>
  </React.StrictMode>
);
```

`requireDesktopBridge()` zeigt bei einem fehlerhaften Desktopstart eine klare Meldung; im Webpfad wird die Bridge nie gelesen.

- [ ] **Step 5: Adaptertest, Typecheck und Desktop-Build ausführen**

Run: `npx vitest run src/platform/electron/createElectronServices.test.ts && npm run typecheck && npm run build`

Expected: PASS; Electron-Build erzeugt weiterhin `dist-electron/main.js`.

- [ ] **Step 6: Commit**

```bash
git add src/platform/electron src/main.tsx src/auth.ts
git commit -m "refactor: route desktop services through platform adapter"
```

### Task 4: Browser-Anmeldung

**Files:**
- Create: `src/platform/web/WebAuthService.ts`
- Create: `src/platform/web/WebAuthService.test.ts`
- Modify: `src/firebase.ts`
- Modify: `src/App.tsx`
- Modify: `functions/src/index.ts`
- Create: `functions/src/communityAuth.test.ts`
- Modify: `functions/package.json`
- Modify: `functions/package-lock.json`
- Modify: `database.rules.json`

**Interfaces:**
- Consumes: `AuthService`, `communityAuth`, vorhandene Loginoberfläche, vorhandene serverseitige Passwortprüfung und bestehende 2FA-Aktionen.
- Produces: `createWebAuthService(auth:Auth,endpoint:string):AuthService` und kurzlebige Firebase-Custom-Tokens mit Team-/Rollenclaims.

- [ ] **Step 1: Fehlenden/abgelaufenen Sitzungsfall testen**

```ts
it('liefert nach abgelaufenem Firebase-Token keine Sitzung',async()=>{
  const auth=fakeAuth({currentUser:null});
  const service=createWebAuthService(auth,'http://auth.test');
  await expect(service.restore()).resolves.toBeNull();
});
```

Zusätzlich testen Funktions-/Servicetests:

- ungültige Zugangsdaten ergeben `INVALID_CREDENTIALS`,
- ein 2FA-pflichtiges Konto liefert ausschließlich eine Challenge,
- erst ein gültiger zweiter Faktor erzeugt ein Firebase-Custom-Token,
- abgelaufene oder bereits verwendete Challenges erzeugen kein Token,
- Rolle, Team und Berechtigungen werden serverseitig aus dem aktuellen Benutzerkonto gelesen und niemals aus Clientdaten übernommen.

Run: `npx vitest run src/platform/web/WebAuthService.test.ts`

Expected: FAIL.

- [ ] **Step 2: Web-Auth implementieren**

Die vorhandene HTTPS-Funktion `communityAuth` erhält die Aktionen `web-login`, `web-2fa-verify`, `web-2fa-cancel` und `web-session`. Passwortprüfung, Kontosperre, E-Mailprüfung und Appzugriff bleiben vollständig serverseitig. Bei erforderlicher 2FA speichert die Funktion eine einmal verwendbare Challenge mit UID, Passwort-Hash-Beweis und Ablaufzeit von fünf Minuten unter `webLoginChallenges/{challengeId}`; Security Rules verbieten Clientzugriff auf diesen Pfad. Die Funktionsinstanz ruft dieselben bestehenden GAS-2FA-Aktionen auf wie Electron.

Erst nach erfolgreichem Login beziehungsweise erfolgreicher 2FA-Verifikation erstellt Firebase Admin Auth ein Custom Token:

```ts
const customToken=await getAuth().createCustomToken(uid,{
  teamId:access.teamId,
  gottesdienstRegieRole:access.role,
  gottesdienstRegiePermissions:enabledPermissions(access.permissions)
});
```

Die Challenge wird vor der Antwort atomar als verbraucht markiert. Das Browserpasswort und der Passwort-Hash-Beweis werden niemals an den Client zurückgegeben oder in Firestore geschrieben.

`WebAuthService` sendet Zugangsdaten ausschließlich per HTTPS-POST an diese Funktion und verwendet danach `signInWithCustomToken`, `signOut`, `onIdTokenChanged` und `getIdTokenResult`. Rollen und Berechtigungen werden aus den signierten Claims `gottesdienstRegieRole` und `gottesdienstRegiePermissions` gelesen. Fehlen die Claims, wird `NO_SERVICE_ACCESS` ausgelöst.

```ts
const toSession=async(user:User):Promise<AuthSession>=>{
  const token=await user.getIdTokenResult(true);
  const role=String(token.claims.gottesdienstRegieRole??'');
  if(!role)throw new Error('NO_SERVICE_ACCESS');
  return {user:toSafeUser(user,role),permissions:asStringArray(token.claims.gottesdienstRegiePermissions),expiresAt:Date.parse(token.expirationTime)};
};
```

`verifyTwoFactor` sendet Challenge-ID und Code an `web-2fa-verify`, meldet das zurückgegebene Custom Token bei Firebase an und liefert anschließend die normale `AuthSession`. `cancelTwoFactor` invalidiert die Serverchallenge.

- [ ] **Step 3: Loginoberfläche auf `usePlatform().auth` umstellen**

Alle Aufrufe von `login`, `restore`, `logout`, `verifyTwoFactor` und `cancelTwoFactor` erhalten den Dienst aus dem Context. Die Oberfläche zeigt bei fehlender Sitzung ausschließlich Login/Access-Denied und mountet keine Präsentationsbibliothek.

- [ ] **Step 4: Tests und Builds ausführen**

Run: `npx vitest run src/platform/web/WebAuthService.test.ts functions/src/communityAuth.test.ts && npm run typecheck && npm run build && npm run build:web`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/platform/web/WebAuthService.ts src/platform/web/WebAuthService.test.ts src/firebase.ts src/App.tsx functions/src/index.ts functions/src/communityAuth.test.ts functions/package.json functions/package-lock.json database.rules.json
git commit -m "feat: add authenticated browser sessions"
```

### Task 5: Revisionssicherer Firestore-Präsentationsdienst

**Files:**
- Create: `src/platform/web/FirestorePresentationService.ts`
- Create: `src/platform/web/FirestorePresentationService.test.ts`
- Create: `firestore.rules`
- Create: `firestore.indexes.json`
- Modify: `firebase.json`
- Modify: `src/store.ts`

**Interfaces:**
- Consumes: `PresentationService`, `presentationFirestore`, `PresentationDocument`.
- Produces: `FirestorePresentationService`, Dokumentpfad `teams/{teamId}/presentations/{presentationId}`, atomare Revisionen.

- [ ] **Step 1: Konflikttest mit Firebase-Emulator schreiben**

```ts
it('überschreibt keine neuere Revision',async()=>{
  const first=await service.create({title:'Test'});
  const a=structuredClone(first.document);
  const b=structuredClone(first.document);
  a.title='Editor A';
  const saved=await service.save(a,first.revision);
  b.title='Editor B';
  await expect(service.save(b,first.revision)).rejects.toMatchObject({message:'REVISION_CONFLICT'});
  await expect(service.load(b.presentationId)).resolves.toMatchObject({document:{title:'Editor A'},revision:saved.revision});
});
```

Run: `firebase emulators:exec --only firestore "npx vitest run src/platform/web/FirestorePresentationService.test.ts"`

Expected: FAIL.

- [ ] **Step 2: Cloudschema implementieren**

Gespeicherter Datensatz:

```ts
interface CloudPresentationRecord{
  document:PresentationDocument;
  revision:number;
  teamId:string;
  updatedBy:string;
  updatedAt:Timestamp;
}
```

`save` verwendet `runTransaction`: Record lesen, `revision` mit `baseRevision` vergleichen, bei Abweichung `RevisionConflictError` mit lokaler und entfernter Fassung werfen, sonst Revision um eins erhöhen. `list` lädt nur Metadaten des aktuellen Teams; `load` liefert Dokument plus Stringrevision.

- [ ] **Step 3: Firestore-Regeln definieren**

```text
match /teams/{teamId}/presentations/{presentationId} {
  allow read: if request.auth != null && request.auth.token.teamId == teamId;
  allow create, update: if request.auth != null
    && request.auth.token.teamId == teamId
    && request.auth.token.gottesdienstRegieRole in ['editor','admin'];
  allow delete: if false;
}
```

Rules-Tests prüfen fremdes Team, Viewer-Schreibzugriff und nicht angemeldeten Zugriff.

- [ ] **Step 4: Store um Cloudrevision ergänzen**

`State` erhält `baseRevision?:string`, `loadDocument(document,revision?)` und `markSaved(revision?)`. `presentationDocument` speichert die technische Revision nicht in den fachlichen Dokumentinhalt.

- [ ] **Step 5: Emulator-, Unit- und Buildtests ausführen**

Run: `firebase emulators:exec --only firestore "npx vitest run src/platform/web/FirestorePresentationService.test.ts" && npm run typecheck && npm run build:web`

Expected: PASS; Konfliktfall lässt entfernten Titel unverändert.

- [ ] **Step 6: Commit**

```bash
git add src/platform/web/FirestorePresentationService.ts src/platform/web/FirestorePresentationService.test.ts src/store.ts firestore.rules firestore.indexes.json firebase.json
git commit -m "feat: persist browser presentations with revisions"
```

### Task 6: Browser-Medienzugriff und Preflight

**Files:**
- Create: `src/platform/web/WebMediaService.ts`
- Create: `src/platform/web/WebMediaService.test.ts`
- Create: `src/media/mediaAvailability.ts`
- Create: `src/media/mediaAvailability.test.ts`
- Modify: `src/MediaBrowser.tsx`
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: `MediaService`, `presentationStorage`, `MediaAsset`, `PresentationDocument`.
- Produces: `createWebMediaService(storage,auth)`, `findMissingMedia(document,availableIds)`.

- [ ] **Step 1: Fehlendes-Medium-Test schreiben**

```ts
it('meldet fehlende Cloudmedien ohne das Element zu entfernen',()=>{
  const document=fixtureWithImage('cloud://team/a.jpg','asset-a');
  const warnings=findMissingMedia(document,new Set());
  expect(warnings).toEqual([{assetId:'asset-a',itemTitle:'Willkommen',slideTitle:'Folie 1'}]);
  expect(document.items[0].slides[0].elements).toHaveLength(1);
});
```

Run: `npx vitest run src/media/mediaAvailability.test.ts`

Expected: FAIL.

- [ ] **Step 2: Web-Mediendienst implementieren**

Der Dienst listet Metadaten unter `teams/{teamId}/media`, lädt Browserdateien mit `uploadBytesResumable` hoch und gibt Fortschritt über einen Callback zurück. Er akzeptiert nur die bereits unterstützten Bild-, Video-, Audio- und PDF-MIME-Typen und lehnt Dateien über dem konfigurierten Limit vor dem Upload ab.

```ts
importFiles(files:File[],onProgress:(value:{fileName:string;percent:number})=>void):Promise<MediaAsset[]>
```

Lokale `file://`- oder Windows-Pfade werden im Browser als nicht verfügbar markiert und niemals an `fetch` übergeben.

- [ ] **Step 3: Medienbrowser auf den Plattformdienst umstellen**

`MediaBrowser.tsx` verwendet `platform.media`; im Web öffnet ein verstecktes `<input type="file" multiple>` die Auswahl. Desktop behält den bestehenden nativen Dialog über den Electron-Adapter.

- [ ] **Step 4: Preflight-Warnung integrieren**

Vor Vorschau und Speichern wird `findMissingMedia` ausgeführt. Jede Warnung verlinkt das betreffende ServiceItem; der Benutzer kann weiter bearbeiten, aber keine falsche Verfügbarkeit wird angezeigt.

- [ ] **Step 5: Tests und Builds ausführen**

Run: `npx vitest run src/platform/web/WebMediaService.test.ts src/media/mediaAvailability.test.ts && npm run typecheck && npm run build && npm run build:web`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/platform/web/WebMediaService.ts src/platform/web/WebMediaService.test.ts src/media src/MediaBrowser.tsx src/App.tsx
git commit -m "feat: support cloud media in browser editor"
```

### Task 7: AppShell vollständig von direkten Electron-Aufrufen trennen

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/FileMenu.tsx`
- Modify: `src/ProductionWorkspace.tsx`
- Modify: `src/RemoteCenter.tsx`
- Create: `src/platform/CapabilityNotice.tsx`
- Create: `src/platform/CapabilityNotice.test.tsx`

**Interfaces:**
- Consumes: `usePlatform()`, Fähigkeitszustände, Electron- und Webadapter.
- Produces: gemeinsame UI ohne direkten `window.desktop`-Zugriff.

- [ ] **Step 1: AST-Grenztest schreiben**

`src/platform/noDirectDesktopAccess.test.ts` scannt `src` und erlaubt `window.desktop` ausschließlich unter `src/platform/electron/` und im Bootstrap-Helfer:

```ts
it('hält UI frei von direkten Electron-Zugriffen',()=>{
  const offenders=findDesktopReferences('src').filter(path=>!path.includes('platform/electron'));
  expect(offenders).toEqual([]);
});
```

Run: `npx vitest run src/platform/noDirectDesktopAccess.test.ts`

Expected: FAIL mit den aktuellen Fundstellen.

- [ ] **Step 2: Präsentations-, Medien- und Auth-Aufrufe migrieren**

Jeder betroffene UI-Bereich bezieht `const platform=usePlatform()`. Präsentationsbibliothek, Autosave, Import, Export und Profil verwenden die gemeinsamen Dienste. Desktop-exklusive Befehle werden über `platform.desktop` aufgerufen.

- [ ] **Step 3: Fähigkeitsanzeige ergänzen**

```tsx
export function CapabilityNotice({capability}:{capability:PlatformCapability}){
  const state=usePlatform().capabilities[capability];
  return state.availability==='available'?null:<div role="note" className="capability-notice">{state.reason}</div>;
}
```

Im Web zeigen Anzeige-, Update-, Audio- und Videoeingangseiten diesen Hinweis und deaktivieren zugehörige Mutationen. Die Bereiche verschwinden nicht kommentarlos.

- [ ] **Step 4: Alle restlichen Direktzugriffe migrieren**

`rg -n "window\.desktop" src` darf nur Adapter/Bootstrap und die globale Typdeklaration finden. Ausgabe-Subscriptions geben im Web No-op-Unsubscribe-Funktionen zurück.

- [ ] **Step 5: Browser-Smoke-Test und Desktop-Regression ausführen**

Run: `npx vitest run src/platform/noDirectDesktopAccess.test.ts src/platform/CapabilityNotice.test.tsx && npm run build && npm run build:web && npm run test:web`

Expected: PASS; Browser startet ohne Electron-Bridge, Desktop baut unverändert.

- [ ] **Step 6: Commit**

```bash
git add src/App.tsx src/FileMenu.tsx src/ProductionWorkspace.tsx src/RemoteCenter.tsx src/platform
git commit -m "refactor: decouple editor UI from Electron bridge"
```

### Task 8: Browser-Präsentationsbibliothek und Autosave-Konfliktoberfläche

**Files:**
- Create: `src/presentations/PresentationLibraryPage.tsx`
- Create: `src/presentations/SaveConflictDialog.tsx`
- Create: `src/presentations/SaveConflictDialog.test.tsx`
- Create: `src/presentations/usePresentationAutosave.ts`
- Create: `src/presentations/usePresentationAutosave.test.tsx`
- Modify: `src/App.tsx`
- Modify: `src/styles.css`

**Interfaces:**
- Consumes: `PresentationService`, Store `baseRevision`, `RevisionConflictError`.
- Produces: Browserbibliothek, 15-Sekunden-Autosave, sichtbare Konfliktentscheidung.

- [ ] **Step 1: Konfliktdialog-Test schreiben**

```tsx
it('bietet beide Fassungen an und überschreibt nicht automatisch',()=>{
  render(<SaveConflictDialog local={local} remote={remote} onChoose={choose}/>);
  expect(screen.getByText('Meine Änderungen')).toBeVisible();
  expect(screen.getByText('Cloud-Fassung')).toBeVisible();
  expect(choose).not.toHaveBeenCalled();
});
```

Run: `npx vitest run src/presentations/SaveConflictDialog.test.tsx`

Expected: FAIL.

- [ ] **Step 2: Autosave-Hook implementieren**

`usePresentationAutosave` speichert höchstens alle 15 Sekunden, niemals parallel und nur bei `dirty`. Erfolg aktualisiert die Basisrevision. `RevisionConflictError` öffnet den Dialog; andere Fehler setzen `saveState:'error'` und zeigen eine erneute Aktion.

- [ ] **Step 3: Konfliktentscheidungen implementieren**

Optionen:

- „Cloud-Fassung öffnen“ lädt die Remote-Fassung.
- „Meine Fassung als Kopie sichern“ erstellt eine neue Präsentation mit Titelzusatz „(Konfliktkopie)“.
- „Abbrechen“ lässt den lokalen Zustand dirty und speichert nicht.

Es gibt bewusst keinen Knopf, der die Remote-Fassung ohne neue Revision blind überschreibt.

- [ ] **Step 4: Bibliothek anbinden**

Die Bibliothek listet Titel, Datum, Aktualisierungszeit und Archivstatus. Erstellen und Öffnen verwenden `platform.presentations`. Ein abgelaufener Login führt zurück zur Anmeldung, ohne den lokalen Store als gespeichert zu markieren.

- [ ] **Step 5: Tests und Builds ausführen**

Run: `npx vitest run src/presentations && npm run typecheck && npm run build && npm run build:web`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/presentations src/App.tsx src/styles.css
git commit -m "feat: add web presentation library and safe autosave"
```

### Task 9: Responsive PC-, Tablet- und Smartphone-Oberflächen

**Files:**
- Create: `src/responsive/useWorkspaceLayout.ts`
- Create: `src/responsive/MobileWorkspaceNav.tsx`
- Create: `src/responsive/useWorkspaceLayout.test.ts`
- Modify: `src/App.tsx`
- Modify: `src/ProductionWorkspace.tsx`
- Create: `src/web-editor.css`
- Modify: `src/main.tsx`
- Modify: `tests/smoke/browser-shell.spec.ts`

**Interfaces:**
- Consumes: gemeinsame Editorzustände und Plattformziel.
- Produces: `WorkspaceLayout='desktop'|'tablet'|'phone'`, touchfähige Navigation.

- [ ] **Step 1: Breakpointtest schreiben**

```ts
it.each([[1440,'desktop'],[900,'tablet'],[390,'phone']] as const)(
  'ordnet %ipx %s zu',(width,expected)=>expect(layoutForWidth(width)).toBe(expected)
);
```

Run: `npx vitest run src/responsive/useWorkspaceLayout.test.ts`

Expected: FAIL.

- [ ] **Step 2: Layoutlogik und Navigation implementieren**

Breakpoints: Phone bis 599 px, Tablet 600–1099 px, Desktop ab 1100 px. Phone startet in „Steuerung“, bietet aber getrennte Tabs „Ablauf“, „Song“, „Folie“, „Vorschau“. Canvas-Design zeigt eine Einschränkung, Grundtext, Folienfolge und Songablauf bleiben editierbar.

- [ ] **Step 3: Responsive CSS implementieren**

`web-editor.css` verwendet mindestens 44×44 px Touchziele, Safe-Area-Inset, fokussichtbare Navigation und keine feste Mindestbreite des Desktoparbeitsbereichs. Lange Titel verwenden `min-width:0`, Ellipsis und zugänglichen Volltext per `title`.

- [ ] **Step 4: Playwright-Tests für drei Größen ergänzen**

```ts
for(const viewport of [{name:'pc',width:1440,height:900},{name:'tablet',width:900,height:1100},{name:'phone',width:390,height:844}]){
  test(`${viewport.name} editor navigation`,async({page})=>{
    await page.setViewportSize(viewport);
    await loginWithTestSession(page);
    await page.getByText('Sehr langer Präsentationstitel für den responsiven Test').click();
    await expect(page.getByRole('navigation',{name:'Arbeitsbereiche'})).toBeVisible();
    await expect(page.locator('body')).toHaveJSProperty('scrollWidth',viewport.width);
  });
}
```

- [ ] **Step 5: Unit-, Browser- und Desktoptests ausführen**

Run: `npx vitest run src/responsive && npm run build && npm run build:web && npm run test:web`

Expected: PASS in allen drei Viewports; Desktop-Build bleibt grün.

- [ ] **Step 6: Commit**

```bash
git add src/responsive src/App.tsx src/ProductionWorkspace.tsx src/web-editor.css src/main.tsx tests/smoke/browser-shell.spec.ts
git commit -m "feat: add responsive web editor layouts"
```

### Task 10: Hosting, Sicherheitsprüfung und interner Vorschaukanal

**Files:**
- Modify: `firebase.json`
- Create: `.github/workflows/web-editor.yml`
- Create: `docs/web-editor-operations.md`
- Modify: `README.md`
- Modify: `RELEASE_NOTES.md`
- Modify: `SECURITY.md`

**Interfaces:**
- Consumes: `dist-web/`, Firestore-/Storage-Regeln, bestehendes GitHub-Repository.
- Produces: internen Vorschaukanal für Abnahmen; noch keinen öffentlichen stabilen Web-Produktionskanal.

- [ ] **Step 1: Hosting lokal konfigurieren**

`firebase.json` ergänzt:

```json
{
  "hosting": {
    "public": "dist-web",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "rewrites": [{"source":"**","destination":"/index.html"}],
    "headers": [{"source":"**","headers":[
      {"key":"Content-Security-Policy","value":"default-src 'self'; connect-src 'self' https://*.googleapis.com wss://*.firebaseio.com; img-src 'self' data: blob: https:; media-src 'self' blob: https:; style-src 'self' 'unsafe-inline'; script-src 'self'"},
      {"key":"X-Content-Type-Options","value":"nosniff"},
      {"key":"Referrer-Policy","value":"strict-origin-when-cross-origin"}
    ]}]
  }
}
```

- [ ] **Step 2: CI-Workflow erstellen**

Der Workflow führt in dieser Reihenfolge `npm ci`, `npm run test:unit`, `npm run build`, `npm run build:web`, `npm run test:web` und Firebase-Rules-Tests aus. Pull Requests erhalten ausschließlich einen zeitlich begrenzten Preview-Kanal. Ein öffentlicher Produktions-Deploy ist in diesem Workflow absichtlich nicht enthalten, weil Sperren, Offlinekonflikte und gekoppelte Fernsteuerung erst in den Folgeplänen abgesichert werden.

- [ ] **Step 3: Betriebs- und Sicherheitsdokumentation schreiben**

`docs/web-editor-operations.md` dokumentiert Konfiguration, Custom Claims, Preview, Ablauf eines Preview-Kanals, bekannte Desktop-only-Fähigkeiten und Diagnose ohne Zugangsdaten. `SECURITY.md` ergänzt Meldung verlorener Sitzungen und Cloudberechtigungen. README und Release Notes kennzeichnen den Stand ausdrücklich als interne Webvorschau, nicht als fertige Webversion.

- [ ] **Step 4: Vollständige Verifikation ausführen**

Run:

```bash
npm run test:unit
npm run typecheck
npm run build
npm run build:web
npm run test:web
firebase emulators:exec --only firestore "npx vitest run src/platform/web/FirestorePresentationService.test.ts"
```

Expected: alle Befehle Exitcode 0; `dist/`, `dist-electron/` und `dist-web/` werden erzeugt.

- [ ] **Step 5: Manuelle Abnahme durchführen**

Prüfliste:

- Browser ohne Electron-Bridge anmelden, Präsentation öffnen, Songtext ändern, speichern, neu laden.
- Dieselbe Präsentation in einem zweiten Browser öffnen und Revisionskonflikt auslösen.
- Fehlendes Medium prüfen; Element bleibt bestehen und Preflight warnt.
- PC, Tablet und Smartphone testen; Smartphone kann Ablauf, Song und Grundfolie bearbeiten.
- Desktop-App starten, Präsentation öffnen, Vorschau und bestehende MAIN-Ausgabe testen.
- Web-Anzeige-, Update- und Geräteeinstellungen erklären ihre Nichtverfügbarkeit.

- [ ] **Step 6: Commit**

```bash
git add firebase.json .github/workflows/web-editor.yml docs/web-editor-operations.md README.md RELEASE_NOTES.md SECURITY.md
git commit -m "ci: add secured web editor preview channel"
```

## Folgepläne

Nach erfolgreicher Abnahme dieses Plans werden zwei getrennte Pläne erstellt und freigegeben. Erst wenn beide umgesetzt und gemeinsam verifiziert sind, wird ein öffentlicher stabiler Web-Produktionskanal ergänzt:

1. `web-pwa-offline-sync`: Service Worker, Offlinewarteschlange, 30-Sekunden-Lock-Heartbeat, 120-Sekunden-Ablauf, Sperrübernahme und Wiederherstellungshistorie.
2. `web-desktop-remote-control`: kurzlebiger QR-/Zahlencode, Desktopbestätigung, Rechte, Sitzungswiderruf, monotone Befehlsnummern, höchstens-einmal-Ausführung und bestätigter Current/Next-Zustand.

Diese Trennung verhindert, dass Offlinekonflikte und Live-Steuerung gleichzeitig mit der grundlegenden Plattformmigration eingeführt werden.
