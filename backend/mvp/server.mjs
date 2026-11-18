import { createServer } from 'node:http';
import { profiles } from './profiles.mjs';
import { analyze } from './engine.mjs';

const port = Number(process.env.FUELWELL_MVP_PORT || 8787);
const send = (res, status, body) => { res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }); res.end(JSON.stringify(body)); };

export const server = createServer(async (req, res) => {
  if (req.method === 'GET' && req.url === '/api/health') return send(res, 200, { ok: true, service: 'fuelwell-local-mvp' });
  if (req.method === 'GET' && req.url === '/api/profiles') return send(res, 200, { profiles: Object.values(profiles) });
  if (req.method === 'POST' && req.url === '/api/analyze') {
    try {
      let raw = '';
      for await (const chunk of req) { raw += chunk; if (raw.length > 10000) return send(res, 413, { error: 'Request too large.' }); }
      return send(res, 200, analyze(JSON.parse(raw)));
    } catch (error) { return send(res, error instanceof RangeError || error instanceof SyntaxError ? 400 : 500, { error: error.message }); }
  }
  return send(res, 404, { error: 'Unknown route.' });
});

if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  server.listen(port, '127.0.0.1', () => console.log(`FuelWell local MVP API: http://127.0.0.1:${port}`));
}
