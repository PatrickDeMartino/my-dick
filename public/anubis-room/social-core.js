// Shuffle bags exhaust every post before repeating; no repeat across bag boundaries.
export function createShuffle(items, random = Math.random) {
  let bag = [], last;
  return () => {
    if (!items.length) return null;
    if (!bag.length) {
      bag = [...items];
      for (let i = bag.length - 1; i > 0; i--) { const j = Math.floor(random() * (i + 1)); [bag[i], bag[j]] = [bag[j], bag[i]]; }
      if (bag.length > 1 && bag[bag.length - 1] === last) [bag[0], bag[bag.length - 1]] = [bag[bag.length - 1], bag[0]];
    }
    return last = bag.pop();
  };
}
export function safeMedia(url) {
  if (typeof url !== 'string') return null;
  if (url.startsWith('/') && !url.startsWith('//')) return url;
  try { const parsed = new URL(url); return parsed.protocol === 'https:' ? parsed.href : null; } catch { return null; }
}
export function tikTokId(url) {
  try { const parsed = new URL(url); return parsed.hostname === 'www.tiktok.com' || parsed.hostname === 'tiktok.com' ? parsed.pathname.match(/\/(?:video|photo)\/(\d+)\/?$/)?.[1] ?? null : null; } catch { return null; }
}
