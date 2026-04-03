---
name: real-estate-analyzer
description: Evaluate properties, neighborhoods, and investment returns for home buying
---

# Real Estate Analyzer

Analyze properties, neighborhoods, and real estate investment opportunities for home buyers and investors. Evaluate listings, estimate fair value, assess neighborhoods, and model investment returns.

## When to Use

- User wants to evaluate a property listing for purchase
- User asks about neighborhood quality, schools, or safety
- User wants to compare properties or neighborhoods
- User needs help estimating if a home is fairly priced
- User wants to analyze a property as an investment (rental yield, appreciation)

## When NOT to Use

- Mortgage or loan calculations only (use budget-planner skill)
- Legal review of purchase agreements (use legal-contract skill)

## Methodology

### Step 1: Property Assessment

Gather and evaluate listing details:

**Basic Details:**

- Address, price, square footage, lot size
- Bedrooms, bathrooms, year built
- Property type (single-family, condo, townhouse, multi-family)
- Days on market, price history, price reductions

**Condition Indicators:**

- Age of major systems (roof, HVAC, water heater, electrical)
- Recent renovations or updates
- Foundation type and condition
- Photos analysis — look for staging tricks, unflattering angles, missing rooms

**Red Flags:**

- Significantly below market price (could indicate undisclosed issues)
- Frequent ownership changes (flipped too fast?)
- "As-is" or "investor special" language
- Missing disclosures or incomplete listing info
- High DOM (days on market) without price reduction

### Step 2: Valuation Analysis

**Pull comps — specific sources:**

- `webFetch` Redfin sold filter: `redfin.com/city/{id}/filter/include=sold-6mo` — recently sold within 0.5mi, ±20% sqft, same beds
- Zillow Research (`zillow.com/research/data/`) — free CSV downloads of ZHVI (home value index) and ZORI (rent index) by ZIP, monthly back to 1996
- County assessor website — webSearch `"{county name} property assessor {address}"` for tax-assessed value, last sale price, permit history. Assessed value is typically 70-90% of market value.
- Adjust comps: ±$15-40/sqft for size delta, ±$5-15k per bedroom, ±10-20% for condition

