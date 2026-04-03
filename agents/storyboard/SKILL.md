---
name: storyboard
description: Create storyboards for social media videos, UGC content, and short-form video campaigns.
---

# Storyboarding for Social Content

Shot-by-shot storyboards for TikTok, Reels, YouTube Shorts, and UGC ad scripts. Built around retention physics, not film-school conventions.

## When to Use

- TikTok / Reel / YouTube Short planning
- UGC ad scripts (creator briefs, testimonial mashups)
- Multi-platform video campaigns

## When NOT to Use

- Static ads (ad-creative) · Written posts (content-machine) · Slide decks (use slides skill)

## Platform Specs (2025-2026)

| Platform | Ratio | Resolution | Max duration | Sweet spot | File |
|---|---|---|---|---|---|
| TikTok | 9:16 | 1080×1920 | 10 min in-app / 60 min upload | **21-34 sec** | MP4/MOV, H.264, 287MB mobile / 500MB web |
| Instagram Reels | 9:16 | 1080×1920 | 3 min in-app / 15 min upload | **<90 sec** for Explore boost | MP4/MOV, 4GB |
| YouTube Shorts | 9:16 | 1080×1920 (up to 4K) | **3 min** | 15-60 sec | MP4 |
| YouTube long-form | 16:9 | 1920×1080+ | unlimited | 8-12 min (mid-roll ads) | — |

**Universal safe zone for cross-posting:** Keep all text, faces, logos inside the **center 900×1400** of the 1080×1920 frame. Top 14% + bottom 20-35% are covered by UI on at least one platform.

## The 3-Second Rule (Data-Backed)

TikTok's algorithm scores hook retention **separately** from total watch time. 2025 creator analytics:

| 3-sec retention | View multiplier | Outcome |
|---|---|---|
| **85%+** | 2.8× | Viral tier — FYP push |
| **70-85%** | 2.2× | Optimal reach |
| **60-70%** | 1.6× | Average |
| **<60%** | baseline | Minimal distribution |

**Target: keep ≥65% of viewers past 0:03.** If you're losing >35% in 3 seconds, the hook is broken — rewrite the opening, not the body. 84% of viral TikToks in 2025 used an identifiable psychological trigger in the first 3 seconds.

## Named Hook Formulas

The scroll-stopping element must fire in **0-2 seconds**. Seconds 3-5 expand it. **Never introduce — interrupt.** Banned openers: "Hey guys," "Welcome back," "So today I'm gonna..."

| Hook | Template | Trigger |
|---|---|---|
| **POV** | "POV: you just found out [revelation]" | Puts viewer inside the scenario; personal relevance |
| **Stop-scrolling callout** | "Stop scrolling if you're a [role] who [pain]" | Audience self-selects; filters for high-intent |
| **Contrarian** | "Everyone says X. That's completely wrong." | Cognitive dissonance demands resolution |
| **Unfinished story** | "I almost [drastic action] until I found..." | Open loop — Zeigarnik effect |
| **Negative listicle** | "3 [category] mistakes that are costing you [outcome]" | Loss aversion > gain framing |
| **Number hook** | "$47,000 in 30 days — here's the exact breakdown" | Specificity = credibility |
| **Secret reveal** | "What [authority] doesn't want you to know about X" | Insider info promise |
| **Surprise reaction** | Open on a shocked face, silent beat, then reveal | Viewer's brain asks "what are they reacting to?" |
| **Visual interrupt** | Start mid-action, mid-motion, mid-chaos | Pattern break — no static frame 1 |

**The silent test:** Watch your first 3 seconds on mute. If text overlay + visual alone don't communicate the promise, it fails — ~85% of social video is watched muted.

## Script Structure by Video Type

### Organic short-form (15-60s) — Hook → Value → Loop

```text
0:00-0:02  HOOK         Visual interrupt + text overlay with the promise
0:02-0:05  EXPAND       Why this matters to YOU (the viewer)
0:05-0:XX  DELIVER      The value. Pattern-interrupt every 3-5s: cut, zoom, text pop, angle change
0:XX-end   LOOP/CTA     End mid-sentence OR loop back to frame 1 for rewatch. Soft CTA in caption, not in video.

```

Mid-video retention hooks at ~15s and ~30s ("but here's the part nobody talks about...").

### UGC ad (15-30s) — Direct Response formula

The proven DR structure: **Hook → Problem → Agitate → Solution → Proof → CTA**

