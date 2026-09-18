#!/usr/bin/env node
import http from 'node:http';
import https from 'node:https';
import { URL } from 'node:url';

let n = 200;
let c = 50;
let url = null;
let verbose = false;
const argv = process.argv.slice(2);
for (let i = 0; i < argv.length; i++) {
  if (argv[i] === '-n') n = Number(argv[++i]);
  else if (argv[i] === '-c') c = Number(argv[++i]);
  else if (argv[i] === '-v') verbose = true;
  else if (!argv[i].startsWith('-')) url = argv[i];
}
if (!url) {
  console.error(
    'Usage: node tools/hey.mjs -n 50 -c 1 [-v] <url>',
  );
  process.exit(1);
}
c = Math.min(c, n);

function request(urlString) {
  const u = new URL(urlString);
  const lib = u.protocol === 'https:' ? https : http;
  const t0 = performance.now();
  return new Promise((resolve) => {
    const req = lib.request(
      {
        hostname: u.hostname,
        port: u.port || (u.protocol === 'https:' ? 443 : 80),
        path: u.pathname + u.search,
        method: 'GET',
      },
      (res) => {
        let bytes = 0;
        res.on('data', (ch) => (bytes += ch.length));
        res.on('end', () =>
          resolve({
            status: res.statusCode || 0,
            ms: performance.now() - t0,
            bytes,
            elapsedHeader: res.headers['x-elapsed-time'] || null,
            cacheControl: res.headers['cache-control'] || null,
            etag: res.headers['etag'] || null,
          }),
        );
      },
    );
    req.on('error', (err) =>
      resolve({
        status: 0,
        ms: performance.now() - t0,
        bytes: 0,
        error: err.message,
        elapsedHeader: null,
        cacheControl: null,
        etag: null,
      }),
    );
    req.end();
  });
}

const results = [];
let next = 0;
const wall0 = performance.now();
async function worker() {
  while (true) {
    const i = next++;
    if (i >= n) return;
    results[i] = await request(url);
  }
}
await Promise.all(Array.from({ length: c }, () => worker()));
const wall = performance.now() - wall0;

const times = results.map((r) => r.ms);
const sorted = [...times].sort((a, b) => a - b);
const avg = sorted.reduce((a, b) => a + b, 0) / sorted.length;
const totalBytes = results.reduce((s, r) => s + r.bytes, 0);
const statuses = {};
for (const r of results) statuses[r.status] = (statuses[r.status] || 0) + 1;
const pct = (p) =>
  sorted[Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1)];

const first = results[0];
const rest = results.slice(1);
const restAvg =
  rest.length > 0
    ? rest.reduce((s, r) => s + r.ms, 0) / rest.length
    : 0;

function fmtSec(ms) {
  return `${(ms / 1000).toFixed(4)} secs`;
}
function fmtMs(ms) {
  return `${ms.toFixed(2)} ms`;
}

console.log(`URL: ${url}`);
console.log(`Requests: ${n}, concurrency: ${c}`);
console.log('');
console.log('Summary:');
console.log(`  Total:          ${n}`);
console.log(`  Successful:     ${results.filter((r) => r.status >= 200 && r.status < 400).length}`);
console.log(`  Failed:         ${results.filter((r) => r.status === 0 || r.status >= 400).length}`);
console.log(`  Total time:     ${fmtSec(wall)}`);
console.log(`  Slowest:        ${fmtSec(sorted.at(-1))}  (${fmtMs(sorted.at(-1))})`);
console.log(`  Fastest:        ${fmtSec(sorted[0])}  (${fmtMs(sorted[0])})`);
console.log(`  Average:        ${fmtSec(avg)}  (${fmtMs(avg)})`);
console.log(`  Requests/sec:   ${((n / wall) * 1000).toFixed(4)}`);
console.log(`  Total data:     ${(totalBytes / 1024).toFixed(2)} KiB`);
console.log(
  `  Size/request:   ${(totalBytes / n / 1024).toFixed(2)} KiB`,
);
console.log('');

console.log('Server cache hint (1st vs rest):');
console.log(
  `  1st request:    ${fmtMs(first.ms)}  status=${first.status}` +
    (first.elapsedHeader ? `  X-Elapsed-Time=${first.elapsedHeader}` : ''),
);
if (rest.length) {
  console.log(
    `  Rest average:   ${fmtMs(restAvg)}  (n=${rest.length})`,
  );
  console.log(
    `  Speedup:        ${restAvg > 0 ? (first.ms / restAvg).toFixed(1) : 'n/a'}x`,
  );
}
if (first.cacheControl) console.log(`  Cache-Control:  ${first.cacheControl}`);
if (first.etag) console.log(`  ETag:           ${first.etag}`);
console.log('');

console.log('Latency distribution:');
for (const p of [10, 25, 50, 75, 90, 95, 99]) {
  console.log(`  ${String(p).padStart(2)}% in ${fmtSec(pct(p))}  (${fmtMs(pct(p))})`);
}
console.log('');

// simple histogram buckets
const buckets = [1, 2, 5, 10, 25, 50, 100, 250, 500, 1000, 2500, Infinity];
console.log('Response time histogram (ms):');
let prev = 0;
for (const b of buckets) {
  const count = sorted.filter((t) => t > prev && t <= b).length;
  if (count === 0 && b !== Infinity) {
    prev = b;
    continue;
  }
  const label = b === Infinity ? `>${prev}` : `${prev}-${b}`;
  const bar = '#'.repeat(Math.min(50, count));
  console.log(`  ${label.padEnd(10)} ${String(count).padStart(4)} ${bar}`);
  prev = b;
}
console.log('');

console.log('Status code distribution:');
for (const [code, count] of Object.entries(statuses).sort(
  (a, b) => Number(a[0]) - Number(b[0]),
)) {
  console.log(
    `  [${code}] ${((count / n) * 100).toFixed(2)}%  (${count}/${n})`,
  );
}

if (verbose) {
  console.log('');
  console.log('Per-request:');
  results.forEach((r, i) => {
    console.log(
      `  #${String(i + 1).padStart(3)}  ${fmtMs(r.ms).padStart(10)}  status=${r.status}` +
        (r.elapsedHeader ? `  X-Elapsed=${r.elapsedHeader}` : '') +
        (r.error ? `  err=${r.error}` : ''),
    );
  });
}
