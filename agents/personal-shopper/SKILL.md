---
name: personal-shopper
description: Research products, compare options, and find the perfect gift based on recipient and occasion.
---

# Personal Shopper & Gift Finder

Research products, validate prices/reviews, and generate gift ideas that aren't generic.

## When to Use

- "What's the best [X] under $[Y]?" / product comparison
- "Is this Amazon deal real?" / price validation
- Gift ideas for a specific person

## When NOT to Use

- Market research (deep-research), budgeting (budget-planner)

## Research Sources — Where to Actually Look

### Review & Research Sites

| Category | Best source | Why |
|----------|-------------|-----|
| Most consumer goods | Wirecutter (nytimes.com/wirecutter) | Long-term testing, updates picks when they fail |
| TVs, monitors, headphones, soundbars | `rtings.com` | Lab-measured data (input lag in ms, frequency response graphs), not vibes |
| Appliances, cars, mattresses | Consumer Reports (paywalled) — search `"consumer reports [product] reddit"` for summaries | |
| Enthusiast gear (knives, keyboards, flashlights, coffee, pens) | Product subreddit wiki/FAQ — `site:reddit.com/r/[hobby] wiki` | Actual users, not affiliate sites |
| Outdoor/camping | `outdoorgearlab.com` | Side-by-side field testing |
| Laptops | `notebookcheck.net` | Thermals, throttling, display calibration data |
| Skincare/cosmetics ingredients | `incidecoder.com` | Ingredient breakdown, no marketing |

### Curated & Boutique Sources

Prefer these over generic Amazon results — they surface more interesting, unique finds:

| Source | Best for | Why |
|--------|----------|-----|
| Wirecutter (nytimes.com/wirecutter) | Everyday products, gift guides | Rigorously tested, regularly updated |
| Conde Nast Traveler / GQ / Bon Appetit | Travel gear, fashion, food/kitchen | Editorially curated, taste-driven |
| Goop | Wellness, beauty, home, unique gifts | Curated luxury, discovers interesting small brands |
| Strategist (nymag.com/strategist) | Gift guides, home, fashion, wellness | Real-person recommendations, not algorithm-driven |
| Cool Material (`coolmaterial.com`) | Men's gifts, gear, home goods | Curated interesting finds |
| Uncommon Goods (`uncommongoods.com`) | Unique/artisan gifts | Handmade, small-batch, creative |
| Food52 (`food52.com`) | Kitchen, home, food gifts | Chef-tested, beautifully curated |
| Reddit gift threads | Any category | Search `site:reddit.com "[category] gift"` or `"best [product] reddit"` — real opinions from enthusiasts |

**Search pattern for honest reviews:** `"[product] reddit"` or `"[product] site:reddit.com"` — cuts through SEO affiliate spam. Also `"[product] long term"` or `"[product] after 1 year"`.

**Search pattern for curated finds:** `"[product/category] site:nymag.com/strategist"` or `"best [category] gifts site:goop.com"` — surfaces editorially picked items over algorithm-promoted ones.

## Price Validation — "Is This Deal Real?"

Amazon "40% off" is often off a fake inflated list price. Verify:

| Tool | Use | Access |
|------|-----|--------|
| **CamelCamelCamel** | Amazon price history chart — paste URL or ASIN | `camelcamelcamel.com` (free, webFetch works) |
| **Keepa** | Same but overlays directly on Amazon pages; more marketplaces | `keepa.com` (free tier sufficient) |

**Read the chart:** if "sale" price = the price it's been at for 6 of the last 12 months, it's not a sale. Real deals sit at or near the all-time low line. Flag any product where price spiked up right before the "discount."

**Fake review detection:** Fakespot shut down July 2025; ReviewMeta is currently down. Manual heuristics:

- Cluster of 5-star reviews in a 2-day window = paid review burst
- Reviews that mention "gift" / "haven't tried yet but looks great" = incentivized
- All reviews are 5 or 1 stars, nothing in between = manipulated
- Check reviewer profiles — dozens of 5-star reviews across random categories = fake account
- Sort by most recent, not "top" — recent reviews reveal quality decline after a product gets popular

## Product Recommendation Format

Always give 3 tiers so the user can self-select on budget:

- **Budget pick** — 80% of the performance at 40% of the price
- **Best overall** — the Wirecutter-style default
- **Upgrade** — only if the premium is justified by a specific use case; say what that use case is

For each: price, one-line "why this one," one-line "main tradeoff," and **always include direct links**:

- **Product link** — link to where the user can actually buy it (Amazon, retailer site, etc.). Search for the specific product and provide the real URL, not a homepage.
- **Review/source link** — link to the review, article, or Reddit thread that informed the recommendation
- **Price history link** — for Amazon products, include a CamelCamelCamel link so the user can check price history themselves

**Never recommend a product without at least a purchase link.** The whole point of a personal shopper is saving the user time — making them search for the product themselves defeats the purpose. Use webSearch to find actual product pages and verify URLs are live before sharing.

## Gift Framework — Beyond "Know the Person"

**The four gift modes** (pick one, don't blend):

1. **Upgraded everyday** — a nicer version of something they use daily but would never splurge on (good olive oil, merino socks, quality umbrella). Safest bet. Works for anyone.
2. **Experience** — class, tickets, tasting, subscription. No clutter. Good for people who "have everything."
3. **Consumable luxury** — fancy food/drink/candle they'll use up. Zero storage burden. Default for acquaintances, hosts, coworkers.
4. **Interest-deep-cut** — something only a real enthusiast would know about. Highest risk, highest reward. Requires research: search `r/[their hobby] "gift"` or `"best gifts for [hobby] enthusiast reddit"`.

**Extraction questions** (ask user, not recipient):

- What do they complain about? (Complaints → unmet needs → gifts)
- What have they mentioned wanting but not bought? (The $80 thing they keep not pulling the trigger on)
- What do they already own a lot of? (Signals the interest; buy adjacent, not duplicate)
- What did they get excited about recently?

**Variety rule — this is critical:**

Recommendations must span different categories. If someone asks for a gift, don't suggest 3 fragrances or 3 candles or 3 books — spread across different types of products unless the user specifically asked for a single category. For example, a good gift list might include one kitchen item, one experience, and one piece of gear. Variety shows thoughtfulness; a list of same-category items shows laziness.

**Hard rules:**

- Scented anything (candles, perfume, lotion) — only if you know their taste. Scent is personal.
- No decor unless you've seen their space
- No clothing with sizes unless you're certain
- Gift receipt always. Return window matters more than wrapping.

| Occasion | Default mode | Budget anchor |
|----------|--------------|---------------|
| Close friend birthday | Interest-deep-cut or upgraded-everyday | Whatever you'd spend on dinner together |
| Acquaintance / coworker | Consumable luxury | $20-40 |
| Housewarming | Consumable (nice pantry goods, wine) — no decor | $25-50 |
| Wedding | Registry. If off-registry, cash. | Cover your plate cost minimum |
| Thank-you | Consumable, handwritten note matters more than price | $15-30 |
| Host gift | Something they can use after you leave (not flowers — requires a vase and attention mid-hosting) | $15-30 |

**Gift recommendations must also include direct purchase links.** For each gift idea, provide a link to a specific product the user can buy — not just "nice olive oil" but a link to a specific bottle on a specific site.

## Limitations

- Can't see real-time stock/price — always tell user to verify before buying
- Can't access paywalled review sites directly (CR, some Wirecutter)
- Can't process transactions
