# AdPages Local Service Starter for Cloudflare Pages

A dependency-free static starter for local-service landing pages on Cloudflare Pages. It complements the Worker redirect starter and the Astro landing starter by shipping plain HTML/CSS that can publish as a GitHub template or resource without a framework install.

It includes:

- LocalBusiness JSON-LD in `public/index.html`.
- Editable reference business data in `data/business.json`.
- Click-to-call and quote CTA examples.
- Service-area example pages with visible UTM examples.
- Cloudflare Pages `_headers` with a restrictive static-site policy.
- Launch QA checklist in `examples/launch-checklist.csv`.
- Local `check` and `smoke` scripts with no package dependencies.

Built by [AdPages from A1 Local](https://a1local.com.au/extensions/) as a free local-service website starter.

## Quick Start

```bash
npm run check
npm run smoke
```

Open `public/index.html` directly in a browser, or serve the `public` directory with any static file server.

## Cloudflare Pages Deploy

1. Create a new Cloudflare Pages project from the repository.
2. Use framework preset `None`.
3. Set the build command to blank for a simple static deploy. Use `npm run check` if you want Cloudflare Pages to fail the deploy when starter validation fails.
4. Set the output directory to `public`.
5. Deploy from the intended production branch.
6. Attach the custom domain and wait for SSL issuance.
7. Replace the `pages.dev` canonical URL with the production domain.
8. Verify `_headers` is applied in the deployed response.

This starter does not need Functions, Workers, KV, D1, R2, environment variables, Node dependencies, or build output outside `public`.

## Customize

- Replace the example business profile in `data/business.json`.
- Mirror those values in `public/index.html`, including the JSON-LD block, title, description, phone links, email links, and service areas.
- Replace service descriptions with real offer details and proof.
- Replace the example service-area pages under `public/areas/.../index.html`, or remove links to any areas you do not publish.
- Keep CTA UTM values visible in URLs. Do not add hidden scripts, cookies, or local storage to preserve the privacy stance.

## Publish Blockers

Real Cloudflare Pages blockers are tracked in `PUBLISH_BLOCKERS.md`. The most common launch blockers are incorrect output directory, forgotten placeholder data, stale `pages.dev` canonical URLs, missing custom-domain SSL, and service-area links pointing to pages that do not exist yet.

## Privacy Stance

The starter ships with no analytics, cookies, remote assets, credentials, storage, or form handling. Cloudflare account-level logs may still exist. Document those settings before publishing for a real business.

## Backlink and Monetisation Surfaces

Acceptable surfaces:

- A visible footer credit only when a real client has approved it.
- A README link back to the AdPages project or paid upgrade.
- Optional paid variants for generated suburb pages, quote forms, call tracking adapters, analytics adapters, and CMS integrations.

Do not ship hidden backlinks, invisible pixels, keyword-stuffed footer links, or automatic third-party calls in this starter.

## Local Scripts

```bash
npm run check
npm run smoke
npm run package-local
```

`check` validates required files, JSON-LD, CTA examples, Cloudflare Pages docs, and banned tracking or remote-asset patterns.

`smoke` starts a temporary local static server for `public` and verifies the homepage, CSS, headers file, click-to-call CTA, JSON-LD, service-area links, and clean `tel:` URLs.
