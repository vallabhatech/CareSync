import API from './api';
import MockAdapter from 'axios-mock-adapter';
import { validateUrl } from './sanitize';

jest.mock('./sanitize', () => ({
  ...jest.requireActual('./sanitize'),
  validateUrl: jest.fn(),
}));

describe('API interceptors', () => {
  let mock;

  beforeEach(() => {
    mock = new MockAdapter(API);
    validateUrl.mockClear();
    localStorage.clear();
  });

  afterEach(() => {
    mock.restore();
  });

  test('does not validate relative URLs', async () => {
    mock.onGet('/api/test').reply(200, {});
    await API.get('/api/test');
    expect(validateUrl).not.toHaveBeenCalled();
  });

  test('validates absolute URLs', async () => {
    mock.onGet('https://external.com/api/data').reply(200, {});
    await API.get('https://external.com/api/data');
    expect(validateUrl).toHaveBeenCalledWith('https://external.com/api/data');
  });

  test('queues failed POST requests when offline', async () => {
    mock.onPost('/api/data').networkError();

    await expect(API.post('/api/data', { key: 'value' })).rejects.toThrow(
      /Device is offline/
    );

    const queue = JSON.parse(localStorage.getItem('caresync_offline_queue'));
    expect(queue).toHaveLength(1);
    expect(queue[0].url).toBe('/api/data');
    expect(queue[0].method).toBe('post');
    const actualData = typeof queue[0].data === 'string' ? JSON.parse(queue[0].data) : queue[0].data;
    expect(actualData).toEqual({ key: 'value' });
  });
});
