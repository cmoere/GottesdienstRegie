import {uiIcons} from '../shared/uiIcons';
import {dominantFrameColors} from '../shared/dominantFrameColors';
import {nativeBaseTemplates,type NativeRegionalTextKey} from '../shared/regional/nativeBase';
import {annotationColors} from '../shared/liveAnnotations';
const escapeHtml=(value:string)=>value.replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]!));
function icon(name: string) {
 const nodes = Object.hasOwn(uiIcons, name) ? uiIcons[name] : uiIcons.help;
 const children = nodes.map(([tag, attributes]) => {
   const serialized = Object.entries(attributes)
     .filter(([key, value]) => key !== 'key' && value !== undefined)
     .map(([key, value]) => key + '="' + escapeHtml(String(value)) + '"')
     .join(' ');
   return '<' + tag + ' ' + serialized + '/>';
 }).join('');
 return '<svg class="ui-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">'+children+'</svg>';
}
export function remotePage(kind:'monitor'|'remote',name:string,language:'de'|'en',token:string,copy:(key:NativeRegionalTextKey)=>string=key=>nativeBaseTemplates[key]){
 const labels=language==='de'?{current:copy('remoteCurrent'),next:copy('remoteNext'),waiting:copy('remoteWaiting'),lost:copy('remoteLost'),previous:copy('remotePrevious'),advance:copy('remoteAdvance'),draw:copy('remoteDraw'),clear:copy('remoteClear'),notes:copy('remoteNotes'),order:copy('remoteOrder'),start:copy('remoteStart')}:{"current":"Current","next":"Up next","waiting":"Waiting for presentation …","lost":"Connection lost","previous":"Previous","advance":"Next","draw":"Annotate","clear":"Clear annotations","notes":"Notes","order":"Order of service","start":"Starts in"};
 Object.assign(labels,language==='de'?{pen:copy('remoteToolPen'),line:copy('remoteToolLine'),arrow:copy('remoteToolArrow'),rectangle:copy('remoteToolRectangle'),ellipse:copy('remoteToolEllipse'),thickness:copy('remoteToolThickness'),fullscreen:copy('remoteFullscreen'),shareStart:copy('remoteShareStart'),shareStop:copy('remoteShareStop'),shareWaiting:copy('remoteShareWaiting'),shareUnsupported:copy('remoteShareUnsupported'),shareSecure:copy('remoteShareSecure'),shareError:copy('remoteShareError'),nextWaiting:copy('remoteNextWaiting')}:{pen:'Pen',line:'Line',arrow:'Arrow',rectangle:'Rectangle',ellipse:'Ellipse',thickness:'Line thickness',fullscreen:'Fullscreen',shareStart:'Share screen',shareStop:'Stop sharing',shareWaiting:'Waiting for the operator.',shareUnsupported:'This browser does not support screen sharing. Use a supported desktop browser.',shareSecure:'Screen sharing requires the encrypted HTTPS connection.',shareError:'Screen sharing could not connect.',nextWaiting:'No next slide prepared yet.'});
 Object.assign(labels,language==='de'
   ? {connecting:copy('remoteConnecting'),connected:copy('remoteConnected'),pending:copy('remotePending'),unconfirmed:copy('remoteUnconfirmed'),commandError:copy('remoteCommandError')}
   : {connecting:'Connecting …',connected:'Connected',pending:'Changing slide …',unconfirmed:'Slide change not confirmed.',commandError:'Could not send command.'});
 const colorNames=language==='de'
   ? [copy('remoteRed'),copy('remoteGreen'),copy('remoteWhite'),copy('remoteBlack'),copy('remoteYellow'),copy('remoteBlue'),copy('remotePurple'),copy('remoteOrange'),copy('remotePink'),copy('remoteCyan')]
   : ['Red','Green','White','Black','Yellow','Blue','Purple','Orange','Pink','Cyan'];
 const exitFullscreen=language==='de'?copy('remoteExitFullscreen'):'Exit fullscreen';
 const viewLabels=language==='de'
  ? {title:copy('remoteViewTitle'),lighting:copy('remoteViewLighting'),column:copy('remoteViewColumn'),grid:copy('remoteViewGrid'),mirror:copy('remoteViewMirror'),pair:copy('remoteViewPair'),theme:copy('remoteViewTheme'),system:copy('remoteViewDevice'),light:copy('remoteViewLight'),dark:copy('remoteViewDark'),captions:copy('remoteViewCaptions'),close:copy('remoteViewClose'),offAir:copy('remoteLightingOffAir'),color:copy('remoteLightingColor'),analyzing:copy('remoteLightingAnalyzing'),single:copy('remoteLightingSingle')}
  : {title:'View',lighting:'Lighting Operator',column:'Current slide · four previews on the right',grid:'Current slide · preview grid',mirror:'Large current slide',pair:'Current and next slide',theme:'Appearance',system:'Device mode',light:'Light',dark:'Dark',captions:'Show slide titles',close:'Close',offAir:'The display starts when the operator goes ON AIR.',color:'Main color',analyzing:'Waiting for output image',single:'No second main color'};
 const extraPreviews=Array.from({length:3},(_,index)=>{
  const slot=index+1;
  return `<div class="upcoming-preview" id="upcoming-${slot}" hidden><p class="slide-caption" id="next-caption-${slot}"></p><div class="next-frame"><img id="next-mirror-${slot}" alt="${escapeHtml(labels.next)} ${slot+1}" hidden></div><p class="next-text" id="next-text-${slot}"></p></div>`;
 }).join('');
 const swatches=annotationColors.map((color,index)=>`<button type="button" class="swatch" data-color="${color}" style="--swatch:${color}" aria-pressed="${index===0}" aria-label="${escapeHtml(colorNames[index])}" title="${escapeHtml(colorNames[index])}"><span aria-hidden="true"></span></button>`).join('');
 const safeLabels=Object.fromEntries(Object.entries(labels).map(([id,text])=>[id,escapeHtml(text)]));
 return `<!doctype html><html lang="${language}" data-theme="dark"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="referrer" content="no-referrer"><title>${escapeHtml(name)} · GottesdienstRegie</title>
 <style>
 :root{color-scheme:light dark;--page:#11161b;--card:#1d252d;--control:#293640;--text:#f4f7f8;--muted:#bfccd2;--border:#52636d;--accent:#aacbd5;--selected:#c5e3a7;--selected-text:#1a3110;--error:#ffb5ae}
 @media(prefers-color-scheme:light){:root{--page:#eef2f4;--card:#fff;--control:#edf3f5;--text:#18252d;--muted:#405865;--border:#889ca5;--accent:#315967;--selected:#dcebd0;--selected-text:#253c18;--error:#8e271e}}
 :root[data-theme=light]{color-scheme:light;--page:#eef2f4;--card:#fff;--control:#edf3f5;--text:#18252d;--muted:#405865;--border:#889ca5;--accent:#315967;--selected:#dcebd0;--selected-text:#253c18;--error:#8e271e}
 :root[data-theme=dark]{color-scheme:dark;--page:#11161b;--card:#1d252d;--control:#293640;--text:#f4f7f8;--muted:#bfccd2;--border:#52636d;--accent:#aacbd5;--selected:#c5e3a7;--selected-text:#1a3110;--error:#ffb5ae}
 *{box-sizing:border-box}
 body{max-width:92rem;margin:0 auto;background:var(--page);color:var(--text);font:16px system-ui,sans-serif;padding:max(12px,env(safe-area-inset-top)) max(12px,env(safe-area-inset-right)) max(12px,env(safe-area-inset-bottom)) max(12px,env(safe-area-inset-left))}
 header,.header-actions,.status-row,.tool-row{display:flex;align-items:center;flex-wrap:wrap;gap:10px}
 header{justify-content:space-between;padding:8px 0 18px}
 h1{font-size:clamp(20px,4vw,28px);margin:0 0 8px;overflow-wrap:anywhere}
 #clock{font-size:clamp(20px,4vw,28px);font-weight:650;font-variant-numeric:tabular-nums}
 #countdown{color:var(--muted);font-variant-numeric:tabular-nums}
 #status,#live-status{display:inline-flex;align-items:center;gap:6px;padding:4px 10px;border-radius:999px;background:var(--control);font-size:14px}
 #status::before{content:'';width:8px;height:8px;border-radius:50%;background:currentColor}
 #status[data-state=connected],#live-status[data-live=true]{background:var(--selected);color:var(--selected-text)}
 #status[data-state=lost],#command-status[data-error=true]{color:var(--error)}
 #status[data-state=loading]::before{background:none;border:2px solid currentColor;border-right-color:transparent;animation:spin .8s linear infinite}
 @keyframes spin{to{transform:rotate(360deg)}}
 @media(prefers-reduced-motion:reduce){#status[data-state=loading]::before{animation:none}}
 main{display:grid;grid-template-columns:minmax(0,2fr) minmax(0,1fr);gap:12px;align-items:start}
 main:has(>section[hidden]),body[data-layout=mirror] main{grid-template-columns:minmax(0,1fr)}
 body[data-layout=mirror] #next-card{display:none}
 body[data-profile=lighting]{max-width:none}
 body[data-layout=lighting] main{grid-template-columns:minmax(0,3fr) minmax(240px,1fr)}
 body[data-layout=lighting-grid] main{grid-template-columns:minmax(0,3fr) minmax(0,2fr)}
 .next-preview-list{display:grid;gap:12px}
 body[data-layout=lighting] .next-preview-list{height:calc(100dvh - 220px);min-height:420px;grid-template-rows:repeat(4,minmax(0,1fr))}
 body[data-layout=lighting] .upcoming-preview{display:flex;flex-direction:column;min-height:0}
 body[data-layout=lighting] .upcoming-preview .next-frame{aspect-ratio:auto;flex:1;min-height:0}
 body[data-layout=lighting] .next-text{overflow:auto;min-height:0}
 body[data-layout=lighting] #frame,body[data-layout=lighting-grid] #frame{max-height:calc(100dvh - 315px)}
 .lighting-palette{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin-top:12px}
 .lighting-color{display:grid;gap:5px;padding:12px 16px;min-height:78px;border-radius:9px;border:1px solid var(--border);background:var(--control)}
 .lighting-color small{font-size:13px}
 .lighting-color output{font-size:clamp(17px,2vw,26px);font-weight:650;font-variant-numeric:tabular-nums}
 body[data-layout=lighting-grid] .next-preview-list{grid-template-columns:repeat(2,minmax(0,1fr))}
 .upcoming-preview{min-width:0}
 .slide-caption{margin:8px 0;color:var(--muted);font-size:14px;line-height:1.35;overflow-wrap:anywhere}
 .next-text{white-space:pre-wrap;overflow-wrap:anywhere;line-height:1.4}
 body[data-captions=false] .slide-caption{display:none}
 #monitor-role{color:var(--muted);margin:0 0 6px}
 #view-dialog{width:min(460px,calc(100vw - 24px));padding:24px;color:var(--text);background:var(--card);border:1px solid var(--border);border-radius:14px}
 #view-dialog::backdrop{background:#0008}
 #view-dialog h2{margin-top:0}
 #view-dialog label{display:grid;gap:8px;margin:16px 0}
 #view-dialog .checkbox-label{display:flex;align-items:center}
 #view-dialog select{width:100%}
 .card{padding:clamp(12px,2vw,20px);background:var(--card);border:1px solid var(--border);border-radius:14px;min-width:0}
 .card h2{font-size:16px;color:var(--muted);margin:0 0 10px}
 #frame,.next-frame{position:relative;aspect-ratio:16/9;background:#000;border-radius:8px;overflow:hidden}
 #mirror,.next-frame img{display:block;width:100%;height:100%;object-fit:contain}
 #drawing{position:absolute;inset:0;width:100%;height:100%;pointer-events:none;touch-action:none}
 #drawing.enabled{pointer-events:auto}
 .next-frame:has(img[hidden]){display:none}
 #current,#next,#notes{margin:0;white-space:pre-wrap;overflow-wrap:anywhere;line-height:1.5}
 #current,#next{font-size:clamp(17px,2.2vw,28px)}
 .extras{display:grid;gap:12px;margin:12px 0}
 .extras:not(:has(>section:not([hidden]))){display:none}
 .tool-row label{display:grid;gap:4px;font-size:14px;color:var(--muted)}
 .palette{display:flex;flex-wrap:wrap;gap:4px;width:100%}
 .palette .swatch{padding:0;width:46px;min-height:46px;display:grid;place-items:center}
 .palette .swatch span{display:block;width:23px;height:23px;border:1px solid #888;border-radius:50%;background:var(--swatch)}
 .palette .swatch[aria-pressed=true]{box-shadow:inset 0 0 0 2px var(--selected-text)}
 #fullscreen{width:46px;padding:0;display:grid;place-items:center}
 .ui-icon{display:inline-block;width:20px;height:20px;flex:none;vertical-align:middle}
 button:has(.ui-icon){display:inline-flex;align-items:center;justify-content:center;gap:8px}
 #fullscreen .exit-fullscreen{display:none}
 #fullscreen[aria-pressed=true] .enter-fullscreen{display:none}
 #fullscreen[aria-pressed=true] .exit-fullscreen{display:inline-flex}
 #thickness{min-height:28px;accent-color:var(--accent);max-width:100%}
 button,select{padding:10px 14px;min-height:46px;max-width:100%;background:var(--control);color:var(--text);border:1px solid var(--border);border-radius:9px;font:inherit}
 button:not(:disabled),select:not(:disabled){cursor:pointer}
 button:focus-visible,select:focus-visible,input:focus-visible{outline:2px solid var(--accent);outline-offset:3px}
 button:disabled{opacity:.6}
 button[aria-pressed=true],footer [data-action=next]{background:var(--selected);color:var(--selected-text)}
 footer{position:sticky;bottom:0;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;padding:10px 0 max(10px,env(safe-area-inset-bottom));background:var(--page)}
 footer:has(>button[hidden]){grid-template-columns:minmax(0,1fr)}
 #command-status{grid-column:1/-1;margin:0;color:var(--muted);font-size:14px}
 #command-status:empty,#share-status:empty,#countdown:empty,[hidden]{display:none!important}
 @media(max-width:680px){main,body[data-layout=lighting] main,body[data-layout=lighting-grid] main{grid-template-columns:minmax(0,1fr)}body[data-layout=lighting] .next-preview-list{height:auto;min-height:0;grid-template-columns:repeat(2,minmax(0,1fr));grid-template-rows:none}body[data-layout=lighting] .upcoming-preview .next-frame{aspect-ratio:16/9;flex:none}body[data-profile=lighting] #frame{max-height:none}}
</style></head>
 <body><header><div><p id="monitor-role" hidden>${escapeHtml(viewLabels.lighting)}</p><h1 id="title">${escapeHtml(name)}</h1><div class="status-row"><span id="status" role="status" data-state="loading">${safeLabels.connecting}</span><span id="live-status" hidden></span></div></div><div class="header-actions"><div id="clock"></div><div id="countdown"></div><button id="monitor-settings" type="button" hidden aria-label="${escapeHtml(viewLabels.title)}" title="${escapeHtml(viewLabels.title)}">${icon('settings')}</button><button id="fullscreen" type="button" aria-label="${safeLabels.fullscreen}" title="${safeLabels.fullscreen}" aria-pressed="false"><span class="enter-fullscreen">${icon('maximize')}</span><span class="exit-fullscreen">${icon('minimize')}</span></button></div></header>
 <dialog id="view-dialog" aria-labelledby="view-title"><h2 id="view-title">${escapeHtml(viewLabels.title)}</h2><label>${escapeHtml(viewLabels.title)}<select id="monitor-layout"><option value="lighting">${escapeHtml(viewLabels.column)}</option><option value="lighting-grid">${escapeHtml(viewLabels.grid)}</option><option value="mirror">${escapeHtml(viewLabels.mirror)}</option><option value="current-next">${escapeHtml(viewLabels.pair)}</option></select></label><label>${escapeHtml(viewLabels.theme)}<select id="monitor-theme"><option value="system">${escapeHtml(viewLabels.system)}</option><option value="light">${escapeHtml(viewLabels.light)}</option><option value="dark">${escapeHtml(viewLabels.dark)}</option></select></label><label class="checkbox-label"><input id="monitor-captions" type="checkbox" checked>${escapeHtml(viewLabels.captions)}</label><button id="view-close" type="button">${escapeHtml(viewLabels.close)}</button></dialog>
 <main><section class="card" id="current-card"><h2>${safeLabels.current}</h2><div id="frame" hidden><img id="mirror" alt="${safeLabels.current}"><canvas id="drawing"></canvas></div><div id="lighting-palette" class="lighting-palette" hidden aria-label="${escapeHtml(viewLabels.color)}"><div class="lighting-color" id="lighting-color-0"><small>${escapeHtml(viewLabels.color)} 1</small><output>—</output></div><div class="lighting-color" id="lighting-color-1"><small>${escapeHtml(viewLabels.color)} 2</small><output>—</output></div></div><p id="current-caption" class="slide-caption"></p><div id="current">${safeLabels.waiting}</div></section><section class="card" id="next-card"><h2>${safeLabels.next}</h2><div class="next-preview-list"><div class="upcoming-preview" id="upcoming-0"><p id="next-caption-0" class="slide-caption"></p><div class="next-frame"><img id="next-mirror" alt="${safeLabels.next}" hidden></div><div id="next">${safeLabels.nextWaiting}</div></div>${extraPreviews}</div></section></main>
 <div class="extras"><section class="card" id="tools" hidden><h2>${safeLabels.draw}</h2><div class="tool-row"><button id="draw" aria-pressed="false">${icon('pen')} ${safeLabels.draw}</button><select id="tool" aria-label="${safeLabels.draw}"><option value="pen">${safeLabels.pen}</option><option value="line">${safeLabels.line}</option><option value="arrow">${safeLabels.arrow}</option><option value="rectangle">${safeLabels.rectangle}</option><option value="ellipse">${safeLabels.ellipse}</option></select><label>${safeLabels.thickness}<input id="thickness" type="range" min="2" max="16" step="1" value="8"></label><div class="palette" role="group" aria-label="${language==='de'?escapeHtml(copy('remoteColor')):'Color'}">${swatches}</div><button id="clear">${icon('eraser')} ${safeLabels.clear}</button></div></section>
 <section id="notes-card" class="card" hidden><h2>${safeLabels.notes}</h2><div id="notes"></div></section><section id="order-card" class="card" hidden><h2>${safeLabels.order}</h2><ol id="order"></ol></section>
 <section id="sharing" class="card" hidden><button id="share-start">${icon('screen_share')} ${safeLabels.shareStart}</button><button id="share-stop" hidden>${icon('screen_share_off')} ${safeLabels.shareStop}</button><p id="share-status"></p></section>
 </div><footer ${kind==='monitor'?'hidden':''}><p id="command-status" role="status"></p><button data-action="previous" disabled>${icon('arrow_back')} ${safeLabels.previous}</button><button data-action="next" disabled>${safeLabels.advance} ${icon('arrow_forward')}</button></footer>
 <script>
 const token=${JSON.stringify(token).replaceAll('<','\\u003c')},labels=${JSON.stringify(labels).replaceAll('<','\\u003c')},q=s=>document.querySelector(s),canvas=q('#drawing'),ctx=canvas.getContext('2d');const navigationButtons=[...document.querySelectorAll('[data-action]')];
 let connected=false, pendingNavigation=null;
 let chosenColor=${JSON.stringify(annotationColors[0])};
 for(const swatch of document.querySelectorAll('.swatch'))swatch.onclick=()=>{
   chosenColor=swatch.dataset.color;
   for(const option of document.querySelectorAll('.swatch'))option.setAttribute('aria-pressed',String(option===swatch));
 };
 let currentTool='pen',currentWidth=.004,currentColor=chosenColor,state={},draw=false,points=[],take='',alive=true,lastFrame='';
 const viewStorageKey='gottesdienstregie.monitor-view:'+location.pathname;
 const viewLayouts=['lighting','lighting-grid','mirror','current-next'];
 let viewSettings={layout:null,theme:'dark',captions:true};
 try{
   const saved=JSON.parse(localStorage.getItem(viewStorageKey)||'null');
   if(saved&&typeof saved==='object')viewSettings={
     layout:viewLayouts.includes(saved.layout)?saved.layout:null,
     theme:['system','light','dark'].includes(saved.theme)?saved.theme:'dark',
     captions:saved.captions!==false
   };
 }catch{}
 const upcomingViews=Array.from({length:4},(_,index)=>({
   root:q('#upcoming-'+index),image:q(index?'#next-mirror-'+index:'#next-mirror'),
   text:q(index?'#next-text-'+index:'#next'),caption:q('#next-caption-'+index)
 }));
 const upcomingPackets=()=>Array.isArray(state.upcoming)?state.upcoming.slice(0,4):(state.next?[{slide:state.next}]:[]);
 function applyView(){
   const config=state.monitor||{},lighting=config.profile==='lighting';
   document.body.dataset.profile=lighting?'lighting':'personal';
   document.body.dataset.layout=lighting?(viewSettings.layout||config.layout||'lighting'):(config.layout||'current-next');
   document.body.dataset.captions=String(!lighting||viewSettings.captions);
   document.documentElement.dataset.theme=lighting?viewSettings.theme:'dark';
   q('#monitor-settings').hidden=!lighting;q('#monitor-role').hidden=!lighting;
   const packets=upcomingPackets(),four=lighting&&['lighting','lighting-grid'].includes(document.body.dataset.layout);
   for(const [index,view] of upcomingViews.entries()){
     const packet=packets[index],slide=packet?.slide;
     view.root.hidden=index>0&&(!four||!slide);
     view.text.textContent=slide?text(slide):labels.nextWaiting;
     const title=[packet?.itemTitle,slide?.title].filter((value,index,values)=>typeof value==='string'&&value.trim()&&values.indexOf(value)===index).join(' · ');
     view.caption.textContent=slide?String(index+1)+'. '+title:'';
     if(!slide||shownUpcoming[index]!==nextRevision()){view.image.hidden=true;view.text.hidden=false;}
   }
   q('#current-caption').textContent=state.current?.title||'';
   q('#lighting-palette').hidden=!lighting||!state.onAir;
   if(lighting&&!state.onAir){
     q('#next-card').hidden=true;q('#frame').hidden=true;q('#current').hidden=false;
     q('#current').textContent=${JSON.stringify(viewLabels.offAir).replaceAll('<','\\u003c')};
   }
   if(paletteTake!==state.annotationTakeId||!state.onAir)clearPalette();
 }
 function saveView(){
   viewSettings={layout:q('#monitor-layout').value,theme:q('#monitor-theme').value,captions:q('#monitor-captions').checked};
   try{localStorage.setItem(viewStorageKey,JSON.stringify(viewSettings))}catch{}
   applyView();
 }
 q('#monitor-settings').onclick=()=>{
   q('#monitor-layout').value=viewSettings.layout||state.monitor?.layout||'lighting';
   q('#monitor-theme').value=viewSettings.theme;q('#monitor-captions').checked=viewSettings.captions;
   q('#view-dialog').showModal();
 };
 for(const id of ['#monitor-layout','#monitor-theme','#monitor-captions'])q(id).onchange=saveView;
 q('#view-close').onclick=()=>q('#view-dialog').close();
 const analyzeFrameColors=(${dominantFrameColors.toString()});
 const sampleCanvas=document.createElement('canvas');sampleCanvas.width=96;sampleCanvas.height=54;
 const sampleContext=sampleCanvas.getContext('2d',{willReadFrequently:true});
 let paletteTake='',paletteAt=-Infinity;
 function clearPalette(){
   paletteTake='';paletteAt=-Infinity;
   for(let index=0;index<2;index++){
     const tile=q('#lighting-color-'+index);tile.style.background='';tile.style.color='';
     tile.querySelector('output').textContent='—';tile.title=${JSON.stringify(viewLabels.analyzing).replaceAll('<','\\u003c')};
   }
 }
 q('#mirror').addEventListener('load',()=>{
   const image=q('#mirror');
   if(state.monitor?.profile!=='lighting'||!state.onAir||!connected||!sampleContext||document.hidden||performance.now()-paletteAt<1000)return;
   if(image.dataset.take!==state.annotationTakeId)return;
   try{
     sampleContext.drawImage(image,0,0,96,54);
     const colors=analyzeFrameColors(sampleContext.getImageData(0,0,96,54).data);
     paletteTake=state.annotationTakeId;paletteAt=performance.now();
     for(let index=0;index<2;index++){
       const tile=q('#lighting-color-'+index),color=colors[index];
       tile.style.background=color||'';
       tile.querySelector('output').textContent=color||'—';
       tile.title=color||${JSON.stringify(viewLabels.single).replaceAll('<','\\u003c')};
       if(color){
         const linear=[1,3,5].map(offset=>{const value=parseInt(color.slice(offset,offset+2),16)/255;return value<=.04045?value/12.92:((value+.055)/1.055)**2.4});
         const luminance=.2126*linear[0]+.7152*linear[1]+.0722*linear[2];
         tile.style.color=luminance>.179?'#101820':'#ffffff';
       }else tile.style.color='';
     }
   }catch{clearPalette()}
 });
 const text=x=>typeof x==='string'?x:x&&typeof x==='object'?(typeof x.body==='string'&&x.body.trim()?x.body:typeof x.title==='string'?x.title:'—'):'—';
 async function command(action,extra={}){try{const r=await fetch('/api/command',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({token,commandId:crypto.randomUUID?crypto.randomUUID():Date.now().toString(36)+'-'+Math.random().toString(36).slice(2),action,timestamp:Date.now(),...extra}),signal:AbortSignal.timeout?.(4000)});return r.ok}catch{return false}}
 function setConnection(status){
   connected=status==='connected';
   q('#status').dataset.state=status;
   const caption=labels[status];
   if(q('#status').textContent!==caption)q('#status').textContent=caption;
   q('#live-status').hidden=!connected;
   for(const button of navigationButtons)button.disabled=!connected||Boolean(pendingNavigation);
 }
 function navigationMessage(message,error=false){
   const status=q('#command-status');
   status.dataset.error=String(error);
   status.textContent=message;
 }
 function finishNavigation(message='',error=false){
   clearTimeout(pendingNavigation?.timer);
   pendingNavigation=null;
   navigationMessage(message,error);
   for(const button of navigationButtons)button.disabled=!connected;
 }
 async function navigate(action){
   if(!connected||pendingNavigation)return;
   const request={take:state.annotationTakeId,slide:state.current?.id,accepted:false,timer:0};
   pendingNavigation=request;
   for(const button of navigationButtons)button.disabled=true;
   navigationMessage(labels.pending);
   const accepted=await command(action);
   if(!alive||pendingNavigation!==request)return;
   if(!accepted){finishNavigation(labels.commandError,true);return}
   request.accepted=true;
   request.timer=setTimeout(()=>finishNavigation(labels.unconfirmed,true),2500);
 }
 function clearLocal(){points=[];ctx.clearRect(0,0,canvas.width,canvas.height)}
 function setDraw(next){draw=next;canvas.classList.toggle('enabled',draw);q('#draw').setAttribute('aria-pressed',String(draw));if(!draw)clearLocal()}
 async function poll(){if(!alive)return;try{const r=await fetch('/api/state?token='+encodeURIComponent(token),{cache:'no-store',signal:AbortSignal.timeout?.(3500)});if(!r.ok)throw 0;state=await r.json();q('#title').textContent=state.title||${JSON.stringify(name).replaceAll('<','\\u003c')};q('#current').textContent=text(state.current);q('#next').textContent=state.next?text(state.next):labels.nextWaiting;setConnection('connected');
 const live=q('#live-status');
 live.dataset.live=String(Boolean(state.onAir));
 live.textContent=state.onAir?'ON AIR':'OFF AIR';
 if(!state.onAir){q('#frame').hidden=true;q('#current').hidden=false;}
 if(pendingNavigation?.accepted&&(pendingNavigation.take!==state.annotationTakeId||pendingNavigation.slide!==state.current?.id))finishNavigation();
 const config=state.monitor||{};applyView();for(const [id,key]of [['#current-card','showCurrent'],['#next-card','showNext'],['#clock','showClock'],['#countdown','showCountdown']])q(id).hidden=config[key]===false||(id==='#next-card'&&config.profile==='lighting'&&!state.onAir);
 q('#notes-card').hidden=!state.notes;q('#notes').textContent=state.notes||'';q('#order-card').hidden=!state.order?.length;q('#order').replaceChildren(...(state.order||[]).map(value=>{const li=document.createElement('li');li.textContent=value;return li}));
 q('#sharing').hidden=!(state.permissions||[]).includes('remote.share');q('#tools').hidden=!state.canAnnotate;for(const button of document.querySelectorAll('[data-action]'))button.hidden=!(state.permissions||[]).includes('remote.'+button.dataset.action);
 if(take!==state.annotationTakeId){take=state.annotationTakeId||'';clearLocal();q('#frame').hidden=true;q('#current').hidden=false}if(!state.canAnnotate||!state.onAir)setDraw(false);
 }catch{setConnection('lost');q('#frame').hidden=true;q('#current').hidden=false;
 for(const view of upcomingViews){view.image.hidden=true;view.text.hidden=false;}shownUpcoming.fill(undefined);clearPalette();q('#lighting-palette').hidden=true;setDraw(false)}finally{if(alive)setTimeout(poll,500)}}
 async function previewImage(path,parameters={}){
   const query=new URLSearchParams({token,...parameters});
   const response=await fetch(path+'?'+query.toString(),{cache:'no-store',signal:AbortSignal.timeout?.(5000)});
   if(!response.ok)throw Error('UNAVAILABLE');
   const url=URL.createObjectURL(await response.blob());
   const image=new Image();
   image.src=url;
   try{await image.decode();return url}
   catch(error){URL.revokeObjectURL(url);throw error}
 }
 let visibleTake, lastLiveFrameAt=0;
 async function frame(){
   if(!alive)return;
   const started=performance.now();
   const requestedTake=state.annotationTakeId;
   try{
     if(!connected||!state.onAir||q('#current-card').hidden||document.hidden)return;
     const url=await previewImage('/api/frame');
     if(!alive||!connected||!state.onAir||requestedTake!==state.annotationTakeId){URL.revokeObjectURL(url);return}
     q('#mirror').dataset.take=requestedTake||'';
     q('#mirror').src=url;
     q('#frame').hidden=false;
     q('#current').hidden=true;
     if(lastFrame)URL.revokeObjectURL(lastFrame);
     lastFrame=url;
     visibleTake=requestedTake;
     lastLiveFrameAt=performance.now();
   }catch{
     if(visibleTake!==state.annotationTakeId||performance.now()-lastLiveFrameAt>1500){
       q('#frame').hidden=true;
       q('#current').hidden=false;
       clearPalette();
       setDraw(false);
     }
   }finally{if(alive)setTimeout(frame,Math.max(40,200-(performance.now()-started)))}
 }
 function clock(){q('#clock').textContent=new Date().toLocaleTimeString(${JSON.stringify(language==='de'?'de-DE':'en-GB')},{hour:'2-digit',minute:'2-digit',second:'2-digit'});const seconds=Math.ceil((Number(state.serviceCountdownAtMs)-Date.now())/1000);q('#countdown').textContent=seconds>0?labels.start+' '+Math.floor(seconds/60)+':'+String(seconds%60).padStart(2,'0'):''}clock();setInterval(clock,1000);
 function point(e){const r=canvas.getBoundingClientRect();return{x:Math.max(0,Math.min(1,(e.clientX-r.left)/r.width)),y:Math.max(0,Math.min(1,(e.clientY-r.top)/r.height))}}
 function paint(){canvas.width=1920;canvas.height=1080;if(points.length<2)return;ctx.strokeStyle=currentColor;ctx.lineWidth=currentWidth*1920;ctx.lineCap='round';ctx.lineJoin='round';const a=points[0],b=points.at(-1),x=a.x*1920,y=a.y*1080,x2=b.x*1920,y2=b.y*1080;ctx.beginPath();if(currentTool==='rectangle')ctx.strokeRect(Math.min(x,x2),Math.min(y,y2),Math.abs(x2-x),Math.abs(y2-y));else if(currentTool==='ellipse'){ctx.ellipse((x+x2)/2,(y+y2)/2,Math.abs(x2-x)/2,Math.abs(y2-y)/2,0,0,Math.PI*2);ctx.stroke()}else{if(currentTool==='pen')points.forEach((p,i)=>i?ctx.lineTo(p.x*1920,p.y*1080):ctx.moveTo(p.x*1920,p.y*1080));else{ctx.moveTo(x,y);ctx.lineTo(x2,y2)}ctx.stroke();if(currentTool==='arrow'){const angle=Math.atan2(y2-y,x2-x),head=Math.max(14,currentWidth*1920*3);ctx.beginPath();ctx.moveTo(x2-head*Math.cos(angle-Math.PI/6),y2-head*Math.sin(angle-Math.PI/6));ctx.lineTo(x2,y2);ctx.lineTo(x2-head*Math.cos(angle+Math.PI/6),y2-head*Math.sin(angle+Math.PI/6));ctx.stroke()}}}
 canvas.onpointerdown=e=>{if(!draw||!take||!state.onAir)return;canvas.setPointerCapture(e.pointerId);currentTool=q('#tool').value;currentWidth=Number(q('#thickness').value)/1920;currentColor=chosenColor;points=[point(e)];paint()};canvas.onpointermove=e=>{if(!draw||!canvas.hasPointerCapture(e.pointerId))return;if(currentTool==='pen'){points.push(point(e));if(points.length>512)points=points.filter((_,i)=>i%2===0)}else points=[points[0],point(e)];paint()};canvas.onpointerup=async e=>{if(!canvas.hasPointerCapture(e.pointerId))return;canvas.releasePointerCapture(e.pointerId);const p=point(e);if(currentTool==='pen')points.push(p);else points=[points[0],p];const stroke={id:Date.now().toString(36)+'-'+Math.random().toString(36).slice(2),tool:currentTool,color:currentColor,width:currentWidth,points:points.filter((_,i)=>i%Math.max(1,Math.ceil(points.length/256))===0)};await command('annotate',{takeId:take,stroke});clearLocal()};canvas.onpointercancel=clearLocal;
 let sharePc=null,shareStream=null,shareId='',shareGeneration=0,shareTimer=0;
 async function shareRequest(value){const response=await fetch('/api/share',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({token,...value})});if(!response.ok)throw Error('SHARE_FAILED');return response.json()}
 async function stopShare(notify=true){shareGeneration++;clearTimeout(shareTimer);const oldId=shareId;shareId='';sharePc?.close();sharePc=null;shareStream?.getTracks().forEach(track=>track.stop());shareStream=null;q('#share-stop').hidden=true;q('#share-start').disabled=false;if(notify&&oldId)await shareRequest({action:'stop',id:oldId}).catch(()=>{});}
 async function iceReady(pc){if(pc.iceGatheringState==='complete')return;await new Promise((resolve,reject)=>{const timeout=setTimeout(()=>{pc.removeEventListener('icegatheringstatechange',check);reject(Error('ICE_TIMEOUT'))},10000);function check(){if(pc.iceGatheringState==='complete'){clearTimeout(timeout);pc.removeEventListener('icegatheringstatechange',check);resolve()}}pc.addEventListener('icegatheringstatechange',check);check()})}
 async function pollShare(generation){if(!alive||generation!==shareGeneration||!shareId)return;try{const response=await fetch('/api/share?token='+encodeURIComponent(token)+'&id='+encodeURIComponent(shareId),{cache:'no-store'});if(!response.ok)throw Error('ENDED');const result=await response.json();if(generation!==shareGeneration)return;if(result.answer&&!sharePc.currentRemoteDescription)await sharePc.setRemoteDescription(result.answer);q('#share-status').textContent=labels.shareWaiting;shareTimer=setTimeout(()=>pollShare(generation),1000)}catch{if(generation===shareGeneration){await stopShare(false);q('#share-status').textContent=labels.shareError}}}
 q('#share-start').onclick=async()=>{if(location.protocol!=='https:'||!isSecureContext){q('#share-status').textContent=labels.shareSecure;return}if(!navigator.mediaDevices?.getDisplayMedia){q('#share-status').textContent=labels.shareUnsupported;return}const generation=++shareGeneration;q('#share-start').disabled=true;try{const stream=await navigator.mediaDevices.getDisplayMedia({video:{frameRate:{ideal:15,max:30},width:{max:1920},height:{max:1080}},audio:false});if(generation!==shareGeneration||!alive){stream.getTracks().forEach(track=>track.stop());return}shareStream=stream;const pc=new RTCPeerConnection({iceServers:[]});sharePc=pc;stream.getVideoTracks().forEach(track=>{pc.addTrack(track,stream);track.onended=()=>void stopShare()});q('#share-stop').hidden=false;pc.onconnectionstatechange=()=>{if(generation===shareGeneration&&pc.connectionState==='failed'){q('#share-status').textContent=labels.shareError;void stopShare()}};await pc.setLocalDescription(await pc.createOffer());await iceReady(pc);if(generation!==shareGeneration)return;const result=await shareRequest({action:'offer',description:pc.localDescription.toJSON()});if(generation!==shareGeneration){await shareRequest({action:'stop',id:result.id});return}shareId=result.id;void pollShare(generation)}catch{if(generation===shareGeneration){await stopShare();q('#share-status').textContent=labels.shareError}}};q('#share-stop').onclick=()=>void stopShare();window.addEventListener('pagehide',()=>{const id=shareId;void stopShare(false);if(id)navigator.sendBeacon('/api/share',new Blob([JSON.stringify({token,action:'stop',id})],{type:'application/json'}))});
 const nextFrameUrls=Array(4).fill(''),shownUpcoming=Array(4);
 const nextRevision=()=>state.nextPreviewRevision??state.next?.id??state.next;
 async function nextFrame(){
   if(!alive)return;
   const revision=nextRevision();
   let retry=250;
   try{
     if(!connected||q('#next-card').hidden||document.body.dataset.layout==='mirror'||document.hidden||(state.monitor?.profile==='lighting'&&!state.onAir))return;
     const packets=upcomingPackets();
     for(const [index,view] of upcomingViews.entries()){
       if(!packets[index]?.slide||view.root.hidden||shownUpcoming[index]===revision)continue;
       const parameters={index:String(index)};
       if(typeof state.nextPreviewRevision==='number')parameters.revision=String(revision);
       const url=await previewImage('/api/next-frame',parameters);
       if(!alive||!connected||revision!==nextRevision()||(state.monitor?.profile==='lighting'&&!state.onAir)){URL.revokeObjectURL(url);return}
       view.image.src=url;view.image.hidden=false;view.text.hidden=true;
       if(nextFrameUrls[index])URL.revokeObjectURL(nextFrameUrls[index]);
       nextFrameUrls[index]=url;shownUpcoming[index]=revision;
     }
   }catch{retry=600}
   finally{if(alive)setTimeout(nextFrame,retry)}
 }
 window.addEventListener('pagehide',()=>{for(const url of nextFrameUrls)if(url)URL.revokeObjectURL(url)});
 void nextFrame();
 const fullscreen=q('#fullscreen');
 fullscreen.hidden=!document.fullscreenEnabled;
 document.addEventListener('fullscreenchange',()=>{
   const active=Boolean(document.fullscreenElement);
   const label=active?${JSON.stringify(exitFullscreen).replaceAll('<','\\u003c')}:labels.fullscreen;
   fullscreen.setAttribute('aria-pressed',String(active));
   fullscreen.setAttribute('aria-label',label);
   fullscreen.title=label;
 });
 fullscreen.onclick=()=>{
   const action=document.fullscreenElement?document.exitFullscreen():document.documentElement.requestFullscreen();
   void action.catch(()=>{});
 };
 q('#draw').onclick=()=>setDraw(!draw);q('#clear').onclick=()=>{clearLocal();void command('annotation-clear')};for(const button of navigationButtons)button.onclick=()=>void navigate(button.dataset.action);window.addEventListener('pagehide',()=>{alive=false;clearTimeout(pendingNavigation?.timer);if(lastFrame)URL.revokeObjectURL(lastFrame)});poll();frame();
 </script></body></html>`;
}