```text
0:00-0:02  HOOK      "I was about to [give up on X]..."
0:02-0:05  PROBLEM   Show/say the pain. Be specific.
0:05-0:08  AGITATE   "And it just kept getting worse — [consequence]"
0:08-0:20  SOLUTION  Product in hand. Demo it working. Lo-fi > polished.
0:15-0:22  PROOF     Green-screen reviews behind you, or "my [authority figure] friend told me..."
0:22-0:30  CTA       Verbal + text overlay. "Link in bio" / "Use code X"

```

**UGC ad writing rules:**

- Write like you text a friend — contractions, "literally," "obsessed," imperfect grammar
- One emotion per script (relief / excitement / transformation — pick one)
- Modular shooting: film hook, problem, demo, CTA as separate clips → mix-and-match 3 hooks × 1 body × 2 CTAs = 6 ad variants
- For TikTok Spark Ads, script must feel organic — get creator authorization codes; Spark Ads keep organic engagement metrics
- Research pain points in TikTok comments / Amazon reviews / Reddit before writing — use their exact words

**Vertical-specific angles:** Beauty → before/after transformation. Fitness → "30 days with X" challenge. SaaS → screen recording solving the problem in <10s. Ecom → unboxing + speed-of-delivery.

## Shot-by-Shot Storyboard Format

| # | Time | Shot | Visual | On-screen text | VO / Audio | Retention device |
|---|---|---|---|---|---|---|
| 1 | 0:00-0:02 | CU face | Shocked expression, product out of frame | "I was today years old..." | [silence / gasp] | Surprise reaction hook |
| 2 | 0:02-0:05 | MS | Hold up product | "...when I learned THIS" | "So I've been doing X wrong for 3 years" | Text reveal |
| 3 | 0:05-0:08 | POV | Hands demo the product | — | VO continues | Angle change = pattern interrupt |
| 4 | 0:08-0:12 | Split screen | Before / After | "BEFORE → AFTER" | — | Visual proof |
| 5 | 0:12-0:15 | CU face | Direct to camera | "Link in my bio" | "Code SAVE20 — thank me later" | CTA |

**Shot types:** CU (close-up), MS (medium), WS (wide), POV, OTS (over-the-shoulder), Screen recording, Green-screen, B-roll.

## Visual Output — Always Use the Design Canvas

**Always render the storyboard visually on the design canvas** using the `canvas` skill. Do not just output a text table — build a real, visual storyboard with a generated image for every shot.

### Generated Shot Images

Use the `media-generation` skill to **generate an image for every shot** in the storyboard. Each image should visualize exactly what the camera sees for that shot — match the shot type (CU, MS, WS, POV, etc.), framing, subject, and mood described in the storyboard. These are the storyboard frames, not placeholders.

### Canvas Layout

Each shot is a vertical stack on the canvas, arranged left-to-right as a horizontal timeline:

1. **Shot image** (`image` shape, 400w × 300h) — the generated frame for this shot
2. **Metadata bar** (`geo` shape, 400w × 60h) — shot number, timestamp, and shot type. Color-coded by purpose: red/orange for hook shots, blue for value delivery, green for CTA.
3. **Script/VO bar** (`geo` shape, 400w × 80h) — the voiceover line, on-screen text, or audio direction for this shot

Use 440px horizontal spacing between shot columns. Add a **title shape** across the top with the video concept, platform, and target duration.

For long storyboards (>8 shots), wrap to a second row.

## Production Notes

- **Cuts:** Every 1.5-3 sec on TikTok, every 3-5 sec on YouTube. Static shots >5s bleed viewers.
- **Captions:** Always burned-in. Platform auto-captions are unreliable and can't be styled.
- **Audio:** Trending sound at low volume under VO > original audio only. Use `webSearch` for "[platform] trending sounds this week" — shelf life is ~7-14 days.
- **UGC aesthetic:** Phone camera, natural light, slightly messy background. Ring lights and DSLRs read as "ad" and tank trust. Authenticity converts 3-4× polished.
- **Research:** `webSearch` for current top-performing ad hooks — e.g. `webSearch("[industry] TikTok ad hooks 2026")` or `webSearch("[industry] viral ad examples")`. The TikTok Creative Center (ads.tiktok.com/business/creativecenter) is a useful reference but requires direct browser interaction to filter; search for articles and breakdowns that cite its data.

## A/B Testing Plan

Always deliver 3 hook variants for the same body. Variables to test (change one at a time): Hook type (problem vs. outcome), Proof timing (early vs. late), CTA hardness (soft "check it out" vs. hard "buy now"). Run 7-14 days before picking a winner.

## Limitations

- Produces scripts/storyboards only — no video rendering
- Cannot access live trending sounds (suggest mood + search query)
- Cannot measure retention curves
