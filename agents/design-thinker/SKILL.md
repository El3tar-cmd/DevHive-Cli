---
name: design-thinker
description: Apply IDEO-style design thinking methodology to solve complex problems creatively, then present the analysis on canvas and/or as a web artifact.
---

# Design Thinking

Apply human-centered problem solving. Three frameworks dominate industry practice — pick based on what the user actually needs, don't default to IDEO's 5 phases.

## When to Use

- Ambiguous problem space, no obvious solution
- "Why aren't users adopting X?" / "What should we build next?"
- Stuck and needs structured divergence

## When NOT to Use

- Known problem, known solution, just needs execution (skip straight to PRD)
- Visual/UI implementation (use design skill)
- Technical debugging

## Three Frameworks — Choose Wisely

### 1. Double Diamond (UK Design Council, 2004) — for ambiguous problems

Two diamonds = two diverge-then-converge cycles. **Discover** (go wide on problem research) → **Define** (narrow to problem statement) → **Develop** (go wide on solutions) → **Deliver** (narrow to one, ship it).

Critical insight: most teams skip the first diamond and jump straight to solution brainstorming. The first diamond exists to prevent solving the wrong problem beautifully.

**Use when**: problem isn't yet defined, timeline is weeks not days.

### 2. GV Design Sprint (Jake Knapp, Google Ventures, 2010) — for validation speed

5 days, 5 phases, hard time-box. Map (Mon) → Sketch (Tue) → Decide (Wed) → Prototype (Thu) → Test with 5 real users (Fri). Full method free at `gv.com/sprint` and `designsprintkit.withgoogle.com`.

**Known weakness**: users appear on Day 5, not Day 1. The sprint relies on team intuition to frame the problem — you can spend 5 days sprinting toward the wrong target. Fix: run JTBD interviews *before* the sprint to pick the problem.

**Use when**: problem is defined, team can commit 5 uninterrupted days, you need a go/no-go decision fast.

**"5 users" is not arbitrary**: Nielsen Norman Group research shows 5 users find ~85% of usability problems. Diminishing returns after that.

### 3. JTBD Switch Interview (Bob Moesta / Re-Wired Group) — for understanding why people buy

Not a workshop — a forensic interview technique. Interview people who *recently switched* (bought your product, or churned to a competitor). 45-60 minutes. Reconstruct their timeline, don't ask about features.

**The Timeline** (walk backward through their actual purchase):

1. **First thought** — when did it first occur to you this was a problem?
2. **Passive looking** — noticing solutions but not acting
3. **Event one** — something happens that makes it urgent
4. **Active looking** — comparing options, raised hand
5. **Deciding** — what tipped it?
6. **Buying** — the actual moment

**The Four Forces** (what made the switch happen):

| Force | Direction | Probe |
|---|---|---|
| Push of the situation | Toward switch | "What was happening that made the old way stop working?" |
| Pull of the new solution | Toward switch | "When you imagined having this, what got you excited?" |
| Anxiety of the new | Against switch | "What worried you about switching?" |
| Habit of the present | Against switch | "What was good enough about what you had?" |

Switch only happens when Push + Pull > Anxiety + Habit. If someone didn't buy, one of the blocking forces won.

**Key technique**: ask about the *situation*, never the feature. Not "do you like the dashboard?" but "walk me through the last time you opened it — what were you in the middle of?" Reference: the "Mattress Interview" at `jobstobedone.org` — Moesta interviews a guy about buying a mattress for 45 min and uncovers it was actually about his marriage.

**Use when**: you have customers but don't understand why they chose you, or you're losing deals and don't know why.

## Core Tools (Framework-Agnostic)

**How Might We (HMW)** — reframe problem as opportunity. Scope test: too narrow bakes in the solution ("HMW add a share button"), too broad is unactionable ("HMW make users happy"). Right: "HMW help busy parents find 20-minute recipes without meal-planning guilt?"

**Crazy 8s** (from GV Sprint) — fold paper into 8 panels, sketch 8 distinct ideas in 8 minutes. Forces past the obvious first 3 ideas. Works solo or in groups.

**Assumption Mapping** — plot assumptions on Importance × Evidence 2×2. High-importance + low-evidence = test first. This picks your prototype target.

**Empathy Map** (Dave Gray, XPLANE) — Say / Think / Do / Feel quadrants around a user. "Think" and "Feel" are where insight lives — they're the gap between what users say and what they do.

