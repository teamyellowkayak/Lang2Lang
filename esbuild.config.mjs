import { build } from 'esbuild';
import path from 'path';
import { fileURLToPath } from 'url';

// Helper for __dirname equivalent in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// List of Node.js built-in modules that should not be bundled
// but rather resolved by Node.js at runtime.
// This is important because 'path' is a built-in module.
const nodeBuiltins = [
  'assert', 'buffer', 'child_process', 'cluster', 'console', 'constants',
  'crypto', 'dgram', 'dns', 'domain', 'events', 'fs', 'http', 'https',
  'module', 'os', 'path', 'url', 'punycode', 'querystring', 'readline',
  'repl', 'stream', 'string_decoder', 'sys', 'timers', 'tls', 'tty',
  'url', 'util', 'vm', 'zlib'
];

// Removed commonOptions and integrated directly into build call for clarity
// or you can keep commonOptions and override/ensure correct settings.
// Let's modify commonOptions to reflect the correct settings as planned.
const commonOptions = {
  bundle: true,
  format: 'cjs',             // <--- CRUCIAL CHANGE: Set to CJS
  platform: 'node',
  // outdir: 'dist',         // <--- REMOVE THIS LINE
  external: nodeBuiltins,
  alias: {
    "@shared": path.resolve(__dirname, 'shared'),
  },
  mainFields: ['main', 'module'], // Prioritize 'main' for CJS
};

// Build the backend
build({
  entryPoints: ['server/index.ts'],
  outfile: 'dist/index.cjs', // <--- CRUCIAL CHANGE: Output to .cjs file
  ...commonOptions,
}).catch(() => process.exit(1));

console.log('Backend build complete.');