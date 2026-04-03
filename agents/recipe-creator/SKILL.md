---
name: recipe-creator
description: Create recipes, suggest meals from available ingredients, and provide nutritional guidance.
---

# Recipe Creator

Create recipes, suggest meals based on available ingredients, handle dietary restrictions, and provide basic nutritional information.

## When to Use

- User wants a recipe for a specific dish
- User has ingredients and wants meal ideas
- User needs recipes for dietary restrictions (vegan, gluten-free, keto)
- User wants to scale a recipe up or down
- User wants meal prep or batch cooking plans

## When NOT to Use

- Detailed meal planning with fitness goals (use meal-planner skill)
- Health data analysis (use personal-health skill)

## Methodology

### Output — Visual Recipe Card, Not Markdown

**Do not output recipes as plain markdown text.** Instead, build a beautiful, interactive recipe card as an HTML artifact displayed on the canvas. The recipe card should look like a polished cooking app (think Paprika, NYT Cooking, or Bon Appétit).

#### Recipe Card Requirements

1. **Generated hero image** — Use `generateImage` to create a photorealistic, appetizing hero image of the finished dish. Place it at the top of the card. Style: overhead shot or 45-degree angle, natural lighting, on a styled surface with minimal props.

2. **Serving size adjuster** — Include a serving size selector (buttons or +/- stepper) that **dynamically recalculates all ingredient quantities** in real time. Store the base recipe quantities in JavaScript and multiply on change:

```javascript
// Store base recipe for N servings
const baseServings = 4;
const ingredients = [
  { name: "chicken breast", qty: 2, unit: "lbs" },
  { name: "olive oil", qty: 2, unit: "Tbsp" },
  // ...
];

function updateServings(newServings) {
  const ratio = newServings / baseServings;
  ingredients.forEach(ing => {
    const scaled = ing.qty * ratio;
    // Display with smart fractions (¼, ½, ¾) for common amounts
  });
}
```

1. **Card layout** — Structure the visual card with:
   - Hero image (full-width, 16:9 or 4:3)
   - Recipe title (large, styled)
   - Metadata bar: prep time, cook time, total time, difficulty, servings adjuster
   - Ingredients list (left column or collapsible section) — checkboxes so users can tick off items
   - Step-by-step instructions (numbered, with visual/audio cues highlighted)
   - Nutrition facts panel (per serving, updates with serving size)
   - Notes section: storage, substitutions, allergen flags

2. **Styling** — Clean, modern, food-magazine aesthetic. Use warm tones, generous whitespace, readable serif or clean sans-serif fonts. Mobile-friendly layout. No cluttered sidebars.

Place the recipe card on the canvas as an iframe (1280x900 or similar).

### "What Can I Make?" Logic

Think in **formula + flavor profile**, not recipe lookup:

1. Bucket ingredients: protein / starch / veg / aromatic / fat / acid
2. Match a base formula (stir-fry, braise, grain bowl, frittata, soup, sheet-pan roast)
3. Assign a flavor direction based on what's in the pantry (soy+ginger+sesame → East Asian; cumin+lime+cilantro → Mexican; lemon+garlic+oregano → Mediterranean)
4. Every savory dish needs fat + acid + salt to taste finished. If it's "flat," it's missing acid 90% of the time — add lemon, vinegar, or pickled something
5. Rank suggestions by fewest missing ingredients

### Ratios — Cook Without a Recipe

From Ruhlman's *Ratio* (the CIA-derived reference). **All by weight**, not volume — this is why they work:

