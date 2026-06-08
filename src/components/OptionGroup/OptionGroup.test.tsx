import { fireEvent, render, screen } from '@testing-library/react-native';

import { OptionGroup, type OptionGroupOption } from './OptionGroup';

const OPTIONS: OptionGroupOption<'a' | 'b'>[] = [
  { value: 'a', label: 'Alpha' },
  { value: 'b', label: 'Beta' },
];

describe('OptionGroup', () => {
  it('renders every option', () => {
    render(<OptionGroup options={OPTIONS} value="a" onChange={() => {}} />);
    expect(screen.getByText('Alpha')).toBeTruthy();
    expect(screen.getByText('Beta')).toBeTruthy();
  });

  it('marks only the selected option', () => {
    render(<OptionGroup options={OPTIONS} value="b" onChange={() => {}} />);
    expect(screen.getByLabelText('Beta').props.accessibilityState.selected).toBe(true);
    expect(screen.getByLabelText('Alpha').props.accessibilityState.selected).toBe(false);
  });

  it('calls onChange with the pressed value', () => {
    const onChange = jest.fn();
    render(<OptionGroup options={OPTIONS} value="a" onChange={onChange} />);

    fireEvent.press(screen.getByLabelText('Beta'));

    expect(onChange).toHaveBeenCalledWith('b');
  });

  it('renders an error message', () => {
    render(
      <OptionGroup options={OPTIONS} value={undefined} onChange={() => {}} error="Required" />
    );
    expect(screen.getByText('Required')).toBeTruthy();
  });
});
