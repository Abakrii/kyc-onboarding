import { fireEvent, render, screen } from '@testing-library/react-native';

import { TextField } from './TextField';

describe('TextField', () => {
  it('renders its label', () => {
    render(<TextField label="Legal name" value="" onChangeText={() => {}} />);
    expect(screen.getByText('Legal name')).toBeTruthy();
  });

  it('shows the current value and emits changes', () => {
    const onChangeText = jest.fn();
    render(<TextField label="Legal name" value="Ada" onChangeText={onChangeText} />);

    fireEvent.changeText(screen.getByDisplayValue('Ada'), 'Ada Lovelace');

    expect(onChangeText).toHaveBeenCalledWith('Ada Lovelace');
  });

  it('renders an error message when one is provided', () => {
    render(
      <TextField label="Legal name" value="" onChangeText={() => {}} error="Required" />,
    );
    expect(screen.getByText('Required')).toBeTruthy();
  });

  it('renders no error message when none is given', () => {
    render(<TextField label="Legal name" value="" onChangeText={() => {}} />);
    expect(screen.queryByText('Required')).toBeNull();
  });

  it('is not editable when disabled', () => {
    render(<TextField label="Legal name" value="" onChangeText={() => {}} disabled />);

    expect(screen.getByLabelText('Legal name').props.editable).toBe(false);
  });
});
