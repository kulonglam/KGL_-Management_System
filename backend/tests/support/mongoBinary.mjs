import { existsSync } from 'node:fs';

// Last-resort binary for a developer machine. CI and other hosts should set MONGOMS_SYSTEM_BINARY
// or LOCAL_MONGOD_PATH. The Windows path is used only when that file is actually present.
const WINDOWS_MONGOD = 'C:\\Program Files\\MongoDB\\Server\\8.2\\bin\\mongod.exe';

const configureMemoryServerBinary = () => {
  if (process.env.MONGOMS_SYSTEM_BINARY) {
    if (!process.env.MONGOMS_SYSTEM_BINARY_VERSION_CHECK) {
      process.env.MONGOMS_SYSTEM_BINARY_VERSION_CHECK = 'false';
    }
    return;
  }

  const optIn = process.env.LOCAL_MONGOD_PATH || WINDOWS_MONGOD;
  if (optIn && existsSync(optIn)) {
    process.env.MONGOMS_SYSTEM_BINARY = optIn;
    process.env.MONGOMS_SYSTEM_BINARY_VERSION_CHECK = 'false';
  }
};

export { configureMemoryServerBinary };
