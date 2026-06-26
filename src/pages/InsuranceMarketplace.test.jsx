import './setupEncoder';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import InsuranceMarketplace from './InsuranceMarketplace';
import { BrowserRouter } from 'react-router-dom';
import API from '../utils/api';

jest.setTimeout(20000);

// Mock API
jest.mock('../utils/api');

// Mock AuthContext
jest.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    isAuthenticated: true,
    user: { name: 'John Doe', email: 'john@example.com' }
  })
}));

// Mock translation hooks
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => {
      const keys = {
        'insurance:title': 'Health Insurance Marketplace',
        'insurance:subtitle': 'Compare premium healthcare coverage options, calculate dynamic quotes, and enroll instantly.',
        'insurance:quoteCalculator': 'Insurance Quote Calculator',
        'insurance:calculatorDesc': 'Adjust options below to estimate custom monthly premiums in real-time.',
        'insurance:ageLabel': 'Age',
        'insurance:tobaccoLabel': 'Tobacco User',
        'insurance:tobaccoYes': 'Yes',
        'insurance:tobaccoNo': 'No',
        'insurance:familyLabel': 'Family Members to Cover',
        'insurance:zipCodeLabel': 'ZIP Code / Region',
        'insurance:preExistingLabel': 'Pre-existing Conditions',
        'insurance:plansAvailable': 'Available Insurance Plans',
        'insurance:comparePlans': 'Compare Plans',
        'insurance:purchase': 'Purchase Plan',
        'insurance:purchaseTitle': 'Purchase Health Insurance Policy',
        'insurance:tabMarketplace': 'Find Plans',
        'insurance:tabMyPolicies': 'My Policies',
        'insurance:primaryInsuredDesc': 'Provide the details for the primary policyholder.'
      };
      return keys[key] || key;
    }
  })
}));

const mockPlans = [
  {
    id: 'coreshield-bronze',
    name: 'CareSync Bronze Saver',
    provider: 'CareShield',
    tier: 'Bronze',
    premium: 150,
    deductible: 5000,
    copay: 40,
    networkType: 'HMO',
    benefits: ['Benefit A', 'Benefit B']
  }
];

describe('InsuranceMarketplace Component', () => {
  beforeEach(() => {
    API.get.mockImplementation((url) => {
      if (url === '/api/insurance/plans') {
        return Promise.resolve({ data: mockPlans });
      }
      if (url === '/api/insurance/policies') {
        return Promise.resolve({ data: [] });
      }
      return Promise.reject(new Error('not found'));
    });
    API.post.mockResolvedValue({ data: { policyNumber: 'CS-2026-99999' } });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('renders Marketplace layout and title', async () => {
    render(
      <BrowserRouter>
        <InsuranceMarketplace />
      </BrowserRouter>
    );

    expect(screen.getByText('Health Insurance Marketplace')).toBeInTheDocument();
    expect(screen.getByText(/Insurance Quote Calculator/)).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.getByText('CareSync Bronze Saver')).toBeInTheDocument();
    });
  });

  test('handles comparing plans check boxes', async () => {
    render(
      <BrowserRouter>
        <InsuranceMarketplace />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('CareSync Bronze Saver')).toBeInTheDocument();
    });

    const compareCheckbox = screen.getByLabelText('Compare Plans');
    fireEvent.click(compareCheckbox);

    expect(screen.getByText('Selected 1 / 3 Plans')).toBeInTheDocument();
  });

  test('purchasing plan triggers step wizard dialog flow', async () => {
    render(
      <BrowserRouter>
        <InsuranceMarketplace />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('CareSync Bronze Saver')).toBeInTheDocument();
    });

    const purchaseBtn = screen.getByText('Purchase Plan');
    fireEvent.click(purchaseBtn);

    // Verify Wizard is open showing Step 1: applicant information
    expect(screen.getByText('Purchase Health Insurance Policy')).toBeInTheDocument();
    expect(screen.getByText('Provide the details for the primary policyholder.')).toBeInTheDocument();
  });
});
