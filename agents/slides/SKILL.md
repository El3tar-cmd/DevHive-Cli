---
name: slides
description: Instructions for building and editing slide deck artifacts in the Replit workspace. Use this skill when the user asks for slides, a presentation, a pitch deck, a slide deck, or any slide-based content. Covers the manifest contract, slide component conventions, visual editing compatibility, and design guidance for creating presentations.
---

# Slides -- Presentation Decks in Code



<context>
A slides artifact is a React + Tailwind CSS application that functions as a slide deck. Each slide is a separate React component file in `src/pages/slides/`, rendered at a unique `/slideN` URL route (e.g., `/slide1`, `/slide2`). This React app runs inside a workspace app preview, where the preview wraps it in a custom slide viewer / editor UI. That UI provides a thumbnail sidebar for navigation, PPTX export, and visual editing controls that let the user reorder slides, add or delete slides, and edit visual properties like colors and text directly from the Replit interface.

The workspace UI includes a visual editor that lets users click on elements in a slide and modify them (text, colors, layout). For this to work, the editor must be able to map each DOM element back to a specific line in your JSX source. This means slide components must use static, inline JSX -- every element written out by hand, no `.map()` loops, no dynamic content generation, no `<br/>` tags. Use Tailwind spacing utilities instead of line breaks.

The slide manifest at `src/data/slides-manifest.json` is the contract between your React app and the workspace. The workspace reads this file to populate its UI -- thumbnails, titles, ordering, descriptions, and speaker notes all come from the manifest. Each entry has `id` (UUID string), `position` (contiguous 1-based number), `filepath` (e.g. `src/pages/slides/MarketOverview.tsx`), `title`, `description`, and `speakerNotes`. Do not modify the `speakerNotes` field -- it is a user-facing field managed by the workspace UI. When creating new manifest entries, initialize `speakerNotes` to `""` and never update it afterward. When you create, remove, or reorder slides you must update this manifest. The Replit UI may also modify this file based on user interactions, so re-read `slides-manifest.json` before editing it rather than assuming your last write is still current. After any manifest or slide file change, run `pnpm run --filter @workspace/<slug> validate-slides` to catch broken invariants before they reach the user.

Visiting the root URL (`/`) renders a presentation viewer that displays slides in a 16:9 aspect ratio centered on a black background with keyboard/click navigation. Individual slides must remain accessible at `/slideN` for workspace preview, and `/allslides` for export. Unknown routes redirect to the first slide. The routing logic in `App.tsx` must not be modified. The SPA is configured with a catch-all rewrite so that direct navigation to any route works correctly. No additional routing configuration is needed for deployment.

Slides are composed for **16:9 aspect ratio** (1920x1080 reference). Each slide's root container must use `w-screen h-screen overflow-hidden relative`. The `/allSlides` view relies on CSS selector overrides (`[&_.w-screen]:!w-full [&_.h-screen]:!h-full`) to scale slides into fixed-size boxes, so these classes are required -- do not replace them with `w-full h-full` or other alternatives. Use viewport-relative units (`vw`/`vh`) for sizing text, spacing, and elements so proportions stay consistent regardless of screen size. Each slide component must use a **default export**. Place static assets you create (not user-attached) in `public/` so they are served at the base URL. User-attached assets use the `@assets/...` import syntax.
</context>

Your goal is to create visually stunning, professional slide decks. Every deck should look like it was designed by a top-tier design agency. Prioritize clarity, visual hierarchy, and polish. Your work should feel "crafted," not "assembled." Each slide is a single, static, full-screen 16:9 frame. The content should be immediately visible on load. Every deck should have a specific, nameable aesthetic direction. Reject mediocrity. Build something with a point of view.

<first_build>
When building a new slide deck for the first time, follow this exact sequence:

1. **Research brand** (real companies only): Use a single `webSearch` call with multiple queries to find brand colors, fonts, and visual identity concurrently.
2. **Generate images** (if needed): Kick off `generateImageAsync` via the media-generation skill FIRST so images generate in parallel while you write slides.
3. **Write ALL files in a single parallel batch.** `index.html`, `index.css`, every slide `.tsx` file, and `slides-manifest.json` are all independent — write them ALL in one parallel tool call. Do not write them sequentially.
   - `index.html`: Update Google Fonts links for your chosen display + body fonts.
   - `index.css`: Fill in CSS variables in `:root` with brand palette and font families. Use the `@theme inline` tokens — write `text-primary`, `bg-accent`, `font-display` in Tailwind classes instead of inline styles.
   - Each slide `.tsx` file in `src/pages/slides/`
   - `slides-manifest.json` with all entries
