# Publish Blockers

Do not promote a fork of this starter as a public template or live client site until these are complete:

- Replace every fictional business detail in `public/index.html` and `data/business.json`.
- Confirm the Cloudflare Pages project uses the correct production branch.
- Set the Cloudflare Pages framework preset to `None` unless you add a build system.
- Set the build command to blank for static deploys, or `npm run check` if you want Pages to fail on validation errors.
- Set the output directory to `public`.
- Verify the `public/_headers` file is applied after deploy.
- Attach the production custom domain and wait for SSL issuance.
- Replace the `pages.dev` canonical URL with the production domain.
- Test `tel:` CTAs on a mobile device and confirm the number is correct.
- Validate LocalBusiness JSON-LD after replacing example data.
- Confirm service-area links either resolve to real pages or are intentionally removed.
- Decide whether Cloudflare Web Analytics is off or explicitly documented. This starter does not include analytics.
- Add a production privacy page if forms, analytics, maps, call tracking, or third-party widgets are added.
