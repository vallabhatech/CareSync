import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import App from '../App';
import { ThemeModeProvider } from '../context/ThemeContext';

jest.mock('react-router-dom', () => ({
  Link: ({ children, to, ...props }) => <a href={to} {...props}>{children}</a>,
  Routes: ({ children }) => <div>{children}</div>,
  Route: ({ children }) => <div>{children}</div>,
  useNavigate: () => jest.fn(),
}), { virtual: true });

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key) => key }),
}));

jest.mock('../context/AuthContext', () => ({
  AuthProvider: ({ children }) => <div>{children}</div>,
  useAuth: () => ({
    isAuthenticated: false,
    user: null,
    logout: jest.fn(),
  }),
}));

jest.mock('../pages/Dashboard', () => () => <div>Dashboard</div>);
jest.mock('../pages/MedicineTracker', () => () => <div>MedicineTracker</div>);
jest.mock('../pages/SymptomChecker', () => () => <div>SymptomChecker</div>);
jest.mock('../pages/ClinicsNearby', () => () => <div>ClinicsNearby</div>);
jest.mock('../pages/Settings', () => () => <div>Settings</div>);
jest.mock('../pages/Login', () => () => <div>Login</div>);
jest.mock('../pages/Profile', () => () => <div>Profile</div>);
jest.mock('../pages/DosageCalculator', () => () => <div>DosageCalculator</div>);
jest.mock('../pages/HealthMetrics', () => () => <div>HealthMetrics</div>);
jest.mock('../components/Footer', () => () => <div>Footer</div>);
jest.mock('../pages/NotFound', () => () => <div>NotFound</div>);

describe('Navbar theme toggle', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('renders a global theme toggle for signed-out users', () => {
    render(
      <ThemeModeProvider>
        <App />
      </ThemeModeProvider>
    );

    const toggleButton = screen.getByRole('button', { name: /switch to dark theme/i });
    expect(toggleButton).toBeTruthy();

    fireEvent.click(toggleButton);

    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });
});
