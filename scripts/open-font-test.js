const { exec } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Open the font test page in the default browser
exec('start test-font.html', { cwd: __dirname }, (error, stdout, stderr) => {
  if (error) {
    console.error('Error opening font test page:', error);
    return;
  }
  console.log('Font test page opened in browser');
});
