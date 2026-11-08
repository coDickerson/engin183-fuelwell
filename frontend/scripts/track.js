// Anonymous usage counts for the class competition (public.app_events in Supabase).
// No names, emails or IPs: each browser gets a random visitor id. Totals: /stats.html.
// Also forwards the event to Vercel Analytics when its script is on the page.
const URL_BASE = import.meta.env.VITE_SUPABASE_URL?.trim();
const KEY = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();
const VISITOR = 'fuelwell.visitor.v1';
const SOURCE = 'fuelwell.source.v1';
const DEMO = 'fuelwell.demo.v1';

function get(store, key) { try { return window[store].getItem(key); } catch { return null; } }
function set(store, key, value) { try { window[store].setItem(key, value); } catch { /* storage unavailable */ } }

function uuid() {
  if (crypto.randomUUID) return crypto.randomUUID();
  const b = crypto.getRandomValues(new Uint8Array(16));
  b[6] = (b[6] & 0x0f) | 0x40; b[8] = (b[8] & 0x3f) | 0x80;
  const h = [...b].map((x) => x.toString(16).padStart(2, '0')).join('');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

function visitorId() {
  let id = get('localStorage', VISITOR);
  if (!id || !/^[0-9a-f-]{36}$/i.test(id)) { id = uuid(); set('localStorage', VISITOR, id); }
  return id;
}

/** Where this visit came from: ?src=qr (the QR code) or ?utm_source=…, kept for the tab session. */
function source() {
  const p = new URLSearchParams(location.search);
  const fromUrl = (p.get('src') || p.get('utm_source') || '').toLowerCase().replace(/[^a-z0-9_-]/g, '').slice(0, 40);
  if (fromUrl) set('sessionStorage', SOURCE, fromUrl);
  return get('sessionStorage', SOURCE) || null;
}

export const isDemoSession = () => get('sessionStorage', DEMO) === '1';
export function setDemoSession(on) { set('sessionStorage', DEMO, on ? '1' : '0'); }

/** Records one event. Never throws and never blocks the page. */
export function track(name, detail) {
  try { window.va?.('event', { name, ...(detail ? { data: { detail } } : {}) }); } catch { /* analytics unavailable */ }
  if (!URL_BASE || !KEY) return;
  const row = {
    name,
    visitor_id: visitorId(),
    path: location.pathname.slice(0, 120),
    source: source(),
    demo: isDemoSession(),
    detail: detail ? String(detail).slice(0, 80) : null,
  };
  try {
    fetch(`${URL_BASE}/rest/v1/app_events`, {
      method: 'POST',
      keepalive: true,
      headers: { apikey: KEY, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
      body: JSON.stringify(row),
    }).catch(() => {});
  } catch { /* offline or blocked */ }
}
