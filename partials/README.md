# Shared partials

`header.html` and `footer.html` are the **single source of truth** for the site
header and footer. The site has no build step, so those blocks are physically
copied into every page — but you only ever edit them **here**.

## To change the header or footer

1. Edit `partials/header.html` or `partials/footer.html`.
2. From the repo root, run:

   ```
   node sync-partials.js
   ```

   This stamps the change into all 20 pages (wrapped in `<!-- @partial:… -->`
   marker comments, so only that region of each page is touched).
3. Commit and push as usual.

## Per-page differences handled automatically

- **Active nav link** — derived from each page's folder, so the current section
  stays highlighted.
- **Footer logo `loading`** — eager on the short pages whose footer is above the
  fold (`contact`, `partners`), lazy elsewhere.

## Checking

`node sync-partials.js --check` verifies every page is in sync and exits non-zero
if not — useful in a pre-commit hook or CI. It writes nothing.

These files are dev-only (excluded from crawling via `robots.txt`); they are not
linked from any page.