**5-Act Interview** (GV test-day script): Friendly welcome → context questions → intro the prototype → tasks (watch, don't help) → debrief. One person interviews, team watches on video in another room and takes notes.

## Output Format

```markdown

# [Challenge]

## Framework Used
[Double Diamond / GV Sprint / JTBD — and why this one]

## Problem Definition

### HMW Statement

### Key Insights (with evidence — quote or observation, not assumption)

## [If JTBD] Forces Diagram
| Push | Pull | Anxiety | Habit |
|---|---|---|---|

## Solution Concepts
| Concept | Desirable? | Feasible? | Viable? | Riskiest assumption |
|---|---|---|---|---|

## Prototype Plan

- What to build (lowest fidelity that tests the assumption)
- Who to test with (5 users, recruited how)
- What "success" looks like

## Next Steps

```

## Canvas Presentation

When presenting design thinking analysis on the canvas, follow these rules for a clear, skimmable board.

### Shape Types & When to Use Each

| Shape | Use For | Why |
|---|---|---|
| `note` (sticky note) | Section headers, sidebar annotations, key stats | Fixed 200px width. Auto-sizes font based on text length — fewer words = bigger text. Perfect for bold single-word headers. |
| `geo` (rectangle) | Content cards, full-width banners, problem statements | Respects `w` and `h` — use for wide content (500px+ cards, 1600px+ banners). Set `fill: "solid"` and pick a color. |
| `geo` (arrow-down / arrow-right) | Flow indicators between sections | Shows the progression through the framework. Use `fill: "solid"`. |
| `text` | Small inline labels like "vs" between forces | Auto-sizes, minimal visual weight. |

### Layout Rules

1. **Headers as sticky notes with minimal text** — Use 1-2 words max (e.g., "DISCOVER", "DEFINE", "FORCES"). The note shape auto-scales font size inversely to text length, so short text = large, skimmable headers.

2. **Content cards as geo rectangles** — 500px wide for 3-column layouts, 780px for 2-column layouts, 1600px+ for full-width banners. Always set `fill: "solid"` and a color.

3. **Left-column header notes, right-side content** — Place header sticky notes at x=1400, content cards starting at x=1670 (leaving a 70px gap after the 200px-wide header note).

4. **Vertical spacing** — 80-100px between rows within a section, 120-150px between sections. This keeps the board breathable and skimmable.

5. **Arrow shapes between sections** — Place `geo` shapes with `arrow-down` geo centered horizontally between sections to show flow. Use the section's color.

6. **Annotation stickies as sidebar** — Place `note` shapes at x=3350 (far right) aligned vertically with their related section. Use for market stats, key quotes, risk callouts — short punchy content that adds context without cluttering the main flow.

7. **Color coding by section** — Be consistent:
   - Violet: title, concepts
   - Blue: discover
   - Green: define
   - Orange: develop / forces
   - Red: deliver
   - Yellow: key callouts (problem statement, switch rule, recommendation)
   - Light-* variants for content cards within each section

8. **JTBD Forces layout** — Use 2x2 grid: Push (top-left, light-red) vs Pull (top-right, light-green), Anxiety (bottom-left, orange) vs Habit (bottom-right, grey). Place arrow-right shapes and "vs" text labels between the pairs.

### Canvas Gotchas

- **Sticky notes (`note` type) are always 200px wide** — the `w` parameter is ignored. Plan layouts around this constraint.
- **`labelColor: "white"` can cause rendering errors** — avoid it. Use lighter fill colors where default black text is readable.
- **`color: "black"` on geo shapes with `fill: "solid"` causes errors** — use `grey` or a dark supported color instead.
- **Always call `get_canvas_state` before placing shapes** — check for existing content and find empty space.
- **Delete before recreate** — when updating shapes, delete first then create fresh. Updates to notes can behave unexpectedly.

### Example: Placing a Section

```text
1. Header note (big text):
   { type: "note", x: 1400, y: Y, w: 200, h: 200, color: "blue", text: "DISCOVER" }

2. Content cards (3-column):
   { type: "geo", geo: "rectangle", x: 1670, y: Y, w: 500, h: 260, color: "light-blue", fill: "solid", text: "..." }
   { type: "geo", geo: "rectangle", x: 2220, y: Y, w: 500, h: 260, color: "light-violet", fill: "solid", text: "..." }
   { type: "geo", geo: "rectangle", x: 2770, y: Y, w: 500, h: 260, color: "light-green", fill: "solid", text: "..." }

3. Flow arrow to next section:
   { type: "geo", geo: "arrow-down", x: 2300, y: Y+300, w: 80, h: 60, color: "blue", fill: "solid" }

4. Sidebar annotation:
   { type: "note", x: 3350, y: Y, w: 200, h: 200, color: "yellow", text: "$45.5B\nmarket by 2028" }
```

## Research

- `webSearch("[user's problem domain] user research")` for prior art
- `webFetch("https://www.gv.com/sprint/")` for full sprint method
- `webSearch("[product category] reviews site:reddit.com")` — unfiltered user language for push/anxiety forces
- IDEO Design Kit free methods: `designkit.org/methods`

## Hard Truths

- Agent cannot run real interviews — can write the discussion guide, analyze transcripts the user pastes in, and build the synthesis
- Personas without research are fiction. Push user for real data (support tickets, reviews, churn interviews) before building empathy maps
- Most "design thinking" fails because teams do ideation theater and skip the uncomfortable research. Bias toward the first diamond
