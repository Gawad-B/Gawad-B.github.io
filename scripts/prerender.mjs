// Injects the server-rendered professional page into dist/index.html.
// Run after `vite build`: node scripts/prerender.mjs
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const htmlPath = path.join(root, 'dist', 'index.html');
const MARKER = '<!--pv-ssr-->';
const REQUIRED = ['id="projects"', 'id="experience"', 'id="skills"', 'id="about"', 'id="contact"', '<h1'];

function fail(message) {
  console.error(`prerender: ${message}`);
  process.exitCode = 1;
}

async function main() {
  let template;
  try {
    template = await readFile(htmlPath, 'utf8');
  } catch {
    return fail(`${htmlPath} not found. Run \`vite build\` first.`);
  }
  if (!template.includes(MARKER)) {
    return fail(`marker ${MARKER} not found in dist/index.html.`);
  }

  const server = await createServer({
    root,
    appType: 'custom',
    logLevel: 'warn',
    server: { middlewareMode: true, hmr: false, ws: false, watch: null },
    optimizeDeps: { noDiscovery: true, include: [] },
  });

  let html;
  try {
    const mod = await server.ssrLoadModule('/src/pro/entry-server.tsx');
    html = mod.render();
  } finally {
    await server.close();
  }

  if (typeof html !== 'string') return fail('render() did not return a string.');
  const missing = REQUIRED.filter((needle) => !html.includes(needle));
  if (missing.length > 0) return fail(`rendered HTML lacks: ${missing.join(', ')}.`);

  // A function replacer: the markup contains `$` sequences that a string replacement would expand.
  await writeFile(htmlPath, template.replace(MARKER, () => html), 'utf8');
  console.log(`prerender: injected ${Buffer.byteLength(html, 'utf8')} bytes into dist/index.html`);
}

try {
  await main();
} catch (error) {
  console.error('prerender: failed.', error);
  process.exitCode = 1;
}
