// /stats: live totals from public.fuelwell_stats() (counts only, no personal data).
import { supabase } from '../auth/supabase.js';

const LABELS = {
  visitors: ['People who visited', 'people'],
  qr_visitors: ['Came from the QR code', 'people'],
  demo_opens: ['Opened the demo', 'people'],
  tries_finished: ['Finished a try (got an AI swap answer)', 'people'],
  swaps_saved: ['Swaps saved', 'saves'],
  signup_clicks: ['Tapped “Join the waitlist” in the demo', 'people'],
  waitlist_signups: ['Waitlist sign-ups', 'sign-ups'],
  accounts_created: ['Accounts created', 'accounts'],
};
const KEY = new Set(['visitors', 'tries_finished', 'waitlist_signups']);
const byId = (id) => document.getElementById(id);
const fmt = (n) => Number(n || 0).toLocaleString('en-US');

async function load() {
  const status = byId('status');
  if (!supabase) { status.textContent = 'Supabase is not configured on this copy of the site.'; return; }
  const { data, error } = await supabase.rpc('fuelwell_stats');
  if (error) { status.textContent = 'Could not load the numbers. Try Refresh.'; return; }
  byId('tiles').innerHTML = data.map((r) => {
    const [label, unit] = LABELS[r.metric] || [r.metric, ''];
    return `<li class="st-tile${KEY.has(r.metric) ? ' st-tile--key' : ''}"><p class="st-label">${label}</p><p class="st-num">${fmt(r.all_time)}</p><p class="st-sub">${fmt(r.today)} ${unit} today</p></li>`;
  }).join('');
  status.textContent = `Updated ${new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`;
}

byId('refresh').addEventListener('click', load);
load();
setInterval(load, 30_000);
