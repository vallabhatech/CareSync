import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ClinicsNearby from './ClinicsNearby';
import useMediaQuery from '@mui/material/useMediaQuery';
import API from '../utils/api';

// Mock react-i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key,
  }),
}));

// Mock useMediaQuery from MUI
jest.mock('@mui/material/useMediaQuery');

// Mock context/AuthContext
jest.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    isAuthenticated: true,
    user: { name: 'Test User' },
  }),
}));

// Mock custom API client directly to support ESM default and direct exports
// This keeps Jest from trying to parse raw axios ESM in node_modules
jest.mock('../utils/api', () => {
  const mockGet = jest.fn();
  const mockPost = jest.fn();
  const mockDelete = jest.fn();

  const mockAPI = {
    get: mockGet,
    post: mockPost,
    delete: mockDelete,
    defaults: { headers: { common: {} } },
    interceptors: {
      request: { use: jest.fn(), eject: jest.fn() },
      response: { use: jest.fn(), eject: jest.fn() },
    },
  };

  return {
    __esModule: true,
    default: mockAPI,
    get: mockGet,
    post: mockPost,
    delete: mockDelete,
  };
});

// Mock react-leaflet components to avoid canvas/DOM errors in test JSDOM environment
jest.mock('react-leaflet', () => ({
  MapContainer: ({ children, center }) => (
    <div data-testid="map-container" data-center={JSON.stringify(center)}>
      {children}
    </div>
  ),
  TileLayer: () => <div data-testid="tile-layer" />,
  Marker: ({ position, children }) => (
    <div data-testid="marker" data-position={JSON.stringify(position)}>
      {children}
    </div>
  ),
  Popup: ({ children }) => <div data-testid="popup">{children}</div>,
  useMap: () => ({
    fitBounds: jest.fn(),
    setView: jest.fn(),
  }),
}));

describe('ClinicsNearby component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useMediaQuery.mockReturnValue(false); // default to desktop

    // Configure mock implementations inside beforeEach so they survive resetMocks
    API.get.mockImplementation((url) => {
      if (url.includes('/api/clinics/favorites')) {
        return Promise.resolve({
          data: [
            {
              _id: 'fav-1',
              name: 'Favorite Clinic',
              address: 'Fav Address',
              lat: '12.9716',
              lon: '77.5946',
              place_id: '99999',
            },
          ],
        });
      }
      if (url.includes('/api/clinics/searches')) {
        return Promise.resolve({
          data: [
            {
              _id: 'search-1',
              query: 'Bangalore',
              searchType: 'city',
              lat: '12.9716',
              lon: '77.5946',
            },
          ],
        });
      }
      return Promise.resolve({ data: [] });
    });

    API.post.mockImplementation((url, body) => {
      if (url.includes('/api/clinics/searches')) {
        return Promise.resolve({
          data: {
            _id: 'new-search-id',
            query: body?.query || 'Current Location',
            searchType: body?.searchType || 'nearby',
            lat: body?.lat,
            lon: body?.lon,
          },
        });
      }
      return Promise.resolve({ data: {} });
    });

    API.delete.mockImplementation(() => Promise.resolve({ data: {} }));

    // Mock geolocation
    const mockGeolocation = {
      getCurrentPosition: jest.fn((success) =>
        success({
          coords: {
            latitude: 12.9716,
            longitude: 77.5946,
          },
        })
      ),
    };
    global.navigator.geolocation = mockGeolocation;

    // Mock global fetch
    global.fetch = jest.fn((url) => {
      if (url.includes('search?format=json&limit=1&q=')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([{ lat: '12.9716', lon: '77.5946' }]),
        });
      }
      if (url.includes('search?format=json&q=clinic')) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve([
              {
                place_id: 12345,
                lat: '12.9730',
                lon: '77.5960',
                display_name: 'Test Clinic 1, Bangalore, Karnataka',
              },
              {
                place_id: 67890,
                lat: '12.9750',
                lon: '77.5980',
                display_name: 'Test Clinic 2, Bangalore, Karnataka',
              },
            ]),
        });
      }
      return Promise.reject(new Error('URL not mocked'));
    });
  });

  test('renders desktop view initially and loads favorites and recent searches', async () => {
    render(<ClinicsNearby />);

    // Check titles
    expect(screen.getByText('clinics:title')).toBeInTheDocument();
    expect(screen.getByText('⭐ Favorite Clinics')).toBeInTheDocument();
    
    // Asynchronously wait for elements loaded on mount
    expect(await screen.findByText('Favorite Clinic')).toBeInTheDocument();
    expect(await screen.findByText('Bangalore')).toBeInTheDocument();
  });

  test('fetches and displays clinics on "Find Near Me" click', async () => {
    render(<ClinicsNearby />);

    // Wait for initial mount data to finish loading
    await screen.findByText('Favorite Clinic');

    const findNearMeBtn = screen.getByText('clinics:findNearMe');
    fireEvent.click(findNearMeBtn);

    // Wait for clinics to load
    await waitFor(() => {
      expect(screen.getAllByText('Test Clinic 1')[0]).toBeInTheDocument();
    });

    // Check distance display (calculated using Haversine)
    expect(screen.getAllByText(/0.2 km/)[0]).toBeInTheDocument();
    expect(screen.getAllByText(/0.5 km/)[0]).toBeInTheDocument();

    // On desktop, the map should be present at the same time
    expect(screen.getByTestId('map-container')).toBeInTheDocument();
    expect(screen.getAllByTestId('marker')).toHaveLength(3); // 1 search center + 2 clinics
  });

  test('supports mobile view toggling between List and Map', async () => {
    useMediaQuery.mockReturnValue(true); // mobile view

    render(<ClinicsNearby />);

    // Wait for initial mount data to finish loading
    await screen.findByText('Favorite Clinic');

    const findNearMeBtn = screen.getByText('clinics:findNearMe');
    fireEvent.click(findNearMeBtn);

    await waitFor(() => {
      expect(screen.getByText('Test Clinic 1')).toBeInTheDocument();
    });

    // On mobile, the ToggleButtonGroup should render
    const toggleListBtn = screen.getByText('clinics:listView');
    const toggleMapBtn = screen.getByText('clinics:mapView');
    expect(toggleListBtn).toBeInTheDocument();
    expect(toggleMapBtn).toBeInTheDocument();

    // Since default viewMode is 'list', the map container should not render initially
    expect(screen.queryByTestId('map-container')).not.toBeInTheDocument();

    // Click Map tab to switch view
    fireEvent.click(toggleMapBtn);

    // The map container should now render, and list items should be hidden
    expect(screen.getByTestId('map-container')).toBeInTheDocument();
    expect(screen.queryByText(/~0.2 km/)).not.toBeInTheDocument();
  });
});
