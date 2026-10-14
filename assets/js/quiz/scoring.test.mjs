// Run: node --test assets/js/quiz/scoring.test.mjs
//
// Exercises the scoring against the real assets/quiz/quiz-config.json, so a
// config edit that breaks the bands or the cluster ranges fails here rather
// than in the page.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { scoreAll, questionIds, bandFor, clusterStatus, answerValue, bookingUrl } from './scoring.js';

const config = JSON.parse(fs.readFileSync('assets/quiz/quiz-config.json', 'utf8'));

const answerAll = (value) =>
  questionIds(config).reduce((acc, q) => Object.assign(acc, { [q]: value }), {});

test('twelve statements, four clusters of three', () => {
  assert.equal(questionIds(config).length, 12);
  assert.equal(config.clusters.length, 4);
  config.clusters.forEach((c) => assert.equal(c.questions.length, 3));
});

test('yes scores one, no and not sure score zero', () => {
  assert.equal(answerValue('yes', config), 1);
  assert.equal(answerValue('no', config), 0);
  assert.equal(answerValue('notsure', config), 0);
  assert.equal(answerValue(undefined, config), 0);
});

test('all yes is 12 and the ready band', () => {
  const r = scoreAll(answerAll('yes'), config);
  assert.equal(r.total, 12);
  assert.equal(r.band, 'ready');
  assert.equal(r.notSureCount, 0);
  r.clusters.forEach((c) => {
    assert.equal(c.score, 3);
    assert.equal(c.status, 'solid');
    assert.equal(c.showWeakLine, false);
  });
});

test('all no is 0 and the retrofit band, every cluster weak', () => {
  const r = scoreAll(answerAll('no'), config);
  assert.equal(r.total, 0);
  assert.equal(r.band, 'retrofit');
  assert.equal(r.notSureCount, 0);
  r.clusters.forEach((c) => {
    assert.equal(c.status, 'weak');
    assert.equal(c.showWeakLine, true);
  });
});

test('not sure scores as no but is counted separately', () => {
  const r = scoreAll(answerAll('notsure'), config);
  assert.equal(r.total, 0);
  assert.equal(r.notSureCount, 12);
});

test('every band boundary lands in exactly one band', () => {
  const expected = {
    0: 'retrofit', 4: 'retrofit',
    5: 'gaps', 8: 'gaps',
    9: 'ready', 12: 'ready',
  };
  for (const [total, band] of Object.entries(expected)) {
    assert.equal(bandFor(Number(total), config), band, 'total ' + total);
  }
  for (let total = 0; total <= 12; total++) {
    const hits = config.bands.filter((b) => total >= b.min && total <= b.max);
    assert.equal(hits.length, 1, 'total ' + total + ' matched ' + hits.length + ' bands');
  }
});

test('cluster status ranges cover 0-3 with no overlap', () => {
  assert.equal(clusterStatus(0, config), 'weak');
  assert.equal(clusterStatus(1, config), 'weak');
  assert.equal(clusterStatus(2, config), 'partial');
  assert.equal(clusterStatus(3, config), 'solid');
  for (let s = 0; s <= 3; s++) {
    const hits = Object.values(config.clusterStatus).filter((r) => s >= r.min && s <= r.max);
    assert.equal(hits.length, 1, 'cluster score ' + s);
  }
});

test('only the weak status shows a weak line', () => {
  assert.equal(config.clusterStatus.weak.showWeakLine, true);
  assert.equal(config.clusterStatus.partial.showWeakLine, false);
  assert.equal(config.clusterStatus.solid.showWeakLine, false);
});

test('a mixed sheet scores per cluster, not just in total', () => {
  // plan 3/3, build 1/3, content 2/3 with one not sure, pipeline 0/3.
  const answers = {
    q1: 'yes', q2: 'yes', q3: 'yes',
    q4: 'yes', q5: 'no', q6: 'no',
    q7: 'yes', q8: 'yes', q9: 'notsure',
    q10: 'no', q11: 'no', q12: 'notsure',
  };
  const r = scoreAll(answers, config);
  assert.equal(r.total, 6);
  assert.equal(r.band, 'gaps');
  assert.equal(r.notSureCount, 2);
  assert.deepEqual(
    r.clusters.map((c) => [c.id, c.score, c.status]),
    [['plan', 3, 'solid'], ['build', 1, 'weak'], ['content', 2, 'partial'], ['pipeline', 0, 'weak']]
  );
  assert.deepEqual(r.clusters.map((c) => c.showWeakLine), [false, true, false, true]);
});

test('an incomplete sheet scores the answered questions only', () => {
  const r = scoreAll({ q1: 'yes', q2: 'yes' }, config);
  assert.equal(r.total, 2);
  assert.equal(r.band, 'retrofit');
});

test('booking url carries the band in utm_content', () => {
  assert.equal(
    bookingUrl('gaps', config),
    'https://calendly.com/david-badideainteractive/new-meeting?utm_content=gaps'
  );
});

test('booking url appends to an existing query string', () => {
  const withQuery = { booking: { url: 'https://example.com/book?a=1', utmContentParam: 'utm_content' } };
  assert.equal(bookingUrl('ready', withQuery), 'https://example.com/book?a=1&utm_content=ready');
});

test('the gate ships off, with placeholders not real URLs', () => {
  assert.equal(config.gate.enabled, false);
  ['webhookUrl', 'pdfUrl', 'privacyUrl'].forEach((k) => {
    assert.ok(config.gate[k].startsWith('TODO_'), k + ' should still be a TODO placeholder');
  });
});
