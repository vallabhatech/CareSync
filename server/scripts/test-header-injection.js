const http = require('http');

/**
 * Manual smoke-test script to verify header sanitization.
 * Requests http://localhost:5000/ with an injection payload and checks if CR/LF are sanitized.
 * 
 * Usage: node server/scripts/test-header-injection.js
 */
const options = {
  hostname: 'localhost',
  port: 5000,
  // We use a query parameter to deliver the CRLF payload because Node's http client 
  // strictly validates outgoing header values and would throw an error if we attempted 
  // to set a header with CRLF directly.
  path: '/?injection=payload%0D%0AInjected-Header%3A%20true',
  method: 'GET'
};

console.log(`Requesting http://${options.hostname}:${options.port}${options.path}...`);

const req = http.request(options, (res) => {
  console.log('\n--- Received Headers ---');
  console.log(JSON.stringify(res.headers, null, 2));
  console.log('------------------------\n');

  let hasInjection = false;
  let testHeaderFound = false;

  for (const [key, value] of Object.entries(res.headers)) {
    // Headers can be strings or arrays of strings
    const values = Array.isArray(value) ? value : [value];
    for (const v of values) {
      if (typeof v === 'string' && (v.includes('\r') || v.includes('\n'))) {
        console.error(`FAIL: CRLF injection detected in header "${key}": ${JSON.stringify(v)}`);
        hasInjection = true;
      }
    }
    
    if (key.toLowerCase() === 'x-injection-response') {
      testHeaderFound = true;
    }
  }

  // Double check that the injected header was NOT created as a separate entry
  if (res.headers['injected-header']) {
    console.error('FAIL: CRLF injection succeeded! "Injected-Header" was found as a separate header.');
    hasInjection = true;
  }

  if (testHeaderFound && !hasInjection) {
    console.log('PASS: Sanitization control correctly neutralized the injection attempt.');
    console.log('Verified: CR/LF characters were stripped and no additional headers were injected.');
  } else if (!testHeaderFound) {
    console.error('FAIL: Test header "X-Injection-Response" was not found in response. Ensure the server echoes the "injection" query param.');
    process.exit(1);
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
