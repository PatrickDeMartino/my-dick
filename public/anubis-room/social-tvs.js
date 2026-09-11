import { createShuffle, safeMedia, tikTokId } from './social-core.js';
const boost = document.querySelector('#boost-metrics');
const stack = document.querySelector('#social-stack');
const audioBar = document.querySelector('#social-audio');
const channels = new Map();
let active = false, audio = 'none', config = null, focused = '';
const refreshTimer = setInterval(async () => {
  if (!active || !config) return;
  try {
    const response = await fetch('/api/social-feed'); if (!response.ok) return; const fresh = await response.json();
    for (const key of ['instagram','x','tiktok']) for (const post of config[key].posts) {
      const updated = fresh[key]?.posts?.find(item => item.url === post.url); if (updated) Object.assign(post, updated);
    }
  } catch { /* Keep the working feed during a temporary outage. */ }
}, 240000);
function sendMode() {
  const mode = active ? 'a' + (focused ? ({tv:'1',anubis:'2',pigeon:'3'})[focused] : '') : ({tv:'b',anubis:'c',pigeon:'d'})[focused] || '';
  const detail = {type:'trip-screen-mode',mode};
  window.dispatchEvent(new CustomEvent('trip-screen-mode',{detail:mode}));
  if (parent !== window) parent.postMessage(detail, location.origin);
}
function chooseAudio(key) {
  audio = key;
  window.dispatchEvent(new CustomEvent('trip-tv-audio',{detail:key}));
  channels.forEach((channel, id) => channel.setMuted(id !== key));
  audioBar.querySelectorAll('button').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.audio === key)));
}
window.addEventListener('trip-youtube-audio', e => chooseAudio(e.detail ? 'youtube' : 'none'));
window.addEventListener('trip-sector-change', e => { focused = e.detail; sendMode(); });
audioBar.addEventListener('click', e => { const button = e.target.closest('[data-audio]'); if (button) chooseAudio(button.dataset.audio); });
function createChannel(key, feed) {
  const cabinet = document.createElement('article'); cabinet.className = 'social-tv'; cabinet.dataset.channel = key;
  const screen = document.createElement('div'); screen.className = 'social-tv__screen';
  const footer = document.createElement('footer');
  const label = document.createElement('a'); label.textContent = key === 'x' ? 'X' : key; label.href = feed.profile; label.target = '_blank'; label.rel = 'noopener noreferrer'; label.title = '@' + feed.handle;
  const nextButton = document.createElement('button'); nextButton.type = 'button'; nextButton.textContent = '↻'; nextButton.setAttribute('aria-label', 'Next ' + key + ' post');
  footer.append(label, nextButton); cabinet.append(screen, footer); stack.append(cabinet);
  const next = createShuffle(feed.posts);
  let timer, frame, media, current, generation = 0;
  const postMessage = type => frame?.contentWindow?.postMessage({'x-tiktok-player':true,type}, 'https://www.tiktok.com');
  const setMuted = muted => {
    if (media instanceof HTMLVideoElement) { media.muted = muted; if (!muted) media.play().catch(() => {}); }
    if (frame) {
      // Reload with the documented forced-muted flag, so inline controls cannot
      // enable a second audio source. The selected channel alone is unforced.
      const wanted = muted ? '1' : '0'; const url = new URL(frame.src);
      if (url.searchParams.get('muted') !== wanted) { url.searchParams.set('muted', wanted); frame.src = url.href; }
      postMessage(muted ? 'mute' : 'unMute');
    }
  };
  const schedule = ms => { clearTimeout(timer); timer = setTimeout(showNext, ms); };
  function fallback(post, message) {
    frame = null; if (media instanceof HTMLVideoElement) media.pause(); media = null;
    screen.replaceChildren();
    const card = document.createElement('a'); card.className = 'social-tv__fallback'; card.href = safeMedia(post?.url) || feed.profile; card.target = '_blank'; card.rel = 'noopener noreferrer';
    if (post?.thumbnail && safeMedia(post.thumbnail)) { const image = document.createElement('img'); image.src = post.thumbnail; image.alt = ''; card.append(image); }
    const name = document.createElement('strong'); name.textContent = '@' + feed.handle;
    const text = document.createElement('span'); text.textContent = post?.text || message;
    const open = document.createElement('span'); open.textContent = 'open ' + (post ? 'post' : 'profile') + ' ↗';
    card.append(name,text,open); screen.append(card);
    if (post) schedule(5000);
  }
  function showNext() {
    clearTimeout(timer); generation++; frame = null; if (media instanceof HTMLVideoElement) media.pause(); media = null;
    screen.replaceChildren(); current = next();
    if (!current) { fallback(null,'Open the latest posts'); nextButton.disabled = true; return; }
    const ownGeneration = generation;
    if (current.type === 'video' && safeMedia(current.media)) {
      const video = document.createElement('video'); media = video; video.playsInline = true; video.setAttribute('playsinline',''); video.autoplay = true; video.setAttribute('autoplay',''); video.muted = key !== audio; video.defaultMuted = true; video.setAttribute('muted',''); video.preload = 'auto'; video.controls = false; video.disablePictureInPicture = true; video.referrerPolicy = 'no-referrer';
      video.src = current.media; video.addEventListener('ended',showNext); video.addEventListener('error',()=>{if(ownGeneration===generation)fallback(current,'Open this video');});
      video.addEventListener('playing',()=>clearTimeout(timer));
      screen.append(video); schedule(20000);
      const tryPlay = () => { if (ownGeneration !== generation) return; video.play().catch(() => {}); };
      video.addEventListener('canplay', tryPlay, { once: true }); requestAnimationFrame(tryPlay);
    } else if (current.type === 'image' && safeMedia(current.media)) {
      const img=document.createElement('img');img.src=current.media;img.alt=current.text || 'Post by @'+feed.handle;
      img.onload=()=>{if(ownGeneration===generation)schedule(5000);};img.onerror=()=>{if(ownGeneration===generation)fallback(current,'Open this image');};screen.append(img);schedule(20000);
    } else if (key === 'tiktok' && tikTokId(current.url)) {
      frame=document.createElement('iframe');frame.title='TikTok post by @'+feed.handle;
      frame.src=`https://www.tiktok.com/player/v1/${tikTokId(current.url)}?autoplay=1&muted=${audio===key?0:1}&controls=0&volume_control=0&rel=0`;
      frame.allow='autoplay; fullscreen';screen.append(frame);schedule(20000);
    } else fallback(current,current.unavailable || 'Open this post');
  }
  const message = e => {
    if (e.origin !== 'https://www.tiktok.com' || e.source !== frame?.contentWindow || !e.data?.['x-tiktok-player']) return;
    if (e.data.type==='onPlayerReady') { postMessage(key===audio?'unMute':'mute');postMessage('play');if(current?.type==='image')schedule(5000); }
    if (e.data.type==='onStateChange' && e.data.value===1) { if(current?.type==='image') schedule(5000); else clearTimeout(timer); }
    if (e.data.type==='onStateChange' && e.data.value===0) showNext();
    if (e.data.type==='onPlayerError') fallback(current,'Open this post');
  };
  window.addEventListener('message',message);nextButton.addEventListener('click',showNext);showNext();
  return {setMuted, dispose(){clearTimeout(timer);generation++;if(media instanceof HTMLVideoElement)media.pause();window.removeEventListener('message',message);cabinet.remove();}};
}
boost.addEventListener('click', async () => {
  active = !active;boost.setAttribute('aria-pressed',String(active));stack.hidden=!active;audioBar.hidden=!active;sendMode();
  if (!active) { chooseAudio('none');channels.forEach(c=>c.dispose());channels.clear();return; }
  chooseAudio('none');
  try {
    config ??= await fetch('/api/social-feed').then(r=>{if(!r.ok)throw Error('feed unavailable');return r.json();}).catch(()=>fetch('./social-posts.json').then(r=>r.json()));
    if (!active) return;
    if (!channels.size) stack.replaceChildren();
    for(const key of ['tiktok','instagram','x']) if(!channels.has(key))channels.set(key,createChannel(key,config[key]));
  } catch { stack.textContent='Could not load the social channels. Toggle boost to retry.'; }
});
window.addEventListener('pagehide',()=>{clearInterval(refreshTimer);channels.forEach(c=>c.dispose());});
