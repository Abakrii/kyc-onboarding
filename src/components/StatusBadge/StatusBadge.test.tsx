import { render, screen } from '@testing-library/react-native';

import { StatusBadge, statusTone } from './StatusBadge';

describe('StatusBadge', () => {
  it('labels each status', () => {
    render(<StatusBadge status="approved" />);
    expect(screen.getByText('Approved')).toBeTruthy();
  });

  it('maps statuses to semantic tones', () => {
    expect(statusTone('approved')).toBe('success');
    expect(statusTone('rejected')).toBe('danger');
    expect(statusTone('submitted')).toBe('info');
    expect(statusTone('requires_more_info')).toBe('warning');
    expect(statusTone('draft')).toBe('neutral');
    expect(statusTone('not_started')).toBe('neutral');
  });
});
