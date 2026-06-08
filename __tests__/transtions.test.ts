import { ALLOWED_TRANSTIONS, canTransition } from '../src/state/transtion';
import type { KycStatus } from '../src/types/kyc';

const ALL_STATUSES = Object.keys(ALLOWED_TRANSTIONS) as KycStatus[];
const TERMINALS: KycStatus[] = ['approved', 'rejected'];

describe('canTransition', () => {
  describe('happy path', () => {
    it.each([
      ['not_started', 'draft'],
      ['draft', 'submitted'],
      ['submitted', 'approved'],
      ['submitted', 'rejected'],
      ['submitted', 'requires_more_info'],
      ['requires_more_info', 'submitted'],
    ] as const)('allows %s -> %s', (from, to) => {
      expect(canTransition(from, to)).toBe(true);
    });

    it('walks the full not_started -> draft -> submitted -> approved flow', () => {
      const flow: KycStatus[] = [
        'not_started',
        'draft',
        'submitted',
        'approved',
      ];
      for (let i = 0; i < flow.length - 1; i++) {
        expect(canTransition(flow[i], flow[i + 1])).toBe(true);
      }
    });

    it('allows requires_more_info to be resubmitted', () => {
      expect(canTransition('submitted', 'requires_more_info')).toBe(true);
      expect(canTransition('requires_more_info', 'submitted')).toBe(true);
    });
  });

  describe('idempotent no-op', () => {
    it.each(ALL_STATUSES)('allows %s -> %s (same status)', (status) => {
      expect(canTransition(status, status)).toBe(true);
    });
  });

  describe('illegal jumps are rejected', () => {
    it.each([
      ['not_started', 'submitted'],
      ['not_started', 'approved'],
      ['not_started', 'rejected'],
      ['not_started', 'requires_more_info'],
      ['draft', 'approved'],
      ['draft', 'rejected'],
      ['draft', 'requires_more_info'],
      ['draft', 'not_started'],
      ['submitted', 'draft'],
      ['submitted', 'not_started'],
      ['requires_more_info', 'approved'],
      ['requires_more_info', 'rejected'],
      ['requires_more_info', 'draft'],
      ['requires_more_info', 'not_started'],
    ] as const)('rejects %s -> %s', (from, to) => {
      expect(canTransition(from, to)).toBe(false);
    });
  });

  describe('terminals stay terminal', () => {
    it.each(TERMINALS)('%s has no outgoing transitions in the table', (terminal) => {
      expect(ALLOWED_TRANSTIONS[terminal]).toEqual([]);
    });

    it.each(TERMINALS)('%s only allows the idempotent no-op', (terminal) => {
      for (const to of ALL_STATUSES) {
        expect(canTransition(terminal, to)).toBe(to === terminal);
      }
    });
  });
});
