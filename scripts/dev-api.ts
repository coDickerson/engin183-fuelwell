// Local stand-in for Vercel's /api functions, so `npm run dev` works without the Vercel CLI.
// Vite (port 5173) forwards /api/* here (see vite.config.js). Run: npm run dev:api
import { createServer } from 'node:http';
import { listCatalog, runRoute } from '../api/_lib/routes.js';
import type { Mode } from '../api/_lib/schemas.js';

const PORT = Number(process.env.API_PORT ?? 8787);
const MAX_BODY = 5_000_000;
const ROUTES: Record<string, Mode> = { '/api/swap': 'swap', '/api/eatout': 'eatout', '/api/recipe': 'recipe' };

createServer(async (req, res) => {
  const send = (status: number, body: unknown) => {
    res.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
    res.end(JSON.stringify(body));
  };
  const path = (req.url ?? '').split('?')[0];
  if (path === '/api/catalog') {
    if (req.method !== 'GET') return send(405, { error: 'Use GET.' });
    const r = await listCatalog();
    return send(r.status, r.body);
  }
  const mode = ROUTES[path];
  if (!mode) return send(404, { error: 'Not found' });
  if (req.method !== 'POST') return send(405, { error: 'Use POST.' });
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > MAX_BODY) return send(413, { error: 'That request is too large.' });
    chunks.push(chunk);
  }
  let body: unknown = null;
  try { body = JSON.parse(Buffer.concat(chunks).toString('utf8') || 'null'); } catch { return send(400, { error: 'Bad JSON.' }); }
  const result = await runRoute(mode, body);
  send(result.status, result.body);
}).listen(PORT, () => console.log(`FuelWell API on http://localhost:${PORT}  (/api/swap, /api/eatout, /api/recipe, /api/catalog)`));
