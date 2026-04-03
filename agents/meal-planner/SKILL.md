---
name: meal-planner
description: Create personalized meal plans with macros, shopping lists, and fitness schedules.
---

# Meal Planner & Fitness Schedule

Create personalized meal plans with calculated macro targets, shopping lists, and training schedules.

**DISCLAIMER: General nutrition and fitness information only — not medical or dietetic advice. Users with medical conditions, eating disorder history, pregnancy, or on medications should consult a registered dietitian or physician.**

## When to Use

- User wants a weekly meal plan hitting specific macros
- User needs a shopping list generated from a plan
- User wants a training split paired with nutrition

## When NOT to Use

- Medical dietary needs (renal, diabetic, celiac management) → refer to RD
- Single recipe creation → use recipe-creator skill
- Health data analysis → use personal-health skill

## Step 1: Gather Inputs

Required: goal (fat loss / maintenance / muscle gain), sex, age, height, weight, activity level, dietary restrictions, meals-per-day preference, cooking time available, budget.

If body fat % is known, use Katch-McArdle instead of Mifflin-St Jeor — it's more accurate for lean or obese individuals.

## Step 2: Calculate Energy Target

**Mifflin-St Jeor BMR** (validated as most accurate predictive equation for the general population, ±10% for most adults):

```text
Men:   BMR = (10 × weight_kg) + (6.25 × height_cm) − (5 × age) + 5
Women: BMR = (10 × weight_kg) + (6.25 × height_cm) − (5 × age) − 161
```

**Katch-McArdle** (use if body fat % is known — more accurate at body-composition extremes):

```text
BMR = 370 + (21.6 × lean_mass_kg)    where lean_mass_kg = weight_kg × (1 − bodyfat%)
```

**TDEE = BMR × activity multiplier:**

| Level | Multiplier | Description |
|---|---|---|
| Sedentary | 1.2 | Desk job, minimal deliberate exercise |
| Lightly active | 1.375 | 1–3 sessions/week |
| Moderately active | 1.55 | 3–5 sessions/week |
| Very active | 1.725 | 6–7 sessions/week |
| Extra active | 1.9 | Athlete or physical labor + training |

People consistently overestimate their activity — when in doubt, pick the lower multiplier and adjust upward after 2 weeks of real-world data.

**Goal adjustment:**

- Fat loss: TDEE − 20–25% (typically 400–600 kcal deficit). Targets ~0.5–1% bodyweight/week. Steeper deficits accelerate muscle loss.
- Maintenance: TDEE ± 0
- Muscle gain: TDEE + 10–15% (typically 200–400 kcal surplus). Larger surpluses mostly add fat, not muscle, in trained individuals.

## Step 3: Set Macros — Evidence-Based Targets

### Protein (set this first, in g/kg — not as a percentage)

| Goal | Target | Evidence |
|---|---|---|
| General health / sedentary | 0.8–1.2 g/kg | RDA is 0.8 g/kg — the minimum to prevent deficiency, not an optimum |
| Muscle gain + resistance training | **1.6–2.2 g/kg** | Morton et al. 2018 meta-analysis (49 RCTs, n=1,863, *BJSM*): gains in fat-free mass plateau at 1.62 g/kg/day (95% CI: 1.03–2.20). The upper CI bound (~2.2 g/kg) is recommended for those maximizing hypertrophy. Confirmed by Nunes et al. 2022 (74 RCTs). |
| Fat loss (preserving lean mass) | 1.8–2.7 g/kg | Higher end of range compensates for the muscle-sparing effect of protein during energy deficit |
| Endurance athletes | 1.2–1.6 g/kg | ISSN position stand |

In imperial: 1.6–2.2 g/kg ≈ 0.7–1.0 g/lb. Distribute across 3–5 meals at 0.3–0.4 g/kg per meal (~25–40 g) — muscle protein synthesis response plateaus per-sitting.

### Fat

Minimum ~0.5 g/kg bodyweight (hormone synthesis floor). Typical range 0.8–1.2 g/kg, or 20–35% of calories. Going below 20% long-term risks fat-soluble vitamin and hormone issues.

### Carbohydrates

Fill remaining calories after protein and fat are set. `carbs_g = (target_kcal − protein_g×4 − fat_g×9) / 4`

