import assert from 'node:assert/strict';

const target = new URL(process.argv[2] ?? 'http://localhost:3000');
const expectedOrigin = process.argv[3] ? new URL(process.argv[3]).origin : target.origin;
const userAgents = [
  ['Telegram', 'TelegramBot (like TwitterBot)'],
  ['WhatsApp', 'WhatsApp/2.24.1'],
  ['Twitter', 'Twitterbot/1.0'],
];

function readMeta(head, key) {
  const tags = [...head.matchAll(/<meta\b[^>]*>/gi)];
  const matches = tags.filter(([tag]) => new RegExp(`(?:name|property)="${key}"`, 'i').test(tag));
  assert.equal(matches.length, 1, `Expected one ${key} tag in the initial <head>`);
  const value = matches[0][0].match(/\bcontent="([^"]*)"/i)?.[1];
  assert.ok(value?.trim(), `${key} must not be empty`);
  return value;
}

for (const [name, userAgent] of userAgents) {
  const response = await fetch(target, { headers: { 'User-Agent': userAgent }, signal: AbortSignal.timeout(10_000) });
  assert.equal(response.status, 200, `${name}: page must be public`);
  const html = await response.text();
  const head = html.match(/<head\b[^>]*>([\s\S]*?)<\/head>/i)?.[1];
  assert.ok(head, `${name}: HTML must include <head> without running JavaScript`);
  const title = readMeta(head, 'og:title');
  const description = readMeta(head, 'og:description');
  assert.equal(readMeta(head, 'twitter:title'), title);
  assert.equal(readMeta(head, 'twitter:description'), description);
  assert.equal(readMeta(head, 'twitter:card'), 'summary_large_image');
  assert.equal(readMeta(head, 'og:type'), 'website');
  assert.equal(readMeta(head, 'og:image:type'), 'image/png');
  assert.equal(readMeta(head, 'og:image:width'), '1200');
  assert.equal(readMeta(head, 'og:image:height'), '630');
  assert.ok(readMeta(head, 'og:image:alt'));
  assert.ok(readMeta(head, 'twitter:image:alt'));
  const image = new URL(readMeta(head, 'og:image'));
  assert.ok(['http:', 'https:'].includes(image.protocol));
  assert.equal(image.origin, expectedOrigin, `${name}: image URL must use the configured public origin`);
  assert.equal(readMeta(head, 'twitter:image'), image.href);
  const page = new URL(readMeta(head, 'og:url'));
  assert.equal(page.origin, expectedOrigin);
  assert.equal(page.pathname, '/');
  assert.equal(page.search, '', `${name}: tracking parameters must not change the shared page URL`);

  const imageResponse = await fetch(new URL(image.pathname, target.origin), {
    headers: { 'User-Agent': userAgent }, signal: AbortSignal.timeout(10_000),
  });
  assert.equal(imageResponse.status, 200, `${name}: preview image must be public`);
  assert.match(imageResponse.headers.get('content-type') ?? '', /^image\/png\b/);
  const bytes = Buffer.from(await imageResponse.arrayBuffer());
  assert.deepEqual(bytes.subarray(0, 8), Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  assert.equal(bytes.readUInt32BE(16), 1200);
  assert.equal(bytes.readUInt32BE(20), 630);
  assert.ok(bytes.length < 5 * 1024 * 1024, 'Preview PNG must remain under 5 MB');
  console.log(`PASS ${name}: title, description and public PNG 1200x630 in initial HTML`);
}
