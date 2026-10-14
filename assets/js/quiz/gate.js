// The email gate: validation and the webhook POST.
//
// Off by default (gate.enabled in assets/quiz/quiz-config.json). None of this
// runs until that flag is turned on, and turning it on requires a real webhook
// URL and a real privacy policy URL — both are TODO placeholders today.

const TODO_PREFIX = 'TODO_';

export function isPlaceholder(value) {
  return typeof value !== 'string' || value.indexOf(TODO_PREFIX) === 0;
}

// Deliberately permissive: the webhook and the mail step are what actually
// prove an address, and a stricter pattern here only rejects valid addresses.
export function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((value || '').trim());
}

// Returns the data-status name of the message to show, or null when valid.
export function validate(fields) {
  if (!isValidEmail(fields.email)) return 'email';
  if (!fields.consentResults) return 'consent';
  return null;
}

// Built strictly from the field list in config.webhookPayload, so the payload
// contract lives in the config rather than being implied by this code. A
// declared field with nothing to put in it is reported rather than sent as
// undefined, since that means the config and the page have drifted apart.
export function buildPayload(config, values) {
  const payload = { version: config.webhookPayload.version };
  const missing = [];

  config.webhookPayload.fields.forEach((field) => {
    if (Object.prototype.hasOwnProperty.call(values, field)) {
      payload[field] = values[field];
    } else {
      missing.push(field);
    }
  });

  if (missing.length) {
    console.warn('[quiz] webhookPayload declares fields with no value:', missing.join(', '));
  }

  return payload;
}

export function submit(config, payload) {
  if (isPlaceholder(config.gate.webhookUrl)) {
    // Fail loudly rather than showing a success state for a lead that was
    // never stored anywhere.
    return Promise.reject(
      new Error('gate.webhookUrl is still the TODO placeholder — nothing was sent')
    );
  }

  return fetch(config.gate.webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }).then((res) => {
    if (!res.ok) throw new Error('Webhook returned ' + res.status);
    return res;
  });
}
