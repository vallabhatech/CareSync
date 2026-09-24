import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import NotFound from './NotFound';

// Mock react-router-dom
jest.mock(
  'react-router-dom',
  () => ({
    Link: ({ children, to, ...props }) => (
      <a href={to} {...props}>
        {children}
      </a>
    ),
    useNavigate: () => jest.fn(),
  }),
  { virtual: true }
);

// Mock react-i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key, defaultValue) => defaultValue || key,
  }),
}));

// Mock @mui/icons-material
jest.mock(
  '@mui/icons-material',
  () => {
    const React = require('react');
    const dummyIcon = (name) => (props) => <span data-testid={`icon-${name}`} {...props} />;
    return {
      ErrorOutlineOutlined: dummyIcon('ErrorOutlineOutlined'),
      Dashboard: dummyIcon('Dashboard'),
      Medication: dummyIcon('Medication'),
      Psychology: dummyIcon('Psychology'),
      LocalHospital: dummyIcon('LocalHospital'),
      ArrowBack: dummyIcon('ArrowBack'),
    };
  },
  { virtual: true }
);

describe('NotFound Page', () => {
  const renderNotFound = () => {
    return render(<NotFound />);
  };

  test('renders 404 header and title correctly', () => {
    renderNotFound();
    expect(screen.getByText('404')).toBeInTheDocument();
    expect(screen.getByText('404 - Page Not Found')).toBeInTheDocument();
  });

  test('renders description text', () => {
    renderNotFound();
    expect(
      screen.getByText(
        "It seems you've followed an invalid link or typed an unrecognized web address. Let's get you back on track with managing your health."
      )
    ).toBeInTheDocument();
  });

  test('renders Back to Dashboard button with correct link', () => {
    renderNotFound();
    const dashboardBtn = screen.getByRole('link', { name: /Back to Dashboard/i });
    expect(dashboardBtn).toBeInTheDocument();
    expect(dashboardBtn).toHaveAttribute('href', '/dashboard');
  });

  test('renders quick navigation links to features', () => {
    renderNotFound();
    expect(screen.getByText('Medicine Tracker')).toBeInTheDocument();
    expect(screen.getByText('Symptom Checker')).toBeInTheDocument();
    expect(screen.getByText('Clinics Nearby')).toBeInTheDocument();

    const medicineCard = screen.getByRole('link', { name: /Medicine Tracker/i });
    expect(medicineCard).toHaveAttribute('href', '/medicine-tracker');

    const symptomCard = screen.getByRole('link', { name: /Symptom Checker/i });
    expect(symptomCard).toHaveAttribute('href', '/symptom-checker');

    const clinicsCard = screen.getByRole('link', { name: /Clinics Nearby/i });
    expect(clinicsCard).toHaveAttribute('href', '/clinics-nearby');
  });
});
