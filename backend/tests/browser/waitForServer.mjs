// Vite wraps "Local:" in ANSI bold, so the literal substring never appears in raw stdout.
const ansiColorPattern = new RegExp(`${String.fromCharCode(27)}\\[[0-9;]*m`, 'g');
const stripAnsi = (value) => String(value).replace(ansiColorPattern, '');

const waitForOutput = (child, pattern, timeoutMs) =>
  new Promise((resolve, reject) => {
    let buffer = '';
    let settled = false;
    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      reject(new Error(`Timed out waiting for the dev server.\n${buffer}`));
    }, timeoutMs);
    const onData = (chunk) => {
      buffer += stripAnsi(String(chunk));
      if (!settled && pattern.test(buffer)) {
        settled = true;
        clearTimeout(timer);
        resolve(buffer);
      }
    };
    child.stdout?.on('data', onData);
    child.stderr?.on('data', onData);
    child.once('exit', (code) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      reject(new Error(`Dev server exited with ${code}.\n${buffer}`));
    });
  });

export { stripAnsi, waitForOutput };
