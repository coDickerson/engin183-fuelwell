// Care FAQ knowledge base + small BM25 retriever, the code-enforced red-flag rules,
// and the sample dietitian slot generator used by inquiry-triage.
// All content is general education written for a student demo, not medical advice.

export interface FaqEntry {
  id: string;
  topic: 'diet' | 'scheduling' | 'insurance' | 'labs' | 'caregiver' | 'safety';
  q: string;
  a: string;
  tags: string[];
}

export const FAQ: FaqEntry[] = [
  {
    id: 'diet-potassium', topic: 'diet', q: 'Which foods are high in potassium?',
    a: 'Potatoes, taro, tomatoes, bananas, oranges, spinach, dried mushrooms and beans are higher in potassium. Lower choices include napa cabbage, cucumber, bean sprouts, white rice and rice noodles. Portion size matters as much as the food. The care team sets each person\'s potassium target from their labs.',
    tags: ['potassium', 'fruit', 'vegetable', 'banana', 'potato', 'food', 'eat'],
  },
  {
    id: 'diet-sodium', topic: 'diet', q: 'How can we cut sodium without losing flavour?',
    a: 'Most sodium in home cooking comes from soy sauce, fish sauce, doenjang, gochujang, broth cubes, MSG and pickles. Try low-sodium soy sauce, half the fish sauce with lime, homemade unsalted stock, and more ginger, garlic, scallion, vinegar and herbs. Salt substitutes often contain potassium, so ask the care team before using one.',
    tags: ['sodium', 'salt', 'soy', 'sauce', 'fish sauce', 'flavour', 'flavor', 'msg', 'seasoning'],
  },
  {
    id: 'diet-phosphorus', topic: 'diet', q: 'What should we know about phosphorus and additives?',
    a: 'Phosphate additives in processed meats, cola drinks, processed cheese and some packaged foods are absorbed far more than the phosphorus in fresh food. Look for "phos" in ingredient lists (for example sodium phosphate). Fresh meat, fish, tofu and eggs in moderate portions are usually a better choice.',
    tags: ['phosphorus', 'phosphate', 'additives', 'processed', 'label', 'cola', 'binder'],
  },
  {
    id: 'diet-protein', topic: 'diet', q: 'How much protein is right at stage 3b-4?',
    a: 'Many people with CKD stage 3b-4 who are not on dialysis are advised to keep protein moderate, often guided by body weight. A palm-sized portion of fish, chicken, pork or tofu per meal is a common starting point, but the exact amount should come from the renal dietitian.',
    tags: ['protein', 'meat', 'tofu', 'egg', 'fish', 'portion', 'stage'],
  },
  {
    id: 'diet-rice', topic: 'diet', q: 'Can my parent still eat rice and noodles?',
    a: 'Yes, usually. White rice and rice noodles are lower in potassium and phosphorus than brown rice or whole grains, which is why they often fit a kidney-friendly plate. Watch the sauces and broths served with them, which carry most of the sodium.',
    tags: ['rice', 'noodles', 'congee', 'pho', 'carbs', 'grain'],
  },
  {
    id: 'diet-fluids', topic: 'diet', q: 'Do soups and fluids need limits?',
    a: 'Some people need a fluid limit and some do not; it depends on kidney function, swelling and heart health. Soups count as fluid and are often salty. Ask the care team whether there is a fluid target before changing how much soup or tea your parent drinks.',
    tags: ['fluid', 'water', 'soup', 'broth', 'drink', 'tea', 'swelling'],
  },
  {
    id: 'sched-dietitian', topic: 'scheduling', q: 'How do we book a visit with the renal dietitian?',
    a: 'FuelWell can suggest open times with a renal dietitian. Pick a slot that works for you and your parent, and add any dishes or questions you want to cover. Visits in this demo are sample slots only.',
    tags: ['appointment', 'book', 'schedule', 'dietitian', 'visit', 'slot', 'meet', 'time'],
  },
  {
    id: 'sched-reschedule', topic: 'scheduling', q: 'How do we reschedule or join together?',
    a: 'You can reschedule from the care team tab. Family members are welcome to join a video visit; it often helps to have the person who cooks at home in the conversation.',
    tags: ['reschedule', 'cancel', 'change', 'video', 'join', 'family', 'together'],
  },
  {
    id: 'ins-coverage', topic: 'insurance', q: 'Does insurance cover renal nutrition visits?',
    a: 'In the US, Medicare Part B covers medical nutrition therapy for people with CKD (not on dialysis) when referred by a doctor, and many private plans do too. Call the number on the insurance card and ask about "medical nutrition therapy" for kidney disease.',
    tags: ['insurance', 'medicare', 'coverage', 'cost', 'pay', 'bill', 'billing', 'copay', 'mnt'],
  },
  {
    id: 'ins-bill', topic: 'insurance', q: 'Who do we ask about a bill?',
    a: 'Billing questions go to the clinic\'s billing office. Have the visit date and the statement handy. FuelWell does not process payments in this demo.',
    tags: ['bill', 'billing', 'invoice', 'charge', 'payment', 'statement'],
  },
  {
    id: 'labs-potassium', topic: 'labs', q: 'What does a high potassium result mean?',
    a: 'A high potassium result is something the kidney care team should see quickly; they may adjust diet or medicines. Very high potassium can cause muscle weakness or an irregular heartbeat, which needs emergency care. Do not change medicines on your own.',
    tags: ['potassium', 'lab', 'labs', 'result', 'blood test', 'high', 'level'],
  },
  {
    id: 'labs-egfr', topic: 'labs', q: 'What is eGFR?',
    a: 'eGFR estimates how well the kidneys filter. Stage 3b is about 30-44 and stage 4 is about 15-29. One result can vary; the care team looks at the trend over time.',
    tags: ['egfr', 'gfr', 'creatinine', 'stage', 'kidney function', 'lab', 'result'],
  },
  {
    id: 'labs-prep', topic: 'labs', q: 'How do we prepare for lab day?',
    a: 'Follow the lab instructions about fasting. Bring a list of medicines and supplements, including herbal remedies, because some affect potassium and kidney labs.',
    tags: ['lab', 'blood test', 'fasting', 'prepare', 'medicines', 'supplements', 'herbal'],
  },
  {
    id: 'care-role', topic: 'caregiver', q: 'How can I help my parent without taking over?',
    a: 'Ask what dishes matter most and change one thing at a time. Cook together, keep shared notes of questions for the care team, and let your parent lead decisions where possible. Caregiving is a lot; it is fine to ask the team for help too.',
    tags: ['caregiver', 'parent', 'mom', 'dad', 'help', 'family', 'support', 'stress'],
  },
  {
    id: 'safety-urgent', topic: 'safety', q: 'When is it an emergency?',
    a: 'Call 911 for chest pain, trouble breathing, fainting, sudden confusion, or a seizure. Call the kidney care team the same day for no urine, sudden or severe swelling, muscle weakness, or a racing or irregular heartbeat.',
    tags: ['emergency', 'urgent', '911', 'chest pain', 'breathing', 'faint', 'confused', 'swelling'],
  },
];

