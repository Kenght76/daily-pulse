const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const output = path.join(root, 'dist');
if (path.dirname(output) !== root || path.basename(output) !== 'dist') {
  throw new Error('Unexpected output directory');
}
fs.rmSync(output, { recursive: true, force: true });
fs.mkdirSync(output, { recursive: true });
for (const item of ['index.html', 'manifest.json', 'sw.js', 'favicon.ico', 'css', 'js', 'config', 'public']) {
  fs.cpSync(path.join(root, item), path.join(output, item), {
    recursive: true,
    filter: source => !path.relative(root, source).split(path.sep).some(part => part.startsWith('.')),
  });
}
console.log('Built Daily Pulse static site in dist, retaining public/ asset paths.');
