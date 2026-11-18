import test from 'node:test';
import assert from 'node:assert/strict';
import { analyze } from './engine.mjs';

test('lo mein uses food records and reduces the example sodium estimate', () => {
  const { response } = analyze({ patientId: 'fung', mode: 'meal', message: 'Chicken lo mein with soy sauce' });
  assert.equal(response.kind, 'meal');
  assert.ok(response.before.sodiumMg > response.after.sodiumMg);
  assert.ok(response.after.ingredients.every((ingredient) => ingredient.source));
  assert.ok(response.evidence.length > 0);
});

test('dialysis profile changes the guidance context', () => {
  const result = analyze({ patientId: 'sam', mode: 'meal', message: 'Chicken lo mein' });
  assert.match(result.patient.condition, /hemodialysis/);
  assert.match(result.response.summary, /dialysis dietitian/);
  assert.equal(result.patient.plan.targets.protein, null);
});

test('non-dialysis profile never retrieves dialysis-only guidance', () => {
  const result = analyze({ patientId: 'fung', mode: 'menu', message: 'Steamed fish with rice; Fried chicken with sauce' });
  assert.equal(result.response.evidence.some((item) => item.population === 'dialysis'), false);
  assert.equal(result.response.items.some((item) => item.reasons.some((reason) => /dialysis dietitian/i.test(reason))), false);
});

test('unknown meal does not invent nutrient totals', () => {
  const { response } = analyze({ patientId: 'fung', mode: 'meal', message: 'Family casserole' });
  assert.equal(response.after, null);
  assert.match(response.summary, /ingredients|portions/i);
});

test('menu comparison flags preparation uncertainty', () => {
  const { response } = analyze({ patientId: 'fung', mode: 'menu', message: 'Steamed fish with rice; Fried chicken with sauce' });
  assert.equal(response.items[0].name, 'Steamed fish with rice');
  assert.equal(response.items[1].category, 'Ask before ordering');
  assert.match(response.summary, /not nutrient calculations/);
});
