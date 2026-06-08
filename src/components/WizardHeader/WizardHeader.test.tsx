import { fireEvent, render, screen } from '@testing-library/react-native';

import { WizardHeader } from './WizardHeader';

const LABELS = ['Personal', 'Address', 'Document', 'Review', 'Status'];

describe('WizardHeader', () => {
  it('renders a node for every wizard step', () => {
    render(<WizardHeader currentStep="personal_info" />);
    for (const label of LABELS) {
      expect(screen.getByText(label)).toBeTruthy();
    }
    expect(screen.getAllByRole('button')).toHaveLength(LABELS.length);
  });

  it('marks only the current step as selected', () => {
    render(<WizardHeader currentStep="document" />);
    const selected = screen
      .getAllByRole('button')
      .map((node) => node.props.accessibilityState.selected);
    // document is index 2 in WIZARD_STEPS.
    expect(selected).toEqual([false, false, true, false, false]);
  });

  it('calls onStepPress with the tapped step', () => {
    const onStepPress = jest.fn();
    render(<WizardHeader currentStep="review" onStepPress={onStepPress} />);

    fireEvent.press(screen.getAllByRole('button')[1]);

    expect(onStepPress).toHaveBeenCalledWith('address');
  });

  it('disables the nodes when no onStepPress is given', () => {
    const onStepPress = jest.fn();
    render(<WizardHeader currentStep="personal_info" />);

    const nodes = screen.getAllByRole('button');
    for (const node of nodes) {
      expect(node.props.accessibilityState.disabled).toBe(true);
    }

    fireEvent.press(nodes[0]);
    expect(onStepPress).not.toHaveBeenCalled();
  });
});