4. **Run validation**: `pnpm run --filter @workspace/<slug> validate-slides`
5. **Restart workflow** — done.

Do NOT restart workflow until all slides are written. Do NOT read files you just scaffolded — they are already in your context.
A quick seamless build is what you are aiming for. Unless explicitly asked for more, limit the number of slides to 7 in the first build.
Avoid screenshotting in the first build. You have two priorities: speed and design.
</first_build>

<planning>
Before writing any code, establish your creative direction:

1. **Brand research**: For real companies, use `webSearch` to find their official brand guidelines, colors, fonts, and visual identity. Use their real palette and typography -- don't guess. If official guidelines aren't available, base your palette on the company's public-facing website and explicitly note that the colors are inferred, not official. Use a single `webSearch` call with multiple queries to search concurrently:

   ```text
   webSearch({
     queries: [
       "[company] brand guidelines",
       "[company] brand colors hex",
       "[company] visual identity site:brandfetch.com",
       "[company] logo usage guidelines filetype:pdf"
     ]
   })
   ```

   Use `webSearch` to find brand color hex codes on sites like Brandfetch, brand guideline PDFs, and design blog posts that document the company's visual identity. Never guess brand colors when you can look them up.
2. **Content research**: If the deck is about a real company, product, industry, or topic, use `webSearch` to gather real facts, figures, and context before writing any slides. Do not fabricate statistics, revenue numbers, headcount, market share, or any verifiable claim. Search for the real data in a single batch call:

   ```text
   webSearch({
     queries: [
       "[company] investor presentation 2026",
       "[company] annual report key metrics",
       "[company] revenue employees market share",
       "[topic] statistics 2026",
       "[industry] market size growth rate"
     ]
   })
   ```

   If you cannot verify a figure from a real source, either omit it or mark it explicitly as an estimate. A deck with 5 real numbers is better than one with 20 invented ones.
3. **Image sourcing**: For real companies and products, use Brave Image Search (via the `external_apis` skill and `externalApi__brave`) to find real logos, product photos, office images, and team photos. Real imagery makes the deck feel authentic -- don't generate a fake logo when the real one is searchable. Download found images to `attached_assets/` and import them with the `@assets/...` syntax. Fall back to the `media-generation` skill only for supplemental or abstract visuals that don't exist on the web.
4. **Color palette**: Pick a bold, intentional palette. State exact hex codes. You want 1 primary, 1 accent, 1-2 neutrals, and a background tone. The palette should have a clear vibe -- editorial, corporate, playful, luxurious, energetic, whatever fits the content. Every color should feel like a deliberate choice. Build every slide from these colors -- consistency is what makes it feel designed, not generated.
5. **Typography**: Pick ONE display font + ONE body font. Choose from common PowerPoint-bundled fonts that work on web or popular Google Fonts -- decks are exported to PPTX and other platforms, and fonts that don't exist on the target platform will break the slide. Analyze the emotional goal of the deck, then select a font *type* that amplifies it:
   - Trust/Authority -> strong geometric sans-serif
   - Corporate/Professional -> neutral, clean sans-serif
   - Excitement/Energy -> condensed bold display
   - Luxury/Premium -> refined serif or high-contrast sans
   - Tech/Developer -> geometric sans or monospace
   - Playful/Creative -> rounded or expressive sans
   - Editorial/Culture -> elegant serif paired with a clean sans
   Every deck should feel typographically distinct. Do not fall back on the same font pairing across different decks -- vary your choices. The font IS the personality of the deck. A wrong font choice undermines everything else.
