import seeds from '../../../public/anubis-room/social-posts.json';
type Post = { type: string; url: string; text?: string; thumbnail?: string; media?: string; unavailable?: string };
type Feed = { handle: string; profile: string; posts: Post[] };
type Feeds = Record<string, Feed>;
let cached: { until: number; feeds: Feeds } | null = null;
let pending: Promise<Feeds> | null = null;
const https = (value: unknown) => typeof value === 'string' && value.startsWith('https://') ? value : undefined;
async function instagram(post: Post): Promise<Post> {
  const url = new URL(post.url);
  if (url.hostname !== 'www.instagram.com' || !/^\/reel\/[A-Za-z0-9_-]+\/$/.test(url.pathname)) return post;
  const response = await fetch(`${url.origin}${url.pathname}embed/`, { signal: AbortSignal.timeout(8000), headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'text/html', 'Accept-Language': 'en-US,en;q=0.9' } });
  if (!response.ok) { console.warn("Instagram embed HTTP", response.status); return post; }
  const html = await response.text();
  // Public embed payload, parsed as data only. Never execute platform markup.
  const match = html.match(/"contextJSON"\s*:\s*("(?:\\.|[^"\\])*")/);
  if (!match) { console.warn("Instagram embed: no public payload", html.length); return post; }
  const data = JSON.parse(JSON.parse(match[1]));
  const media = data.gql_data?.shortcode_media;
  if (!media || media.owner?.username !== seeds.instagram.handle) { console.warn("Instagram embed: owner mismatch"); return post; }
  const text = media.edge_media_to_caption?.edges?.[0]?.node?.text || post.text;
  const thumbnail = https(media.display_url);
  // Respect the embed's explicit availability restriction.
  if (data.context?.copyright_blocked) return { ...post, thumbnail, text, unavailable: 'Open on Instagram', media: undefined };
  const video = https(media.video_url);
  return { ...post, thumbnail, text, media: video || (!media.is_video ? thumbnail : undefined), type: video ? 'video' : !media.is_video ? 'image' : post.type };
}
async function refresh(): Promise<Feeds> {
  const feeds: Feeds = structuredClone(seeds);
  feeds.instagram.posts = await Promise.all(feeds.instagram.posts.map(post => instagram(post).catch(error => { console.warn("Instagram embed unavailable", error.message); return post; })));
  cached = { feeds, until: Date.now() + 5 * 60_000 };
  return feeds;
}
export async function GET() {
  if (cached && cached.until > Date.now()) return Response.json(cached.feeds, { headers: { 'Cache-Control': 'public, max-age=60' } });
  pending ??= refresh().finally(() => { pending = null; });
  return Response.json(await pending, { headers: { 'Cache-Control': 'public, max-age=60' } });
}
