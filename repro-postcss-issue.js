const postcss = require('postcss');

/**
 * Reproduction script for PostCSS line return parsing issue.
 * We test how PostCSS handles LF (\n), CR (\r), and CRLF (\r\n).
 */

const testCases = [
  {
    name: 'Standard LF (\\n)',
    css: 'a {\n  color: red;\n}'
  },
  {
    name: 'Legacy CR (\\r)',
    css: 'a {\r  color: red;\r}'
  },
  {
    name: 'Windows CRLF (\\r\\n)',
    css: 'a {\r\n  color: red;\r\n}'
  },
  {
    name: 'Mixed with Comments',
    css: 'a {\r\n  color: red; /* comment */\r  margin: 0;\n}'
  }
];

async function runTest({ name, css }) {
  console.log(`=== Test Case: ${name} ===`);
  console.log('Input (escaped):', JSON.stringify(css));
  
  try {
    const root = postcss.parse(css);
    const result = await postcss().process(css, { from: 'input.css' });

    console.log('Output (escaped):', JSON.stringify(result.css));
    
    // Check first declaration
    const rule = root.nodes[0];
    const decl = rule.nodes[0];
    
    console.log('--- AST Analysis ---');
    console.log(`Declaration: ${decl.prop}: ${decl.value}`);
    console.log('Source Position:', decl.source.start, 'to', decl.source.end);
    console.log('Raws Before (escaped):', JSON.stringify(decl.raws.before));
    
    // Verification logic: PostCSS should treat \r, \n, and \r\n as newlines.
    // If it fails to recognize \r, the line count will be incorrect.
    const expectedLines = css.split(/\r\n|\r|\n/).length;
    const actualLines = root.source.end.line;
    
    console.log(`Line Count -> Expected: ${expectedLines}, Actual: ${actualLines}`);
    
    if (expectedLines !== actualLines) {
      console.error(`BUG DETECTED: Line count mismatch in ${name}!`);
    } else {
      console.log(`Line count is correct for ${name}.`);
    }

    // Check if \r is being stripped or kept
    if (css.includes('\r')) {
      const hasRInOutput = result.css.includes('\r');
      console.log(`Contains \\r in output: ${hasRInOutput}`);
    }

  } catch (error) {
    console.error('Error during parsing:', error.message);
  }
  console.log('\n');
}

(async () => {
  console.log(`Using PostCSS version: ${postcss().version || 'unknown'}\n`);
  for (const tc of testCases) {
    await runTest(tc);
  }
})();
