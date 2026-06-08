import { log, redact, setSilent } from '../src/lib/logger';

describe('redact', () => {
  it('redacts top-level PII keys, keeps the rest', () => {
    expect(redact({ legalName: 'Ada', status: 'draft' })).toEqual({
      legalName: '[REDACTED]',
      status: 'draft',
    });
  });

  it('redacts PII at any depth', () => {
    const input = { a: { b: { c: { documentNumber: 'X', nationality: 'GB', ok: 1 } } } };
    expect(redact(input)).toEqual({
      a: { b: { c: { documentNumber: '[REDACTED]', nationality: '[REDACTED]', ok: 1 } } },
    });
  });

  it('redacts whole PII sub-objects', () => {
    expect(
      redact({ personalInfo: { legalName: 'Ada' }, document: { documentNumber: 'X' } })
    ).toEqual({ personalInfo: '[REDACTED]', document: '[REDACTED]' });
  });

  it('redacts inside arrays', () => {
    expect(redact([{ legalName: 'Ada' }, { ok: 2 }])).toEqual([
      { legalName: '[REDACTED]' },
      { ok: 2 },
    ]);
  });

  it('handles cycles without throwing', () => {
    const cyclic: Record<string, unknown> = { ok: 1 };
    cyclic.self = cyclic;
    const out = redact(cyclic) as Record<string, unknown>;
    expect(out.ok).toBe(1);
    expect(out.self).toBe('[Circular]');
  });

  it('leaves non-PII data intact', () => {
    expect(redact({ status: 'approved', currentStep: 'status', count: 3 })).toEqual({
      status: 'approved',
      currentStep: 'status',
      count: 3,
    });
  });
});

describe('log', () => {
  it('is a no-op while silent', () => {
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    setSilent(true);
    log('hi', { legalName: 'Ada' });
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  it('logs redacted context when not silent', () => {
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    setSilent(false);
    log('saved', { legalName: 'Ada', status: 'draft' });
    expect(spy).toHaveBeenCalledWith('saved', { legalName: '[REDACTED]', status: 'draft' });
    spy.mockRestore();
    setSilent(true);
  });
});
