// Downloads the National Kidney Foundation sources listed in data/guidelines/sources.json:
//   kind "web"          -> saves the article text as a .txt file (with its URL at the top)
//   kind "pdf-download" -> saves the PDF
//   kind "pdf"          -> you download it by hand; this script only tells you if it is missing
//
// Run: npm run fetch:guidelines     (safe to run again; it overwrites the saved copies)
import { existsSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { loadSources, GUIDELINE_DIR } from './lib/sources.js';

const UA = 'Mozilla/5.0 (compatible; FuelWell student prototype)';

const ENTITIES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', rsquo: '’', lsquo: '‘', rdquo: '”', ldquo: '“', ndash: '–', mdash: '—', hellip: '…' };
function decode(s: string): string {
  return s
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&([a-z]+);/gi, (m, n) => ENTITIES[n.toLowerCase()] ?? m);
}

/** Pulls the article out of an NKF page: from the <h1> to the end of the body copy. */
export function articleText(html: string): string {
  const start = html.indexOf('<h1');
  let end = html.indexOf('bottom-content', start);
  if (end < 0) end = html.indexOf('<footer', start);
  let seg = html.slice(start >= 0 ? start : 0, end > start ? end : undefined);
  seg = seg.replace(/<(script|style|svg|nav|button|form)[\s\S]*?<\/\1>/gi, '');
  seg = seg.replace(/<h1[^>]*>/gi, '\n# ').replace(/<h[2-3][^>]*>/gi, '\n## ').replace(/<h[4-6][^>]*>/gi, '\n### ');
  seg = seg.replace(/<li[^>]*>/gi, '\n- ').replace(/<(p|br|div|tr|section|article)[^>]*>/gi, '\n');
  seg = decode(seg.replace(/<[^>]+>/g, ''));
  const lines = seg.split('\n').map((l) => l.replace(/[ \t ]+/g, ' ').trim());
  const out: string[] = [];
  let skipToc = false;
  for (const line of lines) {
    if (/^#+ Table of Contents/i.test(line)) { skipToc = true; continue; }
    if (skipToc && line.startsWith('#')) skipToc = false;
    if (skipToc || line === 'Back to Top' || line === '-') continue;
    if (!line && out.at(-1) === '') continue;
    out.push(line);
  }
  return out.join('\n').trim();
}

async function main() {
  const sources = await loadSources();
  await mkdir(GUIDELINE_DIR, { recursive: true });
  for (const s of sources) {
    const file = path.join(GUIDELINE_DIR, s.file);
    if (s.kind === 'pdf') {
      console.log(`${existsSync(file) ? 'have   ' : 'MISSING'}  ${s.id}  ->  download from ${s.url} and save as data/guidelines/${s.file}`);
      continue;
    }
    const res = await fetch(s.url, { headers: { 'User-Agent': UA } });
    if (!res.ok) { console.log(`FAILED   ${s.id}  HTTP ${res.status}  ${s.url}`); continue; }
    if (s.kind === 'pdf-download') {
      await writeFile(file, Buffer.from(await res.arrayBuffer()));
    } else {
      const body = articleText(await res.text());
      await writeFile(file, `Title: ${s.title}\nURL: ${s.url}\nFetched: ${new Date().toISOString().slice(0, 10)}\n\n${body}\n`);
    }
    console.log(`saved    ${s.id}  ->  data/guidelines/${s.file}`);
  }
}

main().catch((err) => { console.error(err); process.exit(1); });