const STOP = new Set(
  'a an and are as at be but by can do does for from has have how i if in is it its me my of on or our so that the their them they this to was we what when which who why will with you your'
    .split(' '),
);

function tokens(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 1 && !STOP.has(t))
    .map((t) => (t.length > 4 && t.endsWith('s') ? t.slice(0, -1) : t));
}

const DOCS = FAQ.map((f) => tokens(`${f.q} ${f.a} ${f.tags.join(' ')} ${f.tags.join(' ')}`));
const AVG_LEN = DOCS.reduce((s, d) => s + d.length, 0) / DOCS.length;
const DF = new Map<string, number>();
for (const doc of DOCS) for (const t of new Set(doc)) DF.set(t, (DF.get(t) ?? 0) + 1);

/** BM25 (k1 = 1.2, b = 0.75) over question + answer + tags (tags weighted x2). */
export function searchFaq(query: string, limit = 3): { entry: FaqEntry; score: number }[] {
  const qTokens = [...new Set(tokens(query))];
  const N = DOCS.length;
  const scored = DOCS.map((doc, i) => {
    let score = 0;
    for (const t of qTokens) {
      const tf = doc.filter((d) => d === t).length;
      if (!tf) continue;
      const df = DF.get(t) ?? 0;
      const idf = Math.log(1 + (N - df + 0.5) / (df + 0.5));
      score += idf * ((tf * 2.2) / (tf + 1.2 * (1 - 0.75 + (0.75 * doc.length) / AVG_LEN)));
    }
    return { entry: FAQ[i], score: Math.round(score * 100) / 100 };
  });
  return scored.filter((s) => s.score > 0).sort((a, b) => b.score - a.score).slice(0, limit);
}

