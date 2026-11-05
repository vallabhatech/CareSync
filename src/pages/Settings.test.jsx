import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import Settings from './Settings';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key, defaultValue) => defaultValue || key,
    i18n: { language: 'en', changeLanguage: jest.fn() },
  }),
  initReactI18next: {
    type: '3rdParty',
    init: jest.fn(),
  },
}));

jest.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: { name: 'John Doe', email: 'john@example.com', avatar: '' },
    isAuthenticated: true,
    updateProfile: jest.fn().mockResolvedValue({}),
  }),
}));

jest.mock('../context/ThemeContext', () => ({
  useThemeMode: () => ({
    mode: 'light',
    toggleTheme: jest.fn(),
  }),
}));

describe('Settings Page', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('renders Settings tabs correctly', () => {
    render(<Settings />);
    expect(screen.getByText('Application & Profile Settings')).toBeInTheDocument();
    expect(screen.getByText('Account & Profile')).toBeInTheDocument();
    expect(screen.getByText('Dashboard Layout')).toBeInTheDocument();
    expect(screen.getByText('Notifications & Preferences')).toBeInTheDocument();
    expect(screen.getByText('Data & Privacy')).toBeInTheDocument();
  });

  test('allows editing account fields and switching tabs', () => {
    render(<Settings />);
    const nameInput = screen.getByLabelText('Name');
    expect(nameInput).toHaveValue('John Doe');

    // Switch to Dashboard Layout tab
    const dashboardTab = screen.getByText('Dashboard Layout');
    fireEvent.click(dashboardTab);

    expect(screen.getByText('Dashboard Customization')).toBeInTheDocument();
    expect(screen.getByText('Show Greeting Banner')).toBeInTheDocument();
    expect(screen.getByText('Show Statistics Summary Row')).toBeInTheDocument();
  });

  test('renders Data & Privacy tab options', () => {
    render(<Settings />);
    const dataTab = screen.getByText('Data & Privacy');
    fireEvent.click(dataTab);

    expect(screen.getByText('Download Data Backup')).toBeInTheDocument();
    expect(screen.getByText('Reset App Data')).toBeInTheDocument();
  });
});
