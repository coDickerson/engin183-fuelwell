import { authConfigError, supabase } from '../auth/supabase.js';

const byId = (id) => document.getElementById(id);
const form = byId('waitlist-form');
const errorBox = byId('form-error');
const submitButton = form.querySelector('[type="submit"]');
const params = new URLSearchParams(location.search);
const MESSAGES = {
  err_role: 'Please choose who you are.',
  err_name: 'Please enter your first name.',
  err_email: 'Please check your email address. It doesn’t look quite right.',
  err_network: 'We couldn’t reach the server. Check your connection and try again.',
  err_generic: 'Something went wrong. Please try again.',
  err_config: 'The waitlist isn’t connected yet. Please try again later.',
};

// Pre-select "How did you hear about us?" from ?ref=reddit / ?ref=facebook links.
const ref = params.get('ref')?.toLowerCase();
const heardFrom = byId('heard-from');
if ([...heardFrom.options].some((o) => o.value && o.value === ref)) heardFrom.value = ref;

// Wording of "your" vs "their" questions follows the chosen role.
form.querySelectorAll('input[name="role"]').forEach((input) => input.addEventListener('change', () => {
  byId('kidney-stage').labels[0].textContent = input.value === 'patient' ? 'Your kidney stage' : 'Their kidney stage';
  if (errorBox.dataset.key === 'err_role') showError(null);
}));

/* ---------- Submit ---------- */

function showError(key, field) {
  errorBox.dataset.key = key || '';
  errorBox.textContent = key ? MESSAGES[key] : '';
  errorBox.hidden = !key;
  form.querySelectorAll('[aria-invalid]').forEach((el) => el.removeAttribute('aria-invalid'));
  if (field) {
    field.setAttribute('aria-invalid', 'true');
    field.focus();
  }
}

const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
let submitted = { name: '', phone: false };

function readForm() {
  const data = new FormData(form);
  const text = (name) => (data.get(name) || '').toString().trim();
  return {
    first_name: text('first_name'),
    email: text('email').toLowerCase(),
    phone: text('phone') || null,
    role: text('role'),
    kidney_stage: text('kidney_stage') || null,
    interests: data.getAll('interests'),
    conditions: data.getAll('conditions'),
    heard_from: text('heard_from') || null,
  };
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const row = readForm();

  if (!row.role) return showError('err_role', form.querySelector('input[name="role"]'));
  if (!row.first_name) return showError('err_name', byId('first-name'));
  if (!EMAIL.test(row.email)) return showError('err_email', byId('email'));
  showError(null);

  submitted = { name: row.first_name, phone: Boolean(row.phone) };

  // Bots that fill the hidden field get the thank-you page without a saved row.
  if (byId('company').value) return showThanks();
  if (authConfigError) return showError('err_config');

  submitButton.setAttribute('aria-busy', 'true');
  submitButton.disabled = true;
  submitButton.textContent = 'Adding you…';
  try {
    const { error } = await supabase.from('waitlist_signups').insert(row);
    // 23505 = this email already joined; treat a repeat signup as success.
    if (error && error.code !== '23505') throw error;
    window.va?.('event', { name: 'waitlist_signup', data: { role: row.role } });
    showThanks();
  } catch (error) {
    const offline = /failed to fetch|network|load failed/i.test(error?.message || '');
    showError(offline ? 'err_network' : error?.code === '23514' ? 'err_email' : 'err_generic');
  } finally {
    submitButton.removeAttribute('aria-busy');
    submitButton.disabled = false;
    submitButton.textContent = 'Join the waitlist';
  }
});

/* ---------- Thank-you view ---------- */

function renderThanks() {
  byId('thanks-title').textContent = `Thank you, ${submitted.name}!`;
  byId('thanks-body').textContent = submitted.phone
    ? 'We’ll email or text you as soon as FuelWell is ready for early users.'
    : 'We’ll email you as soon as FuelWell is ready for early users.';
}

function showThanks() {
  renderThanks();
  byId('signup-view').hidden = true;
  byId('thanks-view').hidden = false;
  window.scrollTo({ top: 0 });
  byId('thanks-title').focus();
}

byId('share-button').addEventListener('click', async () => {
  const url = new URL('/waitlist', location.origin);
  const status = byId('share-status');
  try {
    if (navigator.share) {
      await navigator.share({ title: 'FuelWell', text: 'FuelWell plans kidney-friendly meals around the food your family already eats. Join the waitlist:', url: url.href });
      return;
    }
    await navigator.clipboard.writeText(`FuelWell plans kidney-friendly meals around the food your family already eats. Join the waitlist: ${url.href}`);
    status.textContent = 'Link copied';
  } catch (error) {
    if (error?.name !== 'AbortError') status.textContent = url.href;
  }
});
