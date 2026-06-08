import { fireEvent, render, screen } from '@testing-library/react-native';

import { Button } from './Button';

describe('Button', () => {
  it('renders its label', () => {
    render(<Button label="Continue" onPress={() => {}} />);
    expect(screen.getByText('Continue')).toBeTruthy();
  });

  it('calls onPress when pressed', () => {
    const onPress = jest.fn();
    render(<Button label="Continue" onPress={onPress} />);

    fireEvent.press(screen.getByRole('button'));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('does not call onPress when disabled', () => {
    const onPress = jest.fn();
    render(<Button label="Continue" onPress={onPress} disabled />);

    fireEvent.press(screen.getByRole('button'));

    expect(onPress).not.toHaveBeenCalled();
  });

  it('shows a spinner instead of the label and blocks presses while loading', () => {
    const onPress = jest.fn();
    render(<Button label="Continue" onPress={onPress} loading />);

    expect(screen.getByTestId('button-spinner')).toBeTruthy();
    expect(screen.queryByText('Continue')).toBeNull();

    fireEvent.press(screen.getByRole('button'));
    expect(onPress).not.toHaveBeenCalled();
  });

  it('reflects the disabled + busy accessibility state while loading', () => {
    render(<Button label="Continue" onPress={() => {}} loading />);

    expect(screen.getByRole('button').props.accessibilityState).toMatchObject({
      disabled: true,
      busy: true,
    });
  });
});
