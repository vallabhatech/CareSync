import API from './api';
import httpConfig from './httpConfig';

test('axios instance has configured max content/body length defaults', () => {
  expect(API.defaults.maxContentLength).toBe(httpConfig.DEFAULT_MAX_CONTENT_LENGTH);
  expect(API.defaults.maxBodyLength).toBe(httpConfig.DEFAULT_MAX_BODY_LENGTH);
});
