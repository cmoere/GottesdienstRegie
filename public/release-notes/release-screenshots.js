fetch('../releases.json').then(response=>response.json()).then(data=>{
  const language=new URLSearchParams(location.search).get('lang')||navigator.language||'de';
  const local=value=>value?.[language]??value?.[language.split('-')[0]]??value?.en??value?.de??'';
  const builds=data.versions.flatMap(version=>version.builds).filter(build=>build.screenshot);
  const apply=()=>builds.forEach(build=>{
    const body=document.querySelector(`#version-${CSS.escape(build.version)} .release-body`);
    if(!body||body.querySelector('.release-shot'))return;
    const figure=document.createElement('figure');figure.className='release-shot';
    const image=document.createElement('img');image.src=build.screenshot.src;image.alt=local(build.screenshot.alt)||`GottesdienstRegie ${build.version}`;
    const caption=document.createElement('figcaption');caption.textContent=local(build.screenshot.caption);
    figure.append(image,caption);body.prepend(figure);
  });
  apply();new MutationObserver(apply).observe(document.querySelector('#content'),{childList:true,subtree:true});
});
