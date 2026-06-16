const http = require('http');

/**
 * Manual smoke-test script to verify header sanitization.
 * Requests http://localhost:5000/ and checks for CR (\r) or LF (\n) in response headers.
 * 
 * Usage: node server/scripts/test-header-injection.js
 */
const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/',
  method: 'GET'
};

console.log(`Requesting http://${options.hostname}:${options.port}${options.path}...`);

const req = http.request(options, (res) => {
  console.log('\n--- Received Headers ---');
  console.log(JSON.stringify(res.headers, null, 2));
  console.log('------------------------\n');

  let hasInjection = false;
  for (const [key, value] of Object.entries(res.headers)) {
    // Headers can be strings or arrays of strings
    const values = Array.isArray(value) ? value : [value];
    for (const v of values) {
      if (typeof v === 'string' && (v.includes('\r') || v.includes('\n'))) {
        console.error(`FAIL: CRLF injection detected in header "${key}": ${JSON.stringify(v)}`);
        hasInjection = true;
      }
    }
  }

  if (!hasInjection) {
    console.log('PASS: No CRLF injection detected in headers.');
  } else {
    process.exit(1);
  }
});

req.on('error', (e) => {
  console.error(`Error connecting to server: ${e.message}`);
  console.error('Ensure the server is running on http://localhost:5000/ before running this test.');
  process.exit(1);
});

req.end();
