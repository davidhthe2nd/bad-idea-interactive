// Wiring for the global-ready self-check.
//
// Structure, scoring and flags all come from assets/quiz/quiz-config.json;
// every string comes from the quiz.* keys in assets/i18n/*.json via
// data-i18n. This file holds neither.
import { scoreAll, questionIds } from './scoring.js';
import * as view from './view.js';
import { validate, buildPayload, submit, isPlaceholder } from './gate.js';

const CONFIG_URL = '/assets/quiz/quiz-config.json';
const SOURCE = 'global-ready';

const state = { answers: {}, index: 0, stage: null, result: null };

let config = null;
let questions = [];

function activeLang() {
  // The same key i18n.js stores its choice under, so the webhook records the
  // language the visitor actually took the quiz in.
  try {
    return localStorage.getItem('bii-lang') || 'en';
  } catch (err) {
    return 'en';
  }
}

function goTo(index) {
  state.index = index;
  const questionId = questions[index];
  view.showQuestion(questionId, index, questions.length);

  // Coming back to a statement shows the answer already given, rather than
  // presenting it as unanswered.
  const existing = state.answers[questionId];
  if (existing) view.markAnswered(questionId, existing);
  else view.clearAnswerMarks();
}

function start() {
  state.stage = view.selectedStage();
  view.onlyScreen('questions');
  goTo(0);
}

function answer(value) {
  state.answers[questions[state.index]] = value;

  if (state.index + 1 < questions.length) {
    goTo(state.index + 1);
  } else {
    finish();
  }
}

function back() {
  if (state.index > 0) goTo(state.index - 1);
}

function finish() {
  state.result = scoreAll(state.answers, config);
  const gateEnabled = Boolean(config.gate.enabled);

  view.onlyScreen('result');
  view.renderResult(state.result, questions.length);

  if (gateEnabled) {
    // Score free, breakdown and PDF behind the gate.
    view.showScreen('gate', true);
    view.showGateStatus(null);
  } else {
    // Gate off: the whole breakdown is free and sits under the result.
    view.renderBreakdown(state.result, config, false);
    view.showGateSuccess(false);
    view.showScreen('breakdown', true);
  }

  view.scrollToTop();
}

function handleGateSubmit(event) {
  event.preventDefault();
  const els = view.gateElements();

  const fields = {
    email: els.email.value,
    consentResults: els.consentResults.checked,
    consentNewsletter: els.consentNewsletter.checked,
  };

  const problem = validate(fields);
  if (problem) {
    view.showGateStatus(problem);
    return;
  }

  const payload = buildPayload(config, {
    email: fields.email.trim(),
    consentResults: fields.consentResults,
    consentNewsletter: fields.consentNewsletter,
    lang: activeLang(),
    stage: state.stage,
    total: state.result.total,
    band: state.result.band,
    clusters: state.result.clusters.map((c) => ({ id: c.id, score: c.score, status: c.status })),
    answers: state.answers,
    notSureCount: state.result.notSureCount,
    timestamp: new Date().toISOString(),
    source: SOURCE,
  });

  view.showGateStatus('sending');
  els.submit.disabled = true;

  // then(onSuccess, onFailure) rather than .then().catch(): only a genuine
  // submission failure may show the error state. If the POST succeeded, the
  // lead is stored, and a later rendering slip must not tell the visitor it
  // failed and invite a duplicate submission.
  submit(config, payload)
    .then(() => {
      view.renderBreakdown(state.result, config, true);
      view.showGateSuccess(true);
      view.showScreen('gate', false);
      view.showScreen('breakdown', true);
      view.scrollToTop();
    }, (err) => {
      console.error('[quiz] gate submission failed:', err.message);
      view.showGateStatus('generic');
      els.submit.disabled = false;
    });
}

function retake() {
  state.answers = {};
  state.index = 0;
  state.result = null;
  view.clearAnswerMarks();
  view.showGateSuccess(false);
  view.showGateStatus(null);
  view.onlyScreen('intro');
  view.scrollToTop();
}

function init(loaded) {
  config = loaded;
  questions = questionIds(config);

  view.on('#quiz-start', 'click', start);
  view.on('#quiz-back', 'click', back);
  view.on('#quiz-retake', 'click', retake);
  view.onAnswer(answer);

  if (config.gate.enabled) {
    const els = view.gateElements();
    els.form.addEventListener('submit', handleGateSubmit);

    if (isPlaceholder(config.gate.privacyUrl)) {
      // EU consent has to link a real policy. Rather than ship a dead "#"
      // link next to a consent checkbox, say so in the console and leave the
      // link out of the tab order.
      console.warn('[quiz] gate.privacyUrl is still a TODO placeholder — no privacy policy is linked');
      els.privacyLink.removeAttribute('href');
    } else {
      els.privacyLink.setAttribute('href', config.gate.privacyUrl);
    }

    if (isPlaceholder(config.gate.webhookUrl)) {
      console.warn('[quiz] gate is enabled but gate.webhookUrl is still a TODO placeholder — submissions will fail');
    }
  }
}

fetch(CONFIG_URL)
  .then((res) => {
    if (!res.ok) throw new Error('Failed to load quiz config: ' + res.status);
    return res.json();
  })
  .then(init)
  .catch((err) => {
    // Without the config there are no questions and no scoring, so the intro
    // screen is all the visitor would ever see. Say why in the console rather
    // than leaving a Start button that silently does nothing.
    console.error('[quiz]', err.message);
  });
