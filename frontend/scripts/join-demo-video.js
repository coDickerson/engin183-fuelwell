// /join "See it in action": the ~12 s demo video (tools/join-demo-video, edited from real captures of
// the live demo). Plays muted only while on screen, twice, then stops on its last frame (the congee
// answer). Captions are HTML so they follow the language buttons; the question bubble only shows
// during the Swap & eat out part. A pause/play button is always available (WCAG 2.2.2). With
// reduced motion, or if the video can't play, the page shows a still screenshot instead.

// Shot boundaries in seconds; must match tools/join-demo-video/src/JoinDemo.tsx (30 fps).
const SHOTS = [
  { until: 96 / 30, cap: 'vid_cap1' },
  { until: 196 / 30, cap: 'vid_cap2' },
  { until: Infinity, cap: 'vid_cap3', question: true },
];
const PLAYS = 2;

let t = (key) => key;
let state = null;

const ICONS = {
  pause: '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>',
  play: '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true"><path d="M8 5.5v13l11-6.5Z"/></svg>',
  replay: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 12a8 8 0 1 0 2.4-5.7"/><path d="M4 4v4.5h4.5"/></svg>',
};

function shotAt(time) {
  return SHOTS.find((s) => time < s.until) || SHOTS[SHOTS.length - 1];
}

function paint() {
  if (!state) return;
  const { video, cap, toggle, figure } = state;
  const shot = shotAt(video.currentTime || 0);
  if (cap.dataset.key !== shot.cap) {
    cap.dataset.key = shot.cap;
    cap.classList.remove('is-in');
    void cap.offsetWidth; // restart the fade
    cap.classList.add('is-in');
  }
  cap.textContent = t(shot.cap);
  figure.classList.toggle('is-asking', Boolean(shot.question));
  const mode = video.ended ? 'replay' : video.paused ? 'play' : 'pause';
  toggle.innerHTML = ICONS[mode];
  toggle.setAttribute('aria-label', t(mode === 'replay' ? 'vid_replay' : mode === 'play' ? 'vid_play' : 'vid_pause'));
}

function tick() {
  paint();
  if (state && !state.video.paused) requestAnimationFrame(tick);
}

function play() {
  const p = state.video.play();
  if (p && p.catch) p.catch(() => showStill());
}

function showStill() {
  if (!state) return;
  state.figure.classList.add('is-still');
  state.figure.classList.add('is-asking');
  state.toggle.hidden = true;
  state.video.pause();
}

export function relocaleDemoVideo(nextT) {
  t = nextT;
  paint();
}

export function initDemoVideo(nextT) {
  t = nextT;
  const figure = document.querySelector('[data-demo]');
  const video = figure?.querySelector('video');
  if (!figure || !video) return;
  const cap = figure.querySelector('[data-demo-cap]');
  const toggle = figure.querySelector('[data-demo-toggle]');
  state = { figure, video, cap, toggle, plays: 0, userPaused: false, visible: false };

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (reduced.matches || typeof IntersectionObserver === 'undefined') { showStill(); return; }

  toggle.hidden = false;
  video.addEventListener('play', () => requestAnimationFrame(tick));
  video.addEventListener('pause', paint);
  video.addEventListener('error', showStill, true);
  video.addEventListener('ended', () => {
    state.plays += 1;
    if (state.plays < PLAYS && !state.userPaused) {
      video.currentTime = 0;
      play();
    } else {
      paint(); // stays on the last frame (the congee answer)
    }
  });
  toggle.addEventListener('click', () => {
    if (video.ended) { state.plays = 0; state.userPaused = false; video.currentTime = 0; play(); return; }
    if (video.paused) { state.userPaused = false; play(); } else { state.userPaused = true; video.pause(); }
  });

  new IntersectionObserver(([entry]) => {
    state.visible = entry.isIntersecting;
    if (state.visible && video.paused && !video.ended && !state.userPaused && state.plays < PLAYS) play();
    if (!state.visible && !video.paused) video.pause();
  }, { threshold: 0.4 }).observe(figure);

  paint();
}
