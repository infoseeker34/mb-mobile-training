import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import LoginScreen from '../LoginScreen';

// Mock useAuth
const mockLogin = jest.fn();
jest.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => ({ login: mockLogin, isLoading: false }),
}));

const mockNavigation = { navigate: jest.fn() };

describe('LoginScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the app title', () => {
    const { getByText } = render(<LoginScreen navigation={mockNavigation} />);
    expect(getByText('Magic Board Training')).toBeTruthy();
  });

  it('renders the login button', () => {
    const { getByText } = render(<LoginScreen navigation={mockNavigation} />);
    expect(getByText('Login with Magic Board')).toBeTruthy();
  });

  it('calls login when button is pressed', () => {
    const { getByText } = render(<LoginScreen navigation={mockNavigation} />);
    fireEvent.press(getByText('Login with Magic Board'));
    expect(mockLogin).toHaveBeenCalledTimes(1);
  });

  it('renders Privacy Policy link', () => {
    const { getByText } = render(<LoginScreen navigation={mockNavigation} />);
    expect(getByText('Privacy Policy')).toBeTruthy();
  });

  it('renders Terms of Service link', () => {
    const { getByText } = render(<LoginScreen navigation={mockNavigation} />);
    expect(getByText('Terms of Service')).toBeTruthy();
  });

  it('navigates to PrivacyPolicy when link pressed', () => {
    const { getByText } = render(<LoginScreen navigation={mockNavigation} />);
    fireEvent.press(getByText('Privacy Policy'));
    expect(mockNavigation.navigate).toHaveBeenCalledWith('PrivacyPolicy');
  });

  it('navigates to TermsOfService when link pressed', () => {
    const { getByText } = render(<LoginScreen navigation={mockNavigation} />);
    fireEvent.press(getByText('Terms of Service'));
    expect(mockNavigation.navigate).toHaveBeenCalledWith('TermsOfService');
  });
});

describe('LoginScreen — loading state', () => {
  beforeEach(() => {
    jest.mock('../../../contexts/AuthContext', () => ({
      useAuth: () => ({ login: jest.fn(), isLoading: true }),
    }));
  });
});
