// /server/esbuild.config.mjs

import { build } from 'esbuild';
import path from 'path';
import { fileURLToPath } from 'url';

// Helper for __dirname equivalent in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename); 

// List of Node.js built-in modules that should not be bundled
const nodeBuiltins = [
  'assert', 'buffer', 'child_process', 'cluster', 'console', 'constants',
  'crypto', 'dgram', 'dns', 'domain', 'events', 'fs', 'http', 'https',
  'module', 'os', 'path', 'url', 'punycode', 'querystring', 'readline',
  'repl', 'stream', 'string_decoder', 'sys', 'timers', 'tls', 'tty',
  'url', 'util', 'vm', 'zlib'
];

// List of NPM packages that should NOT be bundled but resolved at runtime.
const externalNpmPackages = [
  'firebase-admin',
  '@google-cloud/firestore',
  'express', // Express should also be external
  'cors',    // CORS should also be external
  // Add other dependencies that should be external (e.g., if they have native modules)
];

const commonOptions = {
  bundle: true,
  format: 'cjs',
  platform: 'node',
  target: 'node20',
  external: [...nodeBuiltins, ...externalNpmPackages],
  alias: {
    "@shared": path.resolve(__dirname, './shared'),
  },
  mainFields: ['main', 'module'],
};

// Build the backend
build({
  entryPoints: ['index.ts'],
  outfile: 'dist/index.cjs',
  ...commonOptions,
}).catch(() => process.exit(1));

console.log('Backend build complete.');