6. **Deck aesthetic direction**: Pick a specific aesthetic direction and commit. The direction dictates everything -- how slides are composed, what the visual tone feels like, how information is presented. **Match the visual energy of the deck to the subject matter.** A birthday party deck should feel festive; a board meeting deck should feel precise. Some examples to spark your thinking:
   - **Corporate Minimal** -- clean sans-serif, generous whitespace, muted neutrals + one bold accent, grid-aligned layouts, restrained. Best for: investor updates, board decks, quarterly reports.
   - **Bold Editorial** -- oversized display type, strong color blocks, asymmetric layouts, magazine-inspired, high visual contrast. Best for: marketing pitches, brand launches, thought leadership.
   - **Warm Storytelling** -- serif headlines, earthy warm palette, photography-forward, organic shapes, human and approachable. Best for: nonprofit pitches, personal narratives, community updates.
   - **Data-Forward** -- clean geometric type, structured grids, prominent stats and numbers, minimal decoration, credibility through precision. Best for: research presentations, analytics reviews, financial summaries.
   - **Tech Product** -- dark backgrounds, crisp sans-serif, code-inspired grid layouts, accent colors on dark, product-screenshot-heavy. Best for: product demos, developer talks, SaaS pitches.
   - **Playful/Creative** -- rounded fonts, saturated colors, hand-drawn accents, loose layouts, personality-driven. Best for: birthday parties, pet showcases, hobby projects, kids' topics.
   These are starting points -- invent your own direction if the content calls for it. The point is to have a nameable aesthetic, not a vague "clean and modern."

   **Context matters for imagery too.** Corporate and formal decks should lean on clean typography, whitespace, and restrained visuals -- decorative images distract. But fun, personal, or creative topics should tastefully include generated images, illustrations, and rich photography. A deck about dogs deserves cute dog photos; a birthday party deck deserves festive visuals and warm colors. Read the room and design accordingly.
7. **Asset planning**: Inventory any assets the user attached (logos, product shots, brand images, etc.) and decide where each one appears. Then plan what additional images to source with the `media-generation` skill to fill the remaining slides. Rich visual material elevates a deck -- plan it upfront, not as an afterthought.

Commit to a direction and execute.
</planning>

<visual_composition>
Every slide should have visual depth and intentional composition. Layer backgrounds, content, and accent elements to create polish.

**Layer your slides:**

1. **Background**: Gradient, subtle texture, muted brand-colored shape, or photography. Use at minimum a very subtle gradient or tinted background for depth.
2. **Content**: Your primary message -- typography, data, key visuals. This is the main event. Strong hierarchy is essential: one thing should clearly dominate (usually the headline or a hero number).
3. **Accent elements**: Shapes, lines, brand marks, color blocks, or dividers that create visual rhythm and tie the deck together. These are subtle but they separate amateur from professional.

**Composition principles:**

- Mix centered layouts with left-aligned, right-aligned, and asymmetric compositions. Visual tension keeps the viewer engaged.
- Use generous padding (at least 5-8vh from edges). Content crammed to the edges looks unfinished.
- Create clear visual hierarchy: one dominant element per slide (headline, hero image, big stat), supported by secondary elements at obviously different scale.
- White space is a design element -- balance content and breathing room.
- When using images alongside text, give images real estate. If you're using an image, let it be prominent.
- The title slide (slide 1) should always include a high-quality generated or user-provided image. This is the first thing the viewer sees -- make it visually rich, not a plain text-on-color slide.
- Roughly 1 in every 4-5 slides should use a **full-bleed high-resolution image as the background** with bold, high-contrast text on top. These slides create visual impact and break up text-heavy runs. Use a semi-transparent overlay or gradient so text remains readable. Source the image via the `media-generation` skill and keep the text large and minimal.
- Give images real visual space. A slide with one strong image at 50% width beats a slide with three tiny thumbnails.

**Asset usage:**

- **User-attached assets come first.** Feature them prominently -- use ALL of them.
- **Generate supplemental assets to fill gaps.** Use the `media-generation` skill for custom visuals and photos of real people, places, and products.
- Real images and photography are what make a deck feel produced and professional.

**Design principles:**

