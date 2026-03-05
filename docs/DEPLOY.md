# Deployment (Vercel)

The site is deployed on **Vercel**. Push to `main` triggers a deploy via Vercel’s Git integration. CI runs in GitHub Actions (link check + key files); it does not perform the deploy.

## Post-deploy: social preview image

[index.html](../index.html) uses `https://peen.app/og-image.jpg` for Open Graph and Twitter cards. Either:

- Add an **og-image.jpg** (or **og-image.png**) at the repo root and redeploy, or  
- Point the `og:image` and `twitter:image` meta tags to an existing asset (e.g. `images/4.webp`) and set the full URL (e.g. `https://peen.app/images/4.webp`).

Until then, social shares may show no image or a fallback.
