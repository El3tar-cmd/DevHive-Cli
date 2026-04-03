---
name: repl-seo-optimizer
description: Review and fix SEO issues in your Replit app's code before launch (meta tags, Open Graph, sitemap, structured data, SPA fixes)
---

# Repl SEO Optimizer

Review a Replit-built website or web app and implement SEO improvements directly in the code before launch.

## When to Use

- User wants to make sure their site is SEO-ready before deploying
- User asks to "optimize for SEO" or "make this searchable"
- User is about to launch and wants a pre-flight SEO check
- User notices their deployed site isn't showing up in search results

## When NOT to Use

- Auditing an external website the user didn't build (use seo-auditor skill)
- Building SEO landing pages at scale (use programmatic-seo skill)
- Content strategy or keyword research without a live codebase

## Approach

This is a hands-on skill. Don't just list recommendations — read the code, identify what's missing, and implement the fixes directly.

### Step 1: Scan the Project

Read the project structure to identify:

- Framework (React/Vite, Next.js, Express, Flask, static HTML, etc.)
- Entry point HTML file(s) — `index.html`, `public/index.html`, etc.
- Routing setup — client-side (React Router) vs. server-rendered
- Existing `<head>` content — meta tags, title, Open Graph tags
- Any existing sitemap or robots.txt

### Step 2: Fix Critical SEO Foundations

**Title & Meta Description:**

- Every page needs a unique `<title>` (50-60 chars) with primary keyword near the start
- Every page needs a `<meta name="description">` (150-160 chars) with a clear value proposition
- For SPAs: implement dynamic titles per route (e.g., `document.title` or `react-helmet` / `react-helmet-async`)

**Heading Structure:**

- Exactly one `<h1>` per page/route containing the primary keyword
- Logical hierarchy — no skipping from H1 to H3
- Check that headings aren't used purely for styling

**Semantic HTML:**

- Replace generic `<div>` wrappers with `<header>`, `<main>`, `<nav>`, `<footer>`, `<article>`, `<section>` where appropriate
- Use `<a>` for navigation links, not click-handler divs
- Use `<button>` for actions, `<a>` for navigation

### Step 3: Open Graph & Social Sharing

Add to `<head>` on every page (or the SPA shell):

```html
<meta property="og:title" content="Page Title">
<meta property="og:description" content="Page description">
<meta property="og:image" content="https://yourdomain.com/og-image.png">
<meta property="og:url" content="https://yourdomain.com/page">
<meta property="og:type" content="website">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="Page Title">
<meta name="twitter:description" content="Page description">
<meta name="twitter:image" content="https://yourdomain.com/og-image.png">

```

For SPAs, these must be set server-side or via pre-rendering for crawlers to see them.

### Step 4: Technical SEO in Code

**Image Optimization:**

- All `<img>` tags need `alt` attributes (descriptive, not "image1")
- Add `width` and `height` attributes to prevent CLS
- Use `loading="lazy"` on below-the-fold images
- Prefer WebP format where possible

**Link Quality:**

- Internal links use descriptive anchor text, not "click here"
- External links use `rel="noopener noreferrer"` and consider `target="_blank"`
- No broken internal links — check route references match actual routes

**Performance (SEO-impacting):**

- Fonts: use `font-display: swap` in `@font-face` rules
- Defer non-critical JS: `<script defer>` or dynamic imports
- Inline critical CSS or ensure CSS loads early
- Avoid render-blocking resources in `<head>`

### Step 5: Crawlability Setup

**robots.txt** — create at project root / public directory:

```text
User-agent: *
Allow: /
Sitemap: https://yourdomain.com/sitemap.xml

```

**sitemap.xml** — create listing all public pages:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://yourdomain.com/</loc>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <!-- Add all public routes -->
</urlset>

```

For dynamic sites, generate the sitemap from your routes programmatically.

**Canonical URLs:**

- Add `<link rel="canonical" href="https://yourdomain.com/current-page">` to each page
- Prevents duplicate content issues between www/non-www, trailing slashes, query params

### Step 6: SPA-Specific Issues

Single-page apps (React, Vue, etc.) have unique SEO challenges:

**Problem:** Crawlers may not execute JavaScript, so they see an empty `<div id="root">`.

**Solutions (in order of preference):**

1. **Pre-rendering:** Use a build-time tool to generate static HTML for each route (e.g., `react-snap`, `prerender-spa-plugin`)
2. **Server-side rendering:** If using Next.js or Remix, SSR is built in — verify pages render server-side
3. **Meta tag injection:** At minimum, ensure the HTML shell has good default meta tags

**SPA Routing:**

- If using hash routing (`/#/about`), switch to browser history routing (`/about`) — search engines ignore hash fragments
- Ensure the server returns the SPA shell for all routes (catch-all / wildcard route) so direct URL access works

### Step 7: Structured Data

Add JSON-LD schema markup in a `<script type="application/ld+json">` block. Choose based on site type:

| Site Type | Schema |
|-----------|--------|
| Business / SaaS | `Organization`, `WebSite`, `WebApplication` |
| Blog / Content | `Article`, `BlogPosting`, `BreadcrumbList` |
| Product / Store | `Product`, `Offer`, `AggregateRating` |
| Portfolio | `Person`, `CreativeWork` |
| Local business | `LocalBusiness`, `PostalAddress` |

Example for a SaaS landing page:

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "name": "App Name",
  "description": "What the app does",
  "url": "https://yourdomain.com",
  "applicationCategory": "Category",
  "operatingSystem": "Web"
}
</script>

```

## Pre-Launch Checklist

Run through before deploying:

- [ ] Every page has a unique `<title>` and `<meta name="description">`
- [ ] One `<h1>` per page with relevant keyword
- [ ] Open Graph and Twitter Card meta tags present
- [ ] All images have descriptive `alt` text and dimensions
- [ ] Semantic HTML elements used (`<main>`, `<nav>`, `<header>`, `<footer>`)
- [ ] `robots.txt` exists and allows crawling
- [ ] `sitemap.xml` exists and lists all public pages
- [ ] Canonical URLs set on each page
- [ ] No broken internal links
- [ ] Fonts use `font-display: swap`
- [ ] Below-fold images use `loading="lazy"`
- [ ] Structured data (JSON-LD) added for site type
- [ ] SPA routes work with direct URL access (no 404s)
- [ ] Page loads in under 3 seconds on mobile

## Output

Always present key findings and recommendations as a plaintext summary in chat, even when also generating files. The user should be able to understand the results without opening any files.

## Best Practices

1. **Implement, don't just recommend** — read the actual code and make the changes
2. **Start with the highest-impact fixes** — title tags and meta descriptions matter more than schema markup
3. **Don't over-optimize** — keyword stuffing hurts rankings; write naturally
4. **Test after changes** — run the app and verify pages render correctly with the new tags
5. **Respect the user's content** — improve SEO without changing their messaging or design intent