### Fiber

**14 g per 1,000 kcal** (Dietary Guidelines for Americans) — roughly 25 g/day for women, 38 g/day for men at maintenance. Most plans undershoot this. Check it explicitly.

## Step 4: Build the Plan

Rotate 3–4 breakfast templates, 4–5 lunch/dinner templates across the week — enough variety to prevent burnout, enough repetition to keep prep and shopping simple.

```text
## Monday — Target: 2,200 kcal | 165P / 220C / 73F

Breakfast (520 kcal): Greek yogurt 250g + berries 100g + granola 40g + chia 10g → 32P / 58C / 14F
Lunch (640 kcal): Chicken breast 170g + brown rice 200g cooked + roasted veg 200g + olive oil 10g → 48P / 62C / 16F
Snack (230 kcal): Apple + almond butter 20g → 5P / 28C / 12F
Dinner (630 kcal): Salmon 150g + sweet potato 250g + broccoli 150g → 42P / 56C / 22F
Pre-bed (180 kcal): Cottage cheese 180g → 22P / 7C / 4F

Daily total: 2,200 kcal | 149P / 211C / 68F | Fiber: ~31g ✓
```

**Nutrition data sources** — for accurate macros, query the USDA FoodData Central API rather than guessing:

- Base URL: `https://api.nal.usda.gov/fdc/v1/` — free API key from api.data.gov, 1,000 req/hr limit
- Search: `GET /foods/search?query=chicken breast&api_key=KEY`
- Lookup: `GET /food/{fdcId}?api_key=KEY` returns full nutrient profile per 100g
- Python clients on PyPI: `fooddatacentral` (simple), `usda-fdc` (includes DRI comparison + recipe aggregation)
- Data is public domain (CC0). Branded foods update monthly.

## Step 5: Shopping List

Aggregate ingredients across all days, round to purchasable units, organize by store section:

```text
PROTEINS: Chicken breast 1.2kg · Salmon 450g · Eggs 1 dozen · Greek yogurt 1.8kg · Cottage cheese 750g
PRODUCE: Broccoli 2 heads · Sweet potato 1.5kg · Mixed berries 700g · Spinach 300g · Apples 5
GRAINS/PANTRY: Brown rice 1kg · Oats 500g · Granola 300g · Almond butter 1 jar · Chia 100g
```

## Step 6: Meal Prep Logistics

**Single prep session (Sun, ~90 min):** Cook all grains. Roast two sheet-pans of proteins + veg. Portion into containers. Prep overnight oats for 3 days.

**USDA-backed refrigerated shelf life:** cooked poultry/meat 3–4 days · cooked fish 3–4 days · cooked grains 4–6 days · cut raw veg 3–5 days. Freeze anything for day 5+.

## Fitness Schedule (Condensed)

**Beginner (<6 mo): Full body 3×/week** (Mon/Wed/Fri). Each session: 1 squat pattern, 1 hinge, 1 push, 1 pull, 1 carry/core. 3×8–12. Simplest progression: add 2.5 kg when all sets hit the top of the rep range.

**Intermediate (6 mo–2 yr): Upper/Lower 4×/week.** Mon upper-push emphasis, Tue lower-quad, Thu upper-pull, Fri lower-hinge.

**Advanced: Push/Pull/Legs 5–6×/week.**

**Volume guidelines** (per muscle group per week, meta-analytic consensus): 10–20 hard sets for hypertrophy. Below 10 is maintenance; above 20 shows diminishing returns and rising injury risk for most.

**Rep ranges:** 3–6 strength-biased · 6–15 hypertrophy (all ranges build muscle if taken near failure; hypertrophy is not rep-range-specific) · 15+ endurance-biased.

**Progressive overload is mandatory** — log every session. No log → no plan.

**Recovery:** ≥1 full rest day/week. 7–9 hrs sleep. Deload (−40–50% volume) every 4–6 weeks.

**Cardio:** General health → 150 min/week moderate (WHO guideline). Fat-loss phase → add 2–3 × 20–30 min sessions, steady-state or intervals. Muscle-gain phase → keep cardio to 1–2 light sessions to minimize interference.

## Output: Always Build a Visual Web App

