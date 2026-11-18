import test from 'node:test';
import assert from 'node:assert/strict';
import { makePromptContext, retrieveContext, rulesAnswer, workflowFor } from '../../supabase/functions/_shared/chat-rag.mjs';

const fung = { id: 'patient-fung', display_name: 'Fung', ckd_stage: 'g3b', on_dialysis: false, cuisine: 'Cantonese' };
const sam = { id: 'patient-sam', display_name: 'Sam', ckd_stage: 'g5d', on_dialysis: true };
const plan = { id: 'plan-1', patient_id: fung.id, status: 'reviewed', reviewed_at: '2026-11-05', title: 'Clinic plan', source_text: 'Use the dietitian’s recorded sodium target.\n\nAsk about sauces.' };

test('reviewed plan is retrieved only for its own patient', () => {
  assert.ok(retrieveContext({ message: 'sauce', profile: fung, reviewedPlans: [plan] }).some((doc) => doc.kind === 'reviewed-plan'));
  assert.equal(retrieveContext({ message: 'sauce', profile: sam, reviewedPlans: [plan] }).some((doc) => doc.kind === 'reviewed-plan'), false);
});

test('pending uploads cannot enter model context', () => {
  const docs = retrieveContext({ message: 'sodium', profile: fung, reviewedPlans: [{ ...plan, status: 'pending' }] });
  assert.equal(docs.some((doc) => doc.kind === 'reviewed-plan'), false);
});

test('dialysis-only guidance is excluded for a non-dialysis profile', () => {
  assert.equal(retrieveContext({ message: 'restaurant menu', profile: fung }).some((doc) => doc.population === 'dialysis'), false);
  assert.ok(retrieveContext({ message: 'restaurant menu', profile: sam }).some((doc) => doc.population === 'dialysis'));
});

test('workflow and prompt context are explicit', () => {
  assert.equal(workflowFor('Can I order from this restaurant menu?'), 'menu');
  assert.equal(workflowFor('Adapt lo mein'), 'meal');
  assert.match(makePromptContext({ profile: fung, documents: [], workflow: 'meal', language: 'en' }).patient, /dialysis no/);
});

test('general guidance works without a patient profile or plan', () => {
  const docs = retrieveContext({ message: 'less salt in soup', profile: null });
  assert.ok(docs.length > 0);
  assert.equal(docs.some((doc) => doc.kind === 'reviewed-plan'), false);
  assert.match(makePromptContext({ profile: null, documents: docs, workflow: 'meal', language: 'en' }).patient, /No patient profile/);
});

test('rules answer identifies general sources and withholds personal targets', () => {
  const docs = retrieveContext({ message: 'restaurant menu', profile: null });
  const answer = rulesAnswer({ profile: null, documents: docs, workflow: 'menu', language: 'en' });
  assert.match(answer, /Personal nutrient targets are unavailable/);
  assert.match(answer, /Add a patient profile/);
  assert.match(answer, /\[nkf-/);
});
