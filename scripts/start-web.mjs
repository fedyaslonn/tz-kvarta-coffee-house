import { cp, access } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

await cp('.next/static', '.next/standalone/.next/static', { recursive: true });
try {
  await access('public');
  await cp('public', '.next/standalone/public', { recursive: true });
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
}
process.env.PORT ??= '3000';
process.env.HOSTNAME ??= '0.0.0.0';
await import(pathToFileURL(resolve('.next/standalone/server.js')).href);
