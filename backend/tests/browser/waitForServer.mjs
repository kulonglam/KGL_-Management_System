import net from 'node:net';

// A fresh pattern each call so a shared global regex cannot skip later chunks.
const stripAnsi = (value) =>
  String(value).replace(new RegExp(`${String.fromCharCode(27)}\\[[0-9;]*m`, 'g'), '');

// GitHub Actions sets CI and sometimes FORCE_COLOR, which makes Vite colorize a pipe.
// NO_COLOR wins only when FORCE_COLOR is absent.
const devServerEnv = (overrides = {}) => {
  const env = { ...process.env, NO_COLOR: '1', ...overrides };
  delete env.FORCE_COLOR;
  return env;
};

const connectHost = (port, host) =>
  new Promise((resolve) => {
    const socket = net.connect({ host, port });
    const finish = (open) => {
      socket.removeAllListeners();
      socket.destroy();
      resolve(open);
    };
    socket.setTimeout(500);
    socket.once('connect', () => finish(true));
    socket.once('timeout', () => finish(false));
    socket.once('error', () => finish(false));
  });

// Vite's localhost bind may be IPv4, IPv6, or both. Either open socket is enough.
const canConnect = (port) =>
  Promise.all([connectHost(port, '127.0.0.1'), connectHost(port, '::1')]).then((results) =>
    results.some(Boolean)
  );

// Ready when the chosen port accepts a connection. The banner is only kept for the timeout error.
const waitForDevServer = (child, port, timeoutMs) =>
  new Promise((resolve, reject) => {
    let raw = '';
    let settled = false;
    let timer;
    let poll;
    const stop = (error, value) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      clearInterval(poll);
      if (error) reject(error);
      else resolve(value);
    };
    timer = setTimeout(() => {
      stop(new Error(`Timed out waiting for the dev server.\n${stripAnsi(raw)}`));
    }, timeoutMs);
    const onData = (chunk) => {
      raw += String(chunk);
    };
    child.stdout?.on('data', onData);
    child.stderr?.on('data', onData);
    child.once('exit', (code) => {
      stop(new Error(`Dev server exited with ${code}.\n${stripAnsi(raw)}`));
    });
    poll = setInterval(() => {
      canConnect(port).then((open) => {
        if (open) stop(null, stripAnsi(raw));
      });
    }, 200);
    if (typeof poll.unref === 'function') poll.unref();
  });

export { devServerEnv, stripAnsi, waitForDevServer };
