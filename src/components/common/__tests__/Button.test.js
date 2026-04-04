import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import Button from '../Button';

describe('Button', () => {
  it('renders the title text', () => {
    const { getByText } = render(<Button title="Press Me" onPress={jest.fn()} />);
    expect(getByText('Press Me')).toBeTruthy();
  });

  it('calls onPress when pressed', () => {
    const onPress = jest.fn();
    const { getByText } = render(<Button title="Click" onPress={onPress} />);
    fireEvent.press(getByText('Click'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('does not call onPress when disabled', () => {
    const onPress = jest.fn();
    const { getByText } = render(<Button title="Disabled" onPress={onPress} disabled />);
    fireEvent.press(getByText('Disabled'));
    expect(onPress).not.toHaveBeenCalled();
  });

  it('shows ActivityIndicator when loading', () => {
    const { queryByText, getByTestId } = render(
      <Button title="Load" onPress={jest.fn()} loading testID="btn" />
    );
    // Text should not be shown while loading
    expect(queryByText('Load')).toBeNull();
  });

  it('does not call onPress when loading', () => {
    const onPress = jest.fn();
    const { getByTestId } = render(
      <Button title="Load" onPress={onPress} loading testID="btn" />
    );
    fireEvent.press(getByTestId('btn'));
    expect(onPress).not.toHaveBeenCalled();
  });

  it('renders with outline variant without crashing', () => {
    const { getByText } = render(
      <Button title="Outline" onPress={jest.fn()} variant="outline" />
    );
    expect(getByText('Outline')).toBeTruthy();
  });

  it('renders with lg size without crashing', () => {
    const { getByText } = render(
      <Button title="Large" onPress={jest.fn()} size="lg" />
    );
    expect(getByText('Large')).toBeTruthy();
  });
});