- Pick an aesthetic and apply it to every single slide. A deck where each slide looks like it came from a different template is worse than a simple but consistent deck.
- Pursue cohesive art direction, intentional color palettes, restraint, and strong typographic hierarchy.
- Use Tailwind and CSS variables from `index.css`. Import your fonts from Google Fonts via `index.html`. Use CSS variables for your color palette so every slide stays in sync.
- When the user wants simple: focus on clean execution, strong typography, and generous whitespace. The difference between beautiful simplicity and lazy simplicity is intentional spacing, a great font, and a cohesive palette.
</visual_composition>

<slide_layouts>
Use a variety of slide layouts to keep the deck visually engaging. Match layouts to content.

**Core layout patterns:**

- **Title Slide**: Hero display typography at large scale with a high-quality full-bleed or prominent hero image. Minimal supporting text (subtitle or date). Brand mark/logo if available. Sets the visual tone for the entire deck. This is your first impression -- make it count. The title slide should always feature a striking image: use a user-provided asset if available, otherwise generate one via the `media-generation` skill. Layer bold, high-contrast text over the image with a semi-transparent overlay or gradient for readability. A typography-only title slide is acceptable only when the user explicitly requests a minimal or text-only approach.
- **Content Slide (Title + Bullets)**: Big headline at the top, then 3-6 bullet points underneath. The workhorse layout for communicating lots of information. Keep bullets concise -- phrases, not sentences.
- **Two-Column**: Headline, then two columns of content below. Each column can have a sub-header, supporting text, and optionally an image or icon above it. Great for comparisons, before/after, pros/cons.
- **Three-Column**: Headline, then three columns. Each column gets a visual element (icon, image, or large number) and brief text. Good for features, process steps, team members.
- **Big Stat / Data Slide**: A single large number or metric as the hero element (displayed at 8-12vw). Supporting context text at smaller scale. The stat is the slide -- everything else is subordinate.
- **Image-Feature Split**: Image on one half, text on the other half. Works for product shots, team photos, case studies. Give the image at least 45-55% of the slide width.
- **Quote / Emphasis**: Centered pull quote at large scale. Attribution below in smaller text. Can use a subtle background image at low opacity for depth. Great for customer testimonials, key insights, or dramatic statements.
- **Section Divider**: Bold text, strong accent color, signals a topic change. Minimal content -- just the section title and maybe a one-line subtitle. Gives the viewer a visual break and resets attention.
- **Closing Slide**: Company name or logo lockup with tagline, contact info, or call to action. Bookends the deck with the same brand treatment as the title slide.

**Layout variety rules:**

Match variety to deck type:

- **Board decks, memos, internal reports** -- Consistent, repeatable formats. Very similar or identical structure slide after slide (besides title and closing). Predictability is a feature.
- **Pitches, marketing, external presentations** -- Meaningful variation between slides. Mix layouts to keep visual interest high. The goal is professional and polished, not flashy or cluttered.

Most decks should be around 6 slides.
</slide_layouts>

<typography_system>
Typography is the backbone of slide design. Get this right and the deck is 80% there.

**Hierarchy:**

1. **Display / Hero**: Headlines, big stats, section titles. Use your display font at large scale (4-7vw for main headlines). Bold or black weight. Tight letter-spacing (`tracking-tighter` or `tracking-tight`).
2. **Subheading**: Slide subtitles, column headers. Same display font at medium scale (2-3vw), or body font at bold weight.
3. **Body**: Supporting text, bullet points, descriptions. Body font at readable scale (1.5-2vw). Regular or medium weight.
4. **Caption / Detail**: Attribution, footnotes, fine print. Body font at small scale (1.2-1.5vw). Light or regular weight. Lower opacity (60-80%).

**Rules:**

- Mix font weights aggressively to create hierarchy. If your headline and body text are the same weight, the slide has no visual structure.
- Use letter-spacing and line-height intentionally. Tight tracking on bold headlines. Relaxed line-height on body text for readability.
- Keep text short -- phrases and fragments over full sentences. Split dense content across multiple slides.

**Font sizing reference (viewport-relative):**

| Element | Size | Weight |
| --- | --- | --- |
| Hero headline | 5-7vw | Bold/Black |
| Slide headline | 3-4.5vw | Bold |
| Subheading | 2-3vw | Semibold |
| Body text | 1.5-2vw | Regular/Medium |
| Caption | 1.2-1.5vw | Regular/Light |
| Big stat number | 8-12vw | Black |

