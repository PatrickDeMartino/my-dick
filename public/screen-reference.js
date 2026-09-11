(function () {
  const script = document.currentScript;
  const number = script.dataset.screen;
  let mode = '';
  const banner = document.createElement('header');
  banner.id = 'temporary-screen-banner';
  banner.style.cssText = 'position:fixed;top:0;left:0;z-index:9999;display:flex;align-items:center;gap:12px;padding:8px 14px;background:linear-gradient(90deg,#511875,#281040);border-bottom:1px solid #b482d4;color:#fff4b4;font:800 14px/1.2 monospace;pointer-events:none;border-radius:0 0 10px 0';
  const reference = document.createElement('span');
  const home = document.createElement('a');home.href='/';home.textContent='← home';home.style.cssText='color:#f7ddff;pointer-events:auto;text-decoration:none';
  banner.append(reference,home);
  const attach = () => requestAnimationFrame(() => requestAnimationFrame(() => {
    if (parent === window && !banner.isConnected) document.body.append(banner);
  }));
  if (document.readyState === 'complete') attach(); else window.addEventListener('load', attach, {once:true});
  function update(next) {
    if (!/^(?:[a-z]+(?:[0-9]+[a-z]*)*)?$/.test(next)) return;
    mode=next;reference.textContent=number+mode;
    if(parent!==window)parent.postMessage({type:'trip-screen-mode',mode},location.origin);
  }
  window.addEventListener('trip-screen-mode',event=>update(event.detail));
  // Imported game builds can also announce modes without depending on React.
  // Their existing accessible play/pause controls identify the common states.
  const known = {PLAY:'a',START:'a',RESUME:'a',RESTART:'a',PAUSE:'b',PAUSED:'b','MAIN MENU':'','TITLE SCREEN':''};
  document.addEventListener('click',event=>{
    const button=event.target.closest('button');if(!button)return;
    const label=(button.getAttribute('aria-label')||button.textContent).trim().toUpperCase();
    if(Object.hasOwn(known,label))update(known[label]);
  });
  update('');
})();
