// Today: a three-zone bar (On track / Getting close / Talk to your dietitian) with no numbers.
// The zone comes from this week's planned meals in fung.js compared with Fung's daily targets;
// the numbers stay behind the scenes so the page reads as a simple range.
import { esc, icon } from '../app-ui.js';
import { lang, tr } from '../i18n.js';
import { mealSlots, targets, week } from '../../data/fung.js';
import { pt } from './strings.js';

const ZONES = ['ok', 'close', 'talk'];
const CLOSE_AT = 0.8; // 80% of the daily target
const OVER_AT = 1.0;

// How full each nutrient's day is on average across the planned week, as a share of the target.
function weeklyShare() {
  return ['k', 'p', 'na'].map((key) => {
    const daily = week.reduce((sum, day) => sum + mealSlots.reduce((s, slot) => s + day[slot.key][key], 0), 0) / week.length;
    return { key, share: daily / targets[key].target };
  });
}

const zoneFor = (share) => (share > OVER_AT ? 'talk' : share >= CLOSE_AT ? 'close' : 'ok');

// Marker position: each zone is one third of the bar.
function markerPercent(share) {
  if (share < CLOSE_AT) return (share / CLOSE_AT) * 33;
  if (share <= OVER_AT) return 33 + ((share - CLOSE_AT) / (OVER_AT - CLOSE_AT)) * 33;
  return 67 + Math.min((share - OVER_AT) / 0.3, 1) * 30;
}

export function renderZoneBar(box) {
  const worst = weeklyShare().sort((a, b) => b.share - a.share)[0];
  const zone = zoneFor(worst.share);
  // Spanish puts the nutrient mid-sentence ("El fósforo…"), so it is lower-cased there.
  const name = tr(targets[worst.key].label);
  const nutrient = lang() === 'es' ? name.toLowerCase() : name;
  const pos = Math.max(4, Math.min(96, markerPercent(worst.share)));
  box.innerHTML = `<div class="panel-title"><h2 id="zone-title">${esc(pt('zone_title'))}</h2></div>
    <div class="zone-bar" role="img" aria-label="${esc(pt('zone_aria', { zone: pt(`zone_${zone}`) }))}">
      <div class="zone-track" aria-hidden="true">${ZONES.map((z) => `<span class="zone-seg zone-seg--${z}${z === zone ? ' is-current' : ''}"></span>`).join('')}</div>
      <span class="zone-marker zone-marker--${zone}" style="left:${pos}%" aria-hidden="true"></span>
      <div class="zone-labels" aria-hidden="true">${ZONES.map((z) => `<span class="${z === zone ? 'is-current' : ''}">${esc(pt(`zone_${z}`))}</span>`).join('')}</div>
    </div>
    <p class="zone-status zone-status--${zone}">${icon(zone === 'ok' ? 'check' : 'alert')}<strong>${esc(pt(`zone_${zone}`))}</strong></p>
    <p class="zone-why">${esc(zone === 'ok' ? pt('zone_ok_why') : pt(`zone_${zone}_why`, { nutrient }))} ${zone === 'ok' ? '' : esc(pt(`zone_tip_${worst.key}`))}</p>
    <p class="zone-foot"><span class="muted">${esc(pt('zone_basis'))}</span>
      ${zone === 'talk'
        ? `<a class="button" href="/care-team.html#messages">${esc(pt('zone_message_mei'))}</a>`
        : `<a class="link-arrow" href="/notes.html">${esc(pt('zone_see_guide'))} ${icon('arrow')}</a>`}</p>`;
}