// ---------------------------------------------------------------------------
// Red flags: deterministic and code-enforced. The model may call the tool, but the
// function ALSO runs it on the raw message and overrides the model's urgency.
// Deliberately over-inclusive (no negation handling): a false alarm costs a phone
// call, a miss could cost much more.
// ---------------------------------------------------------------------------
export const RED_FLAG_RULES: { label: string; pattern: RegExp }[] = [
  { label: 'chest pain', pattern: /\bchest\s+(pain|pressure|tight\w*|hurts?|discomfort)|\bpain\s+in\s+(his|her|their|my|the)\s+chest/i },
  { label: 'trouble breathing', pattern: /\b(short(ness)?\s+of\s+breath|trouble\s+breathing|hard\s+to\s+breathe|can'?t\s+breathe|cannot\s+breathe|difficulty\s+breathing|gasping|struggling\s+to\s+breathe|breathless)/i },
  { label: 'confusion', pattern: /\b(is|was|seems|seemed|looks|looked|acting|became|becoming|getting|suddenly|very)\s+(\w+\s+)?(confused|disoriented)\b|\b(new|sudden)\s+confusion\b|doesn'?t\s+recogni[sz]e|very\s+drowsy|hard\s+to\s+wake/i },
  { label: 'no urine', pattern: /\b(no\s+urine|not\s+(peeing|urinating)|hasn'?t\s+(peed|urinated)|stopped\s+(peeing|urinating)|can'?t\s+(pee|urinate)|no\s+pee)\b/i },
  { label: 'severe swelling', pattern: /\b(severe|sudden|very\s+bad|really\s+bad|massive)\s+(swelling|swollen|edema)|\bswollen\s+(face|throat|tongue)|\bswelling\s+(is\s+)?(getting\s+)?(much\s+)?worse/i },
  { label: 'muscle weakness (possible very high potassium)', pattern: /\b(muscle\s+weakness|very\s+weak|sudden(ly)?\s+weak|can'?t\s+(stand|walk|lift)|legs?\s+(gave|giving)\s+out|numb(ness)?\s+and\s+weak|paraly[sz]\w*)\b/i },
  { label: 'irregular heartbeat (possible very high potassium)', pattern: /\b(irregular\s+heart\s*beat|heart\s+(is\s+)?(racing|pounding|skipping|fluttering|flutters|skips)|palpitations?|heart\s+rhythm|arrhythmia)\b/i },
  { label: 'fainting', pattern: /\b(faint(ed|ing)?|passed\s+out|pass(ing)?\s+out|black(ed)?\s+out|lost\s+consciousness|unresponsive|collapsed?)\b/i },
  { label: 'seizure', pattern: /\b(seizure|convulsion)\w*/i },
];

export function checkRedFlags(text: string): { red_flag: boolean; matches: string[] } {
  const matches = RED_FLAG_RULES.filter((r) => r.pattern.test(text)).map((r) => r.label);
  return { red_flag: matches.length > 0, matches };
}

export function escalationMessage(name: string | null, matches: string[]): string {
  const who = name ?? 'your parent';
  return `This could be urgent (${matches.join(', ')}). If ${who} has chest pain, trouble breathing, has fainted or is confused, call 911 now. Otherwise call the kidney care team right away. Don't wait for a message reply.`;
}

// ---------------------------------------------------------------------------
// Sample dietitian slots: weekdays, 9am-4pm America/Los_Angeles, from tomorrow.
// ---------------------------------------------------------------------------
const TZ = 'America/Los_Angeles';
const SLOT_TIMES: [number, number][] = [[9, 30], [11, 0], [13, 30], [15, 0]];

function pacificOffsetMinutes(utc: Date): number {
  const part = new Intl.DateTimeFormat('en-US', { timeZone: TZ, timeZoneName: 'shortOffset' })
    .formatToParts(utc)
    .find((p) => p.type === 'timeZoneName')?.value ?? 'GMT-8';
  const m = part.match(/GMT([+-])(\d{1,2})(?::(\d{2}))?/);
  if (!m) return -480;
  const sign = m[1] === '-' ? -1 : 1;
  return sign * (Number(m[2]) * 60 + Number(m[3] ?? 0));
}

function pacificParts(d: Date): { y: number; m: number; day: number; weekday: string } {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: TZ, year: 'numeric', month: 'numeric', day: 'numeric', weekday: 'short',
  }).formatToParts(d);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '';
  return { y: Number(get('year')), m: Number(get('month')), day: Number(get('day')), weekday: get('weekday') };
}

/** Convert a Pacific wall-clock time to a UTC Date (handles PST/PDT). */
function pacificToUtc(y: number, m: number, d: number, hh: number, mm: number): Date {
  const guess = new Date(Date.UTC(y, m - 1, d, hh, mm));
  const offset = pacificOffsetMinutes(guess);
  return new Date(guess.getTime() - offset * 60_000);
}

export interface Slot {
  iso: string;
  label: string;
}

export function openSlots(preference: string | null, now = new Date(), count = 4): Slot[] {
  const pref = (preference ?? '').toLowerCase();
  const wantMorning = /morning|\bam\b|early/.test(pref);
  const wantAfternoon = /afternoon|\bpm\b|after\s+lunch|later/.test(pref);
  const dayNames = ['mon', 'tue', 'wed', 'thu', 'fri'];
  const wantDays = dayNames.filter((d) => pref.includes(d));

  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: TZ, weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
  });
  const slots: Slot[] = [];
  const today = pacificParts(now);
  for (let offset = 1; offset <= 21 && slots.length < count; offset += 1) {
    const base = new Date(Date.UTC(today.y, today.m - 1, today.day + offset, 12));
    const p = pacificParts(base);
    const wd = p.weekday.toLowerCase().slice(0, 3);
    if (!dayNames.includes(wd)) continue;
    if (wantDays.length && !wantDays.includes(wd)) continue;
    // Spread suggestions: at most two per day.
    let perDay = 0;
    for (const [hh, mm] of SLOT_TIMES) {
      if (wantMorning && hh >= 12) continue;
      if (wantAfternoon && hh < 12) continue;
      if (perDay >= 2 || slots.length >= count) break;
      // Deterministic "already booked" pattern so the list looks realistic.
      if ((p.day + hh) % 3 === 0) continue;
      const at = pacificToUtc(p.y, p.m, p.day, hh, mm);
      slots.push({ iso: at.toISOString(), label: `${fmt.format(at)} PT · Renal dietitian (video)` });
      perDay += 1;
    }
  }
  return slots;
}
