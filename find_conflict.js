const { execSync } = require('child_process');
const branches = execSync('git branch -r').toString().trim().split('\n').map(b => b.trim()).filter(b => !b.includes('HEAD') && !b.includes('main'));

for (let i = 0; i < branches.length; i++) {
  for (let j = i + 1; j < branches.length; j++) {
    const b1 = branches[i];
    const b2 = branches[j];
    try {
      const base = execSync(`git merge-base ${b1} ${b2}`).toString().trim();
      const output = execSync(`git merge-tree ${base} ${b1} ${b2}`).toString();
      if (output.includes('<<<<<<<') && output.includes('src/utils/api.js')) {
        console.log(`Conflict in src/utils/api.js between ${b1} and ${b2}`);
      }
    } catch (e) {
      if (e.stdout && e.stdout.toString().includes('<<<<<<<') && e.stdout.toString().includes('src/utils/api.js')) {
          console.log(`Conflict in src/utils/api.js between ${b1} and ${b2}`);
      }
    }
  }
}
console.log("Done checking pairs.");
