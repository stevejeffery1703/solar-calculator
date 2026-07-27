#!/usr/bin/env node
/*
 * sync-partials.js — keep the shared header and footer in sync across every page.
 *
 * This site is plain static HTML with no build step, so the header and footer
 * are physically copied into all 20 pages. Edit the ONE source of truth in
 * partials/header.html or partials/footer.html, run this, and it stamps the
 * change into every page. Uses only Node's built-in modules — no dependencies,
 * nothing runs on the live site; this is a local authoring convenience.
 *
 *   node sync-partials.js          stamp partials into every page
 *   node sync-partials.js --check  verify only; exit 1 if any page is stale
 *                                  (handy in a pre-commit hook or CI)
 *
 * The two things that legitimately differ per page are handled automatically:
 *   - the active nav link, derived from the page's folder;
 *   - the footer logo's loading attr — eager on the short pages whose footer
 *     sits above the fold (contact, partners), lazy everywhere else.
 *
 * On a page's first run the <header>/<footer> block is wrapped in
 * <!-- @partial:… --> marker comments; after that the script replaces only the
 * text between those markers, so nothing else on the page is ever touched.
 */
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const readPartial = name =>
  fs.readFileSync(path.join(ROOT, 'partials', `${name}.html`), 'utf8').replace(/\s+$/, '');
const HEADER = readPartial('header');
const FOOTER = readPartial('footer');

// Which top-level nav link is "active", keyed by the page's section folder.
const SECTIONS = [
  ['plan-your-solar-installation/', '/plan-your-solar-installation/'],
  ['solar-by-state/',               '/solar-by-state/'],
  ['articles/',                     '/articles/'],
  ['about/',                        '/about/'],
];
function activeHref(rel) {
  if (rel === 'index.html') return '/';
  for (const [prefix, href] of SECTIONS) if (rel.startsWith(prefix)) return href;
  return null; // contact, partners, privacy-and-legal: nothing highlighted
}

// Pages whose footer is above the fold -> keep the footer logo eager.
const FOOTER_EAGER = new Set(['contact/index.html', 'partners/index.html']);

function headerFor(rel) {
  const href = activeHref(rel);
  // Mark the matching nav link active. Applied to the header partial only, so
  // the identical hrefs in the footer are never affected.
  return href ? HEADER.replace(`<a href="${href}">`, `<a href="${href}" class="active">`) : HEADER;
}
function footerFor(rel) {
  return FOOTER_EAGER.has(rel) ? FOOTER.replace(' loading="lazy"', '') : FOOTER;
}

// Match the file's own line-ending style so stamping never mixes CRLF and LF.
function dominantEol(s) {
  const crlf = (s.match(/\r\n/g) || []).length;
  const lf = (s.match(/(?<!\r)\n/g) || []).length;
  return crlf >= lf ? '\r\n' : '\n';
}
const toEol = (s, e) => s.replace(/\r\n/g, '\n').replace(/\n/g, e);

// Replace the region between the markers (or, first time, the raw tag block and
// add the markers). Returns null if neither is found. A replacement function is
// used so `$` in the markup is never treated as a special replacement token.
function stamp(html, name, rawTagRe, content) {
  const e = dominantEol(html);
  const wrapped = `<!-- @partial:${name} start -->${e}${toEol(content, e)}${e}  <!-- @partial:${name} end -->`;
  const markerRe = new RegExp(`<!-- @partial:${name} start -->[\\s\\S]*?<!-- @partial:${name} end -->`);
  if (markerRe.test(html)) return html.replace(markerRe, () => wrapped);
  if (rawTagRe.test(html)) return html.replace(rawTagRe, () => wrapped);
  return null;
}

function pages() {
  const out = [];
  (function walk(d) {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      if (e.name === '.git' || e.name === 'node_modules' || e.name === 'partials') continue;
      const p = path.join(d, e.name);
      if (e.isDirectory()) walk(p);
      else if (e.name.endsWith('.html')) out.push(p);
    }
  })(ROOT);
  return out.sort();
}

const HEADER_RE = /<header class="site-header">[\s\S]*?<\/header>/;
const FOOTER_RE = /<footer class="site-footer">[\s\S]*?<\/footer>/;

const check = process.argv.includes('--check');
let changed = 0;
const stale = [];
const errors = [];

for (const file of pages()) {
  const rel = path.relative(ROOT, file).replace(/\\/g, '/');
  const before = fs.readFileSync(file, 'utf8');

  let after = stamp(before, 'header', HEADER_RE, headerFor(rel));
  if (after === null) { errors.push(`${rel}: no <header class="site-header"> or header markers`); continue; }
  after = stamp(after, 'footer', FOOTER_RE, footerFor(rel));
  if (after === null) { errors.push(`${rel}: no <footer class="site-footer"> or footer markers`); continue; }

  if (after !== before) {
    if (check) { stale.push(rel); }
    else { fs.writeFileSync(file, after); changed++; console.log(`updated  ${rel}`); }
  }
}

if (errors.length) {
  console.error('\nERRORS:\n  ' + errors.join('\n  '));
  process.exit(2);
}
if (check) {
  if (stale.length) {
    console.error(`\n${stale.length} page(s) out of sync with partials/:\n  ` + stale.join('\n  '));
    console.error('\nFix with:  node sync-partials.js');
    process.exit(1);
  }
  console.log('All pages are in sync with partials/.');
} else {
  console.log(`\nDone — ${changed} page(s) updated.`);
}