**Affordability math (compute, don't estimate):**

```python

# PITI at 30yr fixed — webSearch current rates (use Freddie Mac PMMS)
# PMMS reports percentage (e.g. 6.76), so divide by 100 first
P, r, n = loan_amount, annual_rate/100/12, 360
monthly_PI = P * (r*(1+r)**n) / ((1+r)**n - 1)

# + property tax (county rate × assessed value / 12)

# + homeowners insurance (~$150-250/mo, varies wildly by state)

# + PMI if <20% down (~0.5-1.0% of loan/yr)

```

- 28/36 rule: PITI <28% gross income, total debt <36%. Lenders stretch to 43% DTI — don't.
- Closing costs: 2-5% of purchase. Maintenance reserve: 1-2% of home value/yr.

### Step 3: Neighborhood Analysis

**webSearch/webFetch targets (name the source, don't be vague):**

- Schools: `greatschools.org/{state}/{city}` — rating ≥7 protects resale value even if user has no kids
- Crime: `crimemapping.com` or `spotcrime.com/{city}` — check 6-month trend, not just snapshot. NeighborhoodScout for demographic overlay.
- Walk/Transit/Bike Score: `walkscore.com/score/{address}`
- Flood: `msc.fema.gov/portal/search` — Zone A/AE/V = mandatory flood insurance ($400-3,000+/yr, often kills deals)
- Market velocity: Redfin Data Center — median DOM, sale-to-list ratio, months of supply. <3 months supply = seller's market.
- Future development: webSearch `"{city} planning commission agenda"` + `"{city} zoning map"` — a highway expansion or apartment rezoning next door changes everything

### Step 4: Investment Analysis — Run the Numbers

**Quick-filter rules (kill deals fast):**

- **1% rule**: monthly rent ≥ 1% of purchase price. Dead in coastal/HCOL markets — there, 0.5-0.7% is realistic and you're betting on appreciation, not cash flow.
- **50% rule**: operating expenses (NOT mortgage) eat ~50% of gross rent. Vacancy + repairs + management + taxes + insurance + capex reserve. Beginners always underestimate this.
- **70% rule (flips/BRRRR)**: max offer = (ARV × 0.70) − rehab cost. ARV = after-repair value from renovated comps.

**Full underwriting (build in Python):**

```text
Gross rent (use Rentometer or Zillow ZORI for the ZIP)
− Vacancy (5-8% typical; 10% conservative)
− Property management (8-10% of collected rent)
− Repairs/maintenance (~8% of rent)
− CapEx reserve (~5% — roof/HVAC/water heater sinking fund)
− Taxes + insurance
= NOI (Net Operating Income)

Cap rate = NOI / purchase price
  → <4%: you're buying appreciation, not cash flow
  → 4-6%: typical for A/B-class in growth metros
  → 6-8%: solid cash flow, B/C-class
  → >10%: either a great deal or a war zone — verify crime data

NOI − annual debt service (P+I) = annual cash flow
Cash-on-cash = annual cash flow / total cash in (down pmt + closing + rehab)
  → Target 8%+ CoC. Below that, an index fund wins with zero tenants.

```

**DSCR (what lenders check for investment loans):**

- DSCR = NOI / annual debt service. Lenders want ≥1.20-1.25× (2025 standard). <1.0 means rent doesn't cover the mortgage.
- DSCR loans (2025): ~6.5-7.5% rate, qualify on property income not W-2, typical max 75% LTV. How investors scale past 10 conventional mortgages.

**BRRRR stack**: Buy distressed (hard money, 7-14 day close) → Rehab → Rent → Refinance at 75% of new ARV into DSCR loan → pull most capital out → Repeat. Only works if `ARV × 0.75 ≥ purchase + rehab + holding costs`.

**Rent comps:** webSearch Rentometer free tier, or pull Zillow rentals for the ZIP and compute median $/sqft for same bed count.

### Step 5: Due Diligence Checklist

Before making an offer:

- [ ] Pre-approval letter from lender
- [ ] Professional home inspection ($300-500)
- [ ] Pest/termite inspection
- [ ] Title search for liens or encumbrances
- [ ] Survey (if boundaries unclear)
- [ ] Flood zone check (FEMA maps)
- [ ] Environmental concerns (radon, lead paint for pre-1978 homes)
- [ ] HOA review (financials, rules, pending assessments)
- [ ] Property tax history and assessment

## Output Format

Always present key findings and recommendations as a plaintext summary in chat, even when also generating files. The user should be able to understand the results without opening any files.

```text

# Property Analysis: [Address]

## Summary

- Asking Price: $XXX,XXX
- Estimated Fair Value: $XXX,XXX — [Over/Under/Fair priced by X%]
- Recommendation: [Strong Buy / Buy / Hold / Pass]

## Property Details
[Key facts table]

## Valuation
[Comps analysis, price per sqft comparison]

## Neighborhood
[Schools, safety, livability scores]

## Financial Analysis
[Monthly payment breakdown, investment returns if applicable]

## Risks & Concerns
[Red flags, upcoming expenses, market risks]

## Verdict
[2-3 sentence recommendation]

```

## Best Practices

1. **Asking price is marketing** — only sold comps within 6 months matter
2. **Model three scenarios** — base case, 10% vacancy + 20% higher repairs, and "tenant trashes it year 1"
3. **Permit history is free alpha** — county assessor site shows pulled permits. No permits on an "updated kitchen" = unpermitted work = your liability.
4. **Price/sqft is a blunt tool** — lot size, corner lots, and basement finish skew it hard. Use for screening, not for offers.
5. **Cap rate without appreciation** — in a flat market, if cap rate < your mortgage rate, you're paying to own it

## Interactive Map — Web App Visualization

After analyzing properties, **build a web app** that displays properties and relevant neighborhood data on an interactive map.

### Property Markers

- **Color-coded by recommendation**: green = Strong Buy, blue = Buy, yellow = Hold, red = Pass
- **Popup on each marker** showing: address, asking price, estimated fair value, beds/baths, sqft, price/sqft, and recommendation
- **Click to expand** with key details: comp-adjusted value, cap rate (if investment), flood zone, school rating

### Neighborhood Context Layers

Display relevant context around the properties:

- **Sold comps** — recent comparable sales as smaller markers, with sale price and date
- **School locations** with GreatSchools ratings (color-coded: green ≥7, yellow 4-6, red <4)
- **Flood zones** if any properties are in or near FEMA Zone A/AE/V
- **Nearby amenities** — transit, grocery, parks when walkability matters to the user

### Geocoding

Use the free Nominatim API (OpenStreetMap) to convert addresses to lat/lng — no API key required:

```text
https://nominatim.openstreetmap.org/search?q={url_encoded_address}&format=json&limit=1
```

Rate limit: max 1 request/second. Batch geocode all addresses before building the map.

Always generate the map alongside the text-based analysis — the map is a visual complement, not a replacement for the detailed evaluation.

## Limitations & Disclaimer

- **This is NOT real estate, legal, or financial advice.** Informational analysis only. Always engage a licensed realtor, real estate attorney, and professional inspector before purchasing.
- Cannot access MLS — Redfin/Zillow public data lags and misses pocket listings
- Cannot provide appraisals (licensed appraiser required for lending)
- Cannot physically inspect — photos hide foundation cracks, mold, and grading issues
- Market snapshot only — rates and comps move weekly
