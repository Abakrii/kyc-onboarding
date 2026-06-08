// Deep-redacting logger — the ONE sanctioned log sink for this PII-handling app.
// It strips known PII keys at ANY depth before anything reaches the console, so a
// stray object can never leak a legal name, date of birth, nationality, or
// document number. Always log through here instead of console.*.

const REDACTED = '[REDACTED]';
const CIRCULAR = '[Circular]';

// Keys whose values are PII. Whole sub-objects (personalInfo / document) are
// redacted wholesale; leaf fields are redacted by name wherever they appear.
const PII_KEYS: ReadonlySet<string> = new Set([
  'legalName',
  'dateOfBirth',
  'nationality',
  'documentNumber',
  'personalInfo',
  'document',
]);

// Tests flip this on to keep output clean (see jest.setup.js).
let silent = false;

export function setSilent(value: boolean): void {
  silent = value;
}

// `seen` tracks the current ancestor path (added before recursing, removed
// after), so genuine cycles become '[Circular]' while shared-but-acyclic
// references are still expanded.
function redactInner(value: unknown, seen: WeakSet<object>): unknown {
  if (value === null || typeof value !== 'object') {
    return value;
  }
  if (seen.has(value)) {
    return CIRCULAR;
  }
  seen.add(value);

  let result: unknown;
  if (Array.isArray(value)) {
    result = value.map((item) => redactInner(item, seen));
  } else {
    const out: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      out[key] = PII_KEYS.has(key) ? REDACTED : redactInner(val, seen);
    }
    result = out;
  }

  seen.delete(value);
  return result;
}

// Deep copy of `value` with every PII key redacted. Safe on cyclic structures.
export function redact(value: unknown): unknown {
  return redactInner(value, new WeakSet());
}

// Log a message and optional context. The context is redacted before output; the
// call is a no-op while silent.
export function log(message: string, context?: unknown): void {
  if (silent) {
    return;
  }
  if (context === undefined) {
    console.log(message);
  } else {
    console.log(message, redact(context));
  }
}
