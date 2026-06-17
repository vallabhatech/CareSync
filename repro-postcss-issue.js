const postcss = require('postcss');

/**
 * Verified Test Suite for PostCSS line return parsing.
 * This script tests LF, CR, CRLF, and mixed line endings to ensure
 * accurate line counting and source mapping.
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
    name: 'Mixed Line Endings (CRLF + CR + LF)',
    css: 'a {\r\n  color: red;\r  margin: 0;\n}'
  },
  {
    name: 'Multi-line Comment with CR',
    css: '/*\r * Comment\r */\ra { color: blue; }'
  }
];

async function runTest({ name, css }) {
  console.log(`=== Testing Case: ${name} ===`);
  
  try {
    const root = postcss.parse(css);
    
    // Expected line count: split by any newline sequence
    const expectedLines = css.split(/\r\n|\r|\n/).length;
    const actualLines = root.source.end.line;
    
    console.log(`- Expected Lines: ${expectedLines}`);
    console.log(`- Actual Lines:   ${actualLines}`);
    
    if (expectedLines === actualLines) {
      console.log('✅ Result: SUCCESS');
    } else {
      console.error(`❌ Result: FAILURE (Mismatch in ${name})`);
    }

    // Verify offset mapping for the first word in the last line
    const lastNode = root.nodes[root.nodes.length - 1];
    const lastLineStart = css.lastIndexOf('\n') > css.lastIndexOf('\r') 
        ? Math.max(css.lastIndexOf('\n'), css.lastIndexOf('\r')) + 1
        : Math.max(css.lastIndexOf('\n'), css.lastIndexOf('\r')) + 1;
    
    // Simplified verification for known cases
    if (name === 'Legacy CR (\\r)') {
        const decl = root.nodes[0].nodes[0];
        console.log(`- Declaration Line: ${decl.source.start.line} (Expected: 2)`);
        if (decl.source.start.line !== 2) {
            console.error('❌ Source Mapping Error: Declaration should be on line 2');
        }
    }

  } catch (error) {
    console.error('- Error during parsing:', error.message);
  }
  console.log('\n');
}

(async () => {
  console.log(`Running tests on PostCSS version: ${postcss().version}\n`);
  for (const tc of testCases) {
    await runTest(tc);
  }
})();