</typography_system>

<image_asset_paths>
Slide decks are served under a dynamic base path (e.g., `/dog-workshop/`, `/pitch-deck/`). The base path is set via the `BASE_PATH` environment variable and made available at runtime through Vite's `import.meta.env.BASE_URL`. A hardcoded path like `/hero.png` will break because the asset is actually served at `/<base-path>/hero.png`.

Use **two different patterns** depending on where the image comes from:

- **Files in `public/`**: Prefix the path with `import.meta.env.BASE_URL`. This is the right pattern for static assets you create inside the artifact, including generated images you want to ship with the deck.
- **User-attached files imported from `@assets/...`**: Do **not** prefix them with `import.meta.env.BASE_URL`. Vite already resolves imported assets to the final URL string.

If you generate a new image for the deck, prefer placing it in `public/` and referencing it with `import.meta.env.BASE_URL`. If the user uploaded an image, either keep it as an `@assets/...` import or intentionally copy/move it into `public/` before switching to a base-path-prefixed string path.

At the top of every slide component that uses `public/` images, read the base URL into a module-level constant:

```tsx
const base = import.meta.env.BASE_URL;

export default function MySlide() {
  return (
    <div className="relative w-screen h-screen overflow-hidden">
      <img src={`${base}hero.png`} crossOrigin="anonymous" className="w-full h-full object-cover" alt="Hero image" />
    </div>
  );
}
```

For user-attached assets, import them directly instead:

```tsx
import logoPng from '@assets/logo.png';

export default function MySlide() {
  return <img src={logoPng} crossOrigin="anonymous" alt="Logo" />;
}
```

</image_asset_paths>

<animations>
These rules apply **only when the user explicitly asks for animations**. If the user has not requested animations, ignore this section entirely and follow the default no-animation constraint above.

**Per-slide scoping:**

- All animations must be scoped to the individual slide component. Each slide owns its own animations -- they start when the slide mounts and live entirely within that slide's component file.
- When navigating back to a slide (e.g., returning to `/slide3`), its animations must restart from the beginning. Use the route change or a `key` prop tied to navigation to force a remount so animations always replay on entry.
- The `design` subagent can create SVG animations for persistent or looping motion effects within a slide.

**No transitions between slides:**

- Do not animate the transition from one slide to another. No slide-in, slide-out, cross-fade, or any motion between slides. Navigation between slides must be instantaneous. Animations happen *within* a slide, never *across* slides.

**`/allSlides` compatibility:**

- The `/allSlides` route screenshots every slide for static export (thumbnails, PDF, PPTX). Animated slides must render all their content visibly on `/allSlides` -- either disable animations entirely when rendered inside `/allSlides`, or ensure all animated elements reach their final visible state immediately. You can detect the `/allSlides` context by checking `window.location.pathname.endsWith("/allslides")` and skipping animations accordingly.
</animations>

<quality_checks>
Before considering the deck complete, run these checks:

- **Squint test**: Squint at each slide. Can you still see the visual hierarchy? If everything blurs into the same level of importance, your hierarchy is too flat.
- **Readability test**: Is all text at least 1.5vw? Could someone in the back row of a conference room read every word?
- **Consistency test**: Do slides with similar content use similar layouts and styling? Does the color palette hold across every slide? Does the typography system stay consistent?
- **Flow test**: Click through the deck from slide 1 to the end. Does it tell a clear story? Do section dividers appear where they should? Does the closing slide feel like a proper ending?
- **Brand test**: For real company decks -- would the company recognize this as "theirs"? Are the colors, fonts, and tone aligned with their brand?
- **Content density test**: Does any slide have more than 6 lines of text or feel like a document page? Split it.
- **Whitespace test**: Does any slide have an entire half that's empty for no reason? Does any slide feel crammed? Balance is the goal.
- **Emoji audit**: Scan every slide for emoji characters. If any emoji appears anywhere in the deck -- titles, bullets, labels, descriptions, speaker notes -- remove it immediately. This is a hard quality gate. A single emoji fails the entire deck.
- **Overflow test**: Does any slide have content clipped at the bottom or right edge? Mentally verify that the total stacked height of all elements (including padding, gaps, and headings) does not exceed 100vh. Card grids, multi-column layouts, and bullet lists are the most common overflow offenders. If content is cut off, reduce items, shrink sizing, or split the slide.
</quality_checks>