| Thing | Ratio | Notes |
|-------|-------|-------|
| Bread dough | 5 flour : 3 water (+yeast, salt 2% of flour wt) | Hydration % = water/flour. 60% = sandwich loaf, 75%+ = ciabatta/focaccia |
| Pasta dough | 3 flour : 2 egg | ~100g flour per person |
| Pie dough | 3 flour : 2 fat : 1 water | Fat cold, water iced. Overmix = tough |
| Cookie | 1 sugar : 2 fat : 3 flour | Base for shortbread → choc chip → anything |
| Biscuit/scone | 3 flour : 1 fat : 2 liquid | |
| Muffin/quick bread | 2 flour : 2 liquid : 1 egg : 1 fat | |
| Pancake | 2 flour : 2 liquid : 1 egg : ½ fat | Thinner = crêpe (drop the leavening) |
| Vinaigrette | 3 oil : 1 acid | Mustard to emulsify. Salt in the acid first |
| Custard | 1 part egg : 2 parts liquid | Crème brûlée, quiche filling, bread pudding base |
| Stock | 3 water : 2 bones | By weight. Simmer, never boil |
| Brine | 20 water : 1 salt (5% w/w) | |
| Rice (stovetop) | 1 rice : 1.5 water by volume | Less for jasmine, more for brown |

Knowing the ratio > knowing a recipe. Same cookie ratio → swap butter for brown butter, add miso, change sugar to brown — infinite variations, predictable results.

### Substitutions — With the Actual Conversion

| Out of | Use | Conversion + caveat |
|--------|-----|---------------------|
| Buttermilk | Milk + acid | 1 cup milk + 1 Tbsp lemon juice or vinegar, sit 5 min |
| 1 egg (binding) | Flax or chia | 1 Tbsp ground + 3 Tbsp water, gel 5 min. Max 2 eggs' worth — beyond that it gets gummy |
| 1 egg (leavening) | Aquafaba | 3 Tbsp chickpea liquid. Whips like whites |
| Butter (baking) | Oil | Use 80% of butter weight (butter is ~80% fat, 20% water). Less browning |
| Butter (baking, low-fat) | Unsweetened applesauce | 1:1, but cut other liquid slightly. Cakier texture |
| Heavy cream | Coconut cream (the solid part of the can) | 1:1. Faint coconut taste in delicate dishes |
| Cake flour | AP flour | 1 cup AP minus 2 Tbsp, replaced with 2 Tbsp cornstarch |
| Self-rising flour | AP + leavening | 1 cup AP + 1½ tsp baking powder + ¼ tsp salt |
| Brown sugar | White + molasses | 1 cup white + 1 Tbsp molasses |
| Wine (cooking) | Stock + acid | Equal vol stock + 1 Tbsp vinegar per cup |
| Fresh herbs | Dried | Use ⅓ the amount. Add early (dried needs heat to bloom) |
| Soy sauce | Tamari (GF) / coconut aminos | Tamari 1:1. Coconut aminos: use ~1.3× and add salt (it's sweeter, less salty) |

### Nutrition — Compute, Don't Guess

**USDA FoodData Central** (`fdc.nal.usda.gov`) — free API, no key needed for basic search. The authoritative macro/micro database.

```python

# webFetch or requests

# Search: https://api.nal.usda.gov/fdc/v1/foods/search?query=chicken%20breast&api_key=DEMO_KEY

# Returns per-100g: kcal, protein, fat, carbs, fiber, plus micros

# Scale by actual gram weight, sum across ingredients, divide by servings

```

For quick estimates without the API: protein ~4 kcal/g, carbs ~4 kcal/g, fat ~9 kcal/g, alcohol ~7 kcal/g.

**Gram conversions for common measures:** 1 cup AP flour ≈ 125g; 1 cup sugar ≈ 200g; 1 cup butter ≈ 227g (2 sticks); 1 large egg ≈ 50g; 1 Tbsp oil ≈ 14g.

### Best Practices

- **Visual/audio cues over times** — "onions translucent and soft" beats "5 min" (stove strength varies 2×). "Oil shimmers." "Garlic fragrant, ~30 sec." "Dough springs back slowly."
- **Salt in layers** — season at each stage, not all at the end
- **Rest meat** — 5 min for steaks, 15+ for roasts. Skipping this is the #1 reason home-cooked meat is dry
- Ingredients listed in order of use; prep notes inline ("1 onion, diced")
- Flag top-9 allergens: milk, egg, fish, shellfish, tree nuts, peanuts, wheat, soy, sesame

## Limitations

- Nutrition is computed from generic USDA data — brand variance is real
- Baking ratios assume weight measurement; volume introduces 10-20% error
- Not medical dietary advice
