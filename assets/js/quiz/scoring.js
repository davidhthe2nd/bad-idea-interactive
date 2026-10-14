// Scoring, banding and cluster status. Pure functions over an answers map and
// the config — no DOM, no module state — so the logic can be exercised
// directly in Node (see scoring.test.mjs) rather than only through the page.
//
// Every threshold lives in assets/quiz/quiz-config.json. Nothing here hardcodes
// a score, a band boundary or a cluster membership, so changing the scoring is
// a config edit, not a code change.

// An unanswered question, or an answer the config does not score, counts zero.
export function answerValue(answer, config) {
  const value = config.scoring[answer];
  return typeof value === 'number' ? value : 0;
}

export function clusterStatus(score, config) {
  const match = Object.keys(config.clusterStatus).find((id) => {
    const range = config.clusterStatus[id];
    return score >= range.min && score <= range.max;
  });
  return match || null;
}

export function bandFor(total, config) {
  const band = config.bands.find((b) => total >= b.min && total <= b.max);
  return band ? band.id : null;
}

// Question order is the cluster order — the config is the only place that
// decides which statement belongs where, and in what sequence they are asked.
export function questionIds(config) {
  return config.clusters.reduce((all, c) => all.concat(c.questions), []);
}

export function scoreAll(answers, config) {
  const clusters = config.clusters.map((cluster) => {
    const score = cluster.questions.reduce(
      (sum, q) => sum + answerValue(answers[q], config),
      0
    );
    const status = clusterStatus(score, config);
    return {
      id: cluster.id,
      score,
      status,
      showWeakLine: Boolean(status && config.clusterStatus[status].showWeakLine),
    };
  });

  const total = clusters.reduce((sum, c) => sum + c.score, 0);

  // "Not sure" scores the same as "No" but is counted separately: not knowing
  // is itself the finding, and it is the most useful thing to raise on a call.
  const notSureCount = config.scoring.recordNotSureSeparately
    ? questionIds(config).filter((q) => answers[q] === 'notsure').length
    : 0;

  return { total, notSureCount, clusters, band: bandFor(total, config) };
}

// Appends utm_content without assuming the booking URL has no query string of
// its own already.
export function bookingUrl(bandId, config) {
  const { url, utmContentParam } = config.booking;
  const separator = url.indexOf('?') === -1 ? '?' : '&';
  return url + separator + encodeURIComponent(utmContentParam) + '=' + encodeURIComponent(bandId);
}