<implementation_checklist>

1. Establish creative direction (palette, fonts, aesthetic). Write it out before any code.
2. Plan assets -- inventory user-attached files, plan supplemental images.
3. Set up `index.html` (fonts) and `index.css` (CSS variables).
4. Build slides in `src/pages/slides/`. Title slide first to lock in the visual system.
5. Update `src/data/slides-manifest.json` manifest for each slide.
6. Run `pnpm run --filter @workspace/<slug> validate-slides` and fix any issues.
7. Run quality checks.
8. Present the artifact.

</implementation_checklist>

<constraints>
These constraints are non-negotiable. Every slide must comply. Content must be statically visible immediately on load -- this is critical for compatibility with screenshot-based export.

**Interactivity:**

- No buttons of any kind (no CTAs, no "Learn more", no "Get started")
- No hover effects, tooltips, or interactive states (except on allowed interactive elements below)
- **Default: no animations.** Do not add animations, transitions, fade-ins, slide-ups, framer-motion, CSS transitions, or keyframe animations unless the user explicitly requests them. See the `<animations>` section for rules when the user does request animations.
- No dynamic behavior (no `onClick`, no `onHover`, no state-driven visibility changes) except for allowed interactive elements below
- No form elements, toggles, or inputs
- No scrolling on any slide -- everything fits entirely within one viewport frame
- No "presentation viewer" chrome or slide-sizing wrapper inside individual slide components -- slides are always full screen (`w-screen h-screen`). The deployment viewer at `/` handles presentation framing externally.

**Allowed interactive elements:**

The following elements are permitted and may include their natural interactive behaviors (hover states, click handlers, tooltips, etc.):

- **Charts and data visualizations** -- Use libraries like Recharts, Chart.js, or D3. Charts may include hover tooltips, legends, and interactive data points. Ensure charts render their data visibly on initial load for screenshot export compatibility.
- **Tables** -- Data tables may include sortable columns, scrollable overflow for large datasets (within the table container only, not the slide itself), and hover-highlighted rows.
- **Links** -- Anchor tags (`<a href="...">`) are allowed for linking to external URLs. Style them to be visually identifiable (underline, distinct color). Use `target="_blank" rel="noopener noreferrer"`.
- **Embedded videos** -- Use `<iframe>` or `<video>` tags for embedding video content (YouTube, Vimeo, or self-hosted). Videos must not autoplay. Provide a visible poster/thumbnail so the slide looks complete in screenshot export.

These elements are exceptions to the general no-interactivity rule. All other interactivity restrictions still apply -- do not use these exceptions as a loophole to add general-purpose buttons, navigation controls, or app-like UI.

**Frame containment:**

- Each slide's root container must use `w-screen h-screen overflow-hidden relative`. These exact classes are required because the `/allSlides` export view uses CSS selector overrides to scale them down. Do not substitute with `w-full h-full`.
- Use viewport-relative units (`vw`/`vh`) for sizing text, spacing, and elements. Avoid hardcoded pixel values for font sizes, positions, or element dimensions.
- **All content must be fully visible within the 16:9 frame.** Nothing can overflow or get clipped by `overflow-hidden`. If you have a list of items, cards, or bullet points that might exceed the vertical space, reduce the number of items, shrink their sizing, or split across two slides. Account for padding, headings, and subtitles when calculating how much vertical space remains for content. A common failure mode is stacking too many cards or list items vertically so the bottom ones get cut off -- always verify the total height of your content fits within `100vh` minus your top and bottom padding.
- **Think before you build.** Before laying out a slide, mentally account for the space your headings, padding, and gaps consume. Then verify the remaining content fits in what's left. If it doesn't, reduce content or split across slides. Card grids, long bullet lists, and multi-column layouts are the most frequent causes of overflow -- when using these patterns, err on the side of fewer items with more breathing room. A heading + subtitle + padding typically consumes 25-30vh, leaving roughly 65-70vh for content. If your cards or list items don't fit in that remaining space, you have too many -- remove items or split across slides. Never add a "just one more" row that pushes content past the bottom edge.
- **Text must fit its container.** If you give a container a fixed height, the text inside must actually fit at the chosen font size. Clipped or truncated text is a bug, not a feature. Reduce content length or font size so everything is visible.
- **Absolute positioning safety.** Elements using `absolute` or `fixed` positioning must stay fully within the viewport. Use `vh`/`vw` values that keep content inside the 100vh/100vw boundary -- never position an element where its content could extend off-screen.

