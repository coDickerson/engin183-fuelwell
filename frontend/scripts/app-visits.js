// Visit state shared by Today and Care team. Sample visits plus bookings kept in this browser session.
import { visits } from '../data/fung.js';
import { dateFromOffset, storage } from './app-ui.js';

const KEY = 'fuelwell.booked.v1';
const store = storage('session');

const toVisit = (v) => ({ ...v, iso: dateFromOffset(v.daysFromNow, v.hour, v.minute).toISOString() });

export function bookedVisits() {
  return store.get(KEY, []);
}

export function upcomingVisits() {
  const now = Date.now();
  return [...visits.upcoming.map(toVisit), ...bookedVisits()]
    .filter((v) => new Date(v.iso).getTime() > now)
    .sort((a, b) => new Date(a.iso) - new Date(b.iso));
}

export function pastVisits() {
  return visits.past.map(toVisit).sort((a, b) => new Date(b.iso) - new Date(a.iso));
}

export function bookVisit(iso, reason = 'Nutrition check-in') {
  const visit = { id: `b-${Date.now()}`, iso, title: reason, with: 'Mei Chen, RD (fictional)', mode: 'Video visit', minutes: 30, booked: true };
  store.set(KEY, [...bookedVisits(), visit]);
  return visit;
}

export function isTaken(iso) {
  const t = new Date(iso).getTime();
  return upcomingVisits().some((v) => new Date(v.iso).getTime() === t);
}

// Open sample slots on the next five weekdays.
export function openSlots() {
  const days = [];
  const times = [[9, 0], [10, 30], [13, 0], [15, 30]];
  for (let offset = 1; days.length < 5 && offset < 14; offset += 1) {
    const d = dateFromOffset(offset);
    if (d.getDay() === 0 || d.getDay() === 6) continue;
    const slots = times
      .filter((_, i) => (offset + i) % 3 !== 0) // a few slots are "taken" so the grid looks real
      .map(([h, m]) => dateFromOffset(offset, h, m).toISOString());
    days.push({ date: d, slots });
  }
  return days;
}

function icsDate(iso) {
  return new Date(iso).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

export function downloadIcs(visit) {
  const end = new Date(new Date(visit.iso).getTime() + (visit.minutes || 30) * 60000).toISOString();
  const text = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//FuelWell//Student demo//EN', 'BEGIN:VEVENT',
    `UID:${visit.id}@fuelwell.demo`, `DTSTAMP:${icsDate(new Date().toISOString())}`,
    `DTSTART:${icsDate(visit.iso)}`, `DTEND:${icsDate(end)}`,
    `SUMMARY:${visit.title} (sample)`, `DESCRIPTION:FuelWell demo visit with ${visit.with}. Sample data only.`,
    'END:VEVENT', 'END:VCALENDAR',
  ].join('\r\n');
  const url = URL.createObjectURL(new Blob([text], { type: 'text/calendar' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = 'fuelwell-visit.ics';
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
