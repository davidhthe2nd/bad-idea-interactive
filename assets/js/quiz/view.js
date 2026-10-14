// All DOM reads and writes for the quiz. Every string the page shows is
// already in the markup behind a literal data-i18n key; this module only ever
// toggles `hidden` and updates data-i18n-vars, then asks i18n.js to re-render.
// It never sets textContent from a string it built itself.
import { bookingUrl } from './scoring.js';

const root = document.querySelector('.quiz-container');

const screens = {};
root.querySelectorAll('[data-screen]').forEach((el) => {
  screens[el.getAttribute('data-screen')] = el;
});

// Updating the numbers in a sentence: set the element's vars and let i18n.js
// substitute them into the translated string. refreshI18n returns false before
// the first language has resolved, which is harmless — the initial
// DOMContentLoaded pass reads whatever vars are on the element by then.
function setVars(el, vars) {
  const pairs = Object.keys(vars).map((name) => name + ':' + vars[name]);
  el.setAttribute('data-i18n-vars', pairs.join(','));
  if (typeof window.refreshI18n === 'function') window.refreshI18n(el);
}

function show(el, visible) {
  el.hidden = !visible;
}

// Shows exactly one of a group of pre-rendered variants, by attribute value.
function showOnly(container, attr, value) {
  container.querySelectorAll('[' + attr + ']').forEach((el) => {
    show(el, el.getAttribute(attr) === value);
  });
}

export function showScreen(name, visible) {
  show(screens[name], visible);
}

export function onlyScreen(name) {
  Object.keys(screens).forEach((key) => show(screens[key], key === name));
}

export function selectedStage() {
  const checked = screens.intro.querySelector('input[name="quiz-stage"]:checked');
  return checked ? checked.value : null;
}

export function showQuestion(questionId, index, total) {
  const screen = screens.questions;
  showOnly(screen.querySelector('.quiz-statements'), 'data-question', questionId);

  setVars(screen.querySelector('.quiz-progress'), { current: index + 1, total });

  const fill = screen.querySelector('.quiz-progress-fill');
  if (fill) fill.style.width = Math.round(((index + 1) / total) * 100) + '%';

  // On the first statement, Back would leave the quiz rather than step within
  // it, so it is hidden instead of becoming a trap.
  show(screen.querySelector('.quiz-back'), index > 0);
}

export function markAnswered(questionId, answer) {
  const screen = screens.questions;
  screen.querySelectorAll('[data-answer]').forEach((btn) => {
    const isCurrent = btn.getAttribute('data-answer') === answer;
    btn.classList.toggle('is-selected', isCurrent);
    btn.setAttribute('aria-pressed', isCurrent ? 'true' : 'false');
  });
  screen.setAttribute('data-current-question', questionId);
}

export function clearAnswerMarks() {
  screens.questions.querySelectorAll('[data-answer]').forEach((btn) => {
    btn.classList.remove('is-selected');
    btn.setAttribute('aria-pressed', 'false');
  });
}

export function renderResult(result, total) {
  const screen = screens.result;
  setVars(screen.querySelector('.quiz-total'), { score: result.total, total });
  showOnly(screen, 'data-band', result.band);
}

export function renderBreakdown(result, config, gateEnabled) {
  const screen = screens.breakdown;

  result.clusters.forEach((cluster) => {
    const card = screen.querySelector('[data-cluster="' + cluster.id + '"]');
    if (!card) return;
    setVars(card.querySelector('.quiz-cluster-score'), { score: cluster.score });
    showOnly(card, 'data-status', cluster.status);
    show(card.querySelector('.quiz-cluster-weak'), cluster.showWeakLine);
    card.setAttribute('data-status-current', cluster.status || '');
  });

  // Singular and plural are two complete sentences in the content file; at
  // zero, neither is shown.
  const one = screen.querySelector('[data-notsure="one"]');
  const many = screen.querySelector('[data-notsure="many"]');
  show(one, result.notSureCount === 1);
  show(many, result.notSureCount > 1);
  if (result.notSureCount > 1) setVars(many, { count: result.notSureCount });

  screen.querySelectorAll('.quiz-cta').forEach((cta) => {
    const band = cta.getAttribute('data-band');
    const isCurrent = band === result.band;
    show(cta, isCurrent);
    if (isCurrent) cta.setAttribute('href', bookingUrl(band, config));
  });

  // The PDF is the gated half of the offer, so with the gate off there is
  // nothing to download and the button stays hidden.
  const pdf = screen.querySelector('#quiz-pdf');
  show(pdf, gateEnabled);
  if (gateEnabled) pdf.setAttribute('href', config.gate.pdfUrl);
}

export function gateElements() {
  const screen = screens.gate;
  return {
    screen,
    form: screen.querySelector('#quiz-gate-form'),
    email: screen.querySelector('#quiz-email'),
    consentResults: screen.querySelector('#quiz-consent-results'),
    consentNewsletter: screen.querySelector('#quiz-consent-newsletter'),
    submit: screen.querySelector('#quiz-gate-submit'),
    privacyLink: screen.querySelector('#quiz-privacy-link'),
  };
}

export function showGateStatus(name) {
  screens.gate.querySelectorAll('.quiz-gate-status').forEach((el) => {
    show(el, el.getAttribute('data-status') === name);
  });
}

export function showGateSuccess(visible) {
  show(screens.breakdown.querySelector('.quiz-gate-success'), visible);
}

// Cosmetic, and deliberately unable to throw: it runs at the end of screen
// transitions, and an environment without scrollIntoView must not turn a
// successful transition into an error.
export function scrollToTop() {
  if (typeof root.scrollIntoView !== 'function') return;
  try {
    root.scrollIntoView({ behavior: 'smooth', block: 'start' });
  } catch (err) {
    /* no-op: scrolling is not worth failing a transition over */
  }
}

export function on(selector, event, handler) {
  const el = root.querySelector(selector);
  if (el) el.addEventListener(event, handler);
  return el;
}

export function onAnswer(handler) {
  screens.questions.querySelectorAll('[data-answer]').forEach((btn) => {
    btn.addEventListener('click', () => handler(btn.getAttribute('data-answer')));
  });
}