**Visual:**

- Never use plain white (`#ffffff`) or plain black (`#000000`) as a slide background -- at minimum use a very subtle off-white, off-black, or gentle gradient
- Never place text directly on a flat solid color with nothing else on the slide
- Never center every slide -- mix asymmetric layouts, left-aligned type, and edge-aligned elements to create visual tension
- No text or elements going off the page -- everything must be visible within the 16:9 frame
- No slides where an entire half is empty whitespace with no purpose
- No low-contrast text (text over full-opacity busy images without an overlay) -- always use semi-transparent overlays, text shadows, or place text on a contrasting region
- Always vary your layouts -- if every slide is "title on top, bullets below," the rhythm dies

**Typography:**

- No text smaller than 1.5vw
- Max 6 lines of text per slide -- if you have more to say, split it across two slides
- Max 2 fonts (one display + one body)
- Only use common PowerPoint-bundled fonts or popular Google Fonts -- niche or decorative fonts break when exported to PPTX or other platforms. Each deck should use a different font pairing -- do not default to the same fonts every time
- No text walls -- slides are not documents

**Style:**

- No neon colors, purple gradients, or cyan/magenta palettes (unless specifically requested)
- No generic dark mode with glowing elements
- No random visual treatments (every slide uses a different trick)
- No clip art or generic stock illustrations
- No drop shadows on everything
- No overusing AI-generated images (especially as full-slide backgrounds) -- use them sparingly and purposefully
- No more than 2-3 image-background slides per deck

**Content:**

- **Never use emoji.** Not in slide text, not in speaker notes, not in titles, not in bullet points, not in any user-visible content. This includes Unicode emoji characters, emoji shortcodes, and decorative symbols used as emoji substitutes (e.g. 🚀 🎯 💡 ✅ 📊 🔥 and similar are all banned). Arrows (→), checkmarks (✓), bullets (•), and stars (★) are fine as typographic elements -- but anything that renders as a colorful pictograph is not. Emoji makes slides look unserious and unprofessional. If you need visual indicators, use proper icons, shapes, or typographic symbols instead. This rule has zero exceptions -- even for "fun" or "casual" decks.
- No decks shorter than 6 slides unless the user explicitly asks for a short deck

**Visual editing compatibility:**

- No `.map()`, `.forEach()`, or any loop to generate slide content -- write every element by hand in JSX
- No extracting content into arrays or variables that are then mapped into JSX -- inline everything
- No `<br/>` tags or similar line-break elements in JSX text -- use proper Tailwind spacing utilities (`mt-[2vh]`, `gap-[1vh]`, `leading-relaxed`, etc.) instead
- Prefer Tailwind utility classes over custom `<style>` tags or inline `style` objects. Only reach for custom CSS when Tailwind genuinely can't express what you need.
- Use Tailwind theme tokens (`text-primary`, `bg-accent`, `font-display`, `font-body`) from `index.css` instead of inline `style={{ }}` objects. Only reach for inline styles when Tailwind genuinely can't express what you need.
- Every visible element must correspond to a unique, static location in the JSX source

**Technical:**

- Slide components go in `src/pages/slides/`
- Use viewport-relative units (`vw`/`vh`) for everything
- Add `crossOrigin="anonymous"` to all `<img>` tags
- Use `<img>` tags over CSS backgrounds
- Do NOT use `attached_assets/` as a URL path -- always use the `@assets/...` import syntax
- **Prefix only `public/` image paths with `import.meta.env.BASE_URL`** -- never hardcode paths like `/image.png`, and do not prepend `BASE_URL` to `@assets/...` imports.
- When generating images with the `media-generation` skill, always use `removeBackground: true` for images overlaid on colored backgrounds, and include "no text, no words, no letters" in the prompt

</constraints>