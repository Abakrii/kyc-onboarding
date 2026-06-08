import { fireEvent, render, screen } from '@testing-library/react-native';

import { ErrorNotice } from './ErrorNotice';

describe('ErrorNotice', () => {
  it('renders the message', () => {
    render(<ErrorNotice message="Network error" />);
    expect(screen.getByText('Network error')).toBeTruthy();
  });

  it('calls onRetry when Retry is pressed', () => {
    const onRetry = jest.fn();
    render(<ErrorNotice message="Network error" onRetry={onRetry} />);

    fireEvent.press(screen.getByTestId('error-retry'));

    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('omits the Retry action when no handler is given', () => {
    render(<ErrorNotice message="Network error" />);
    expect(screen.queryByTestId('error-retry')).toBeNull();
  });
});