**Every meal plan MUST be delivered as an interactive React + Vite web app.** Do not output plans as plain text or markdown — always build and deploy a visual website.

### Core Layout: Week-by-Week Calendar View

The app should display the meal plan as a visual weekly calendar grid:

1. **Week selector** — tabs or navigation for Week 1, Week 2, etc. If the plan has cycling options (e.g., 2-week rotation, high/low carb days), show each cycle as a separate week tab.
2. **Day columns** — 7 columns (Mon–Sun), each showing all meals for that day as stacked cards.
3. **Meal cards** — each card shows:
   - Meal name (Breakfast, Lunch, Dinner, Snack)
   - Food items with portions
   - Per-meal macros: P / C / F / kcal
   - Color-coded macro bar (protein=blue, carbs=amber, fat=red)
4. **Daily summary row** — bottom of each column shows daily total kcal and macro breakdown vs target (with green/yellow/red indicator for on-target/close/off)

### Multiple Options & Cycling

- **Meal swaps** — for each meal slot, offer 2–3 alternatives the user can click to swap in. Show a small "swap" icon on each meal card that reveals alternatives in a dropdown or modal.
- **Rotation plans** — if the user wants variety (e.g., "don't repeat the same dinner twice in 2 weeks"), build a 2-week rotation with different week tabs.
- **High/low day cycling** — for carb cycling or calorie cycling plans, label each day (e.g., "High Day — 2,400 kcal" vs "Low Day — 1,800 kcal") and color-code the day header accordingly.

### Additional Views / Sections

- **Shopping list tab** — aggregated by store section (Proteins, Produce, Grains/Pantry, Dairy, Frozen), with quantities rounded to purchasable units. Checkboxes for each item.
- **Prep guide tab** — Sunday prep timeline as a visual step-by-step with estimated times.
- **Macro dashboard** — summary panel showing weekly averages vs targets: avg daily kcal, protein g/kg, fiber g, and a simple bar chart comparing planned vs target.
- **Training schedule** — if fitness plan is included, show as a sidebar or separate tab with day-by-day exercises.

### UI/UX Requirements

- **Clean, appetizing design** — warm color palette, rounded cards, readable portions
- **Mobile-responsive** — stack day columns vertically on mobile
- **Click to expand** — meal cards expand on click to show full ingredient list, cooking notes, and nutrition detail
- **Print-friendly** — `@media print` stylesheet that renders the week view cleanly on paper

### Data Architecture

Embed all plan data as JSON in the app:

```typescript
interface MealPlan {
  weeks: Week[];
  profile: { goal: string; tdee: number; target_kcal: number; macros: Macros };
  shoppingList: ShoppingSection[];
  prepGuide: PrepStep[];
}

interface Week {
  label: string;  // "Week 1", "High Carb Cycle", etc.
  days: Day[];
}

interface Day {
  name: string;  // "Monday"
  label?: string; // "High Day", "Rest Day", etc.
  target_kcal: number;
  meals: Meal[];
}

interface Meal {
  slot: 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'pre-bed';
  name: string;
  items: { food: string; portion: string; }[];
  macros: Macros;
  alternatives?: Meal[];  // swap options
}

interface Macros { protein: number; carbs: number; fat: number; fiber: number; kcal: number; }
```

## Best Practices

1. **Adherence beats optimization** — a 90%-adhered B+ plan beats a 50%-adhered A+ plan. Build around foods the user already likes.
2. **Protein is the anchor macro** — set it in g/kg first, then fill carbs/fat by preference.
3. **Budget a 10% flex buffer** — plans that forbid all unplanned food get abandoned.
4. **Re-calculate TDEE after weight changes ~5 kg** — BMR shifts with body mass.
5. **Track for 2 weeks before adjusting** — daily weight fluctuates ±1–2 kg from water/glycogen/gut contents. Use a 7-day rolling average.

## Limitations

- Nutritional values are estimates (±10–15% even with USDA data — portion eyeballing adds more error)
- TDEE formulas are population averages with ~10% individual error — real-world tracking over 2–3 weeks is the only way to find someone's true maintenance
- Not a substitute for a registered dietitian, especially for medical conditions, disordered eating history, or pregnancy
- Training templates are generic — modify around injuries and individual response
