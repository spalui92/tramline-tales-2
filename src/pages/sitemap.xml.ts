import { tales, newestFirst, absolute, cfg } from '../lib/site';

export function GET() {
  const urls = [[absolute(), newestFirst[0]?.date ?? cfg.start], ...tales.map((t) => [absolute(`tales/${t.slug}/`), t.date])];
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(([u, d]) => `  <url><loc>${u}</loc><lastmod>${d}</lastmod></url>`).join('\n')}
</urlset>
`;
  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
}
