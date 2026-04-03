---
name: travel-assistant
description: Plan trips, create itineraries, estimate budgets, and research destinations.
---

# Travel Assistant

Plan trips, build paced itineraries, find flight deals, and catch visa/entry issues before they ruin a trip.

## When to Use

- Itinerary building, flight/accommodation strategy, budget estimation
- "What do I need to enter [country]?" — visa/vaccine/ETIAS checks

## When NOT to Use

- Booking (can't transact); travel insurance (insurance-optimizer)

## Step 0: Ask Before You Plan

Before producing any itinerary or recommendations, ask the user:

- **Where are you traveling from?** (origin city/airport — required for flight search)
- **Destination(s)**
- **Dates** (or flexible?)
- **Number of travelers** (solo, couple, family with kids?)
- **Budget level** (budget, mid-range, luxury?)
- **Trip style** (relaxation, culture, adventure, foodie, nightlife?)
- **Must-dos** (any specific activities, restaurants, or experiences?)

Do NOT search for flights without knowing the origin city — you will get it wrong.

## Output Structure

Organize the trip plan into these sections, in this order:

### 1. Flights

Search for flights using `webSearch` with queries like `"Google Flights [origin] to [destination] [dates]"`, `"Skyscanner [origin] to [destination] [month]"`.

Present options with **direct links** to booking/search pages:

```text
**Option 1: [Airline] — $XXX roundtrip**
- Outbound: [date], [time] [origin] → [time] [dest] (Xh Xm, nonstop/1 stop)
- Return: [date], [time] [dest] → [time] [origin] (Xh Xm, nonstop/1 stop)
- [Google Flights link](URL) | [Book direct with airline](URL)

**Option 2: [Airline] — $XXX roundtrip**
...
```

Include at least 3 options when possible: cheapest, best schedule, best airline. Note open-jaw options if doing a multi-city trip.

**Flight search tools — use multiple, they surface different fares:**

| Tool | What it's best at |
|------|-------------------|
| Google Flights | Speed; calendar price grid; search up to 7 origin + 7 destination airports at once; price-history graph shows if "now" is cheap |
| Skyscanner | "Everywhere" destination (cheapest places from your airport, sorted by price); "Whole month" date view; surfaces budget carriers Google misses |
| Skiplagged | Hidden-city fares — flight A→C with layover at B is cheaper than A→B, so you get off at B. Savings up to 60%. **Constraints:** carry-on only (checked bags go to C), one-way only (skipping a leg cancels the rest), don't do it repeatedly on the same airline (they ban accounts) |
| Going.com / Secret Flying | Error fares, mistake prices — time-sensitive |

**Booking rules:**

- Find the fare on an aggregator → **book direct with the airline.** OTAs (Expedia etc.) are useless when flights get cancelled — airline agents will say "call Expedia"
- Domestic sweet spot: 1-3 months out. International: 2-6 months. Last-minute is almost always worse except on empty routes
- Tuesday/Wednesday/Saturday departures are typically cheapest
- Open-jaw (fly into city A, out of city B) via multi-city search — often cheaper than round-trip + ground transport

### 2. Hotels / Accommodations

Search using `webSearch` for hotels in the destination area with queries like `"best hotels [neighborhood] [city] [budget level]"`, `"[city] hotels [dates] site:booking.com"`, `"[city] airbnb [neighborhood]"`.

Present options with **direct links**:

```text
**[Hotel Name]** — $XXX/night | [neighborhood] | [rating] stars
- [Key feature 1], [key feature 2] (e.g., rooftop pool, walkable to old town, free breakfast)
- [Booking.com link](URL) | [Hotel website](URL)

**[Hotel/Airbnb Name]** — $XXX/night | [neighborhood] | [rating]
...
```

Include 3-5 options spanning the user's budget range. Note the neighborhood and why it's a good base. For multi-city trips, list accommodations per city.

| Platform | Best for |
|----------|----------|
| Booking.com | Widest hotel inventory, free cancellation options, price match |
| Airbnb | Apartments, longer stays, groups, kitchens |
| Hostelworld | Budget/social travelers |
| Hotel direct sites | Loyalty perks, best-rate guarantees |

### 3. Day-by-Day Itinerary

Structure each day with anchor activities and restaurant recommendations with links:

```text
## Day X — [Neighborhood/Theme]

**Anchor (AM):** [Activity] — book ahead? y/n — ~$XX — nearest metro: [station]
**Lunch:** [Restaurant name](URL) — [cuisine, 1-line description] — ~$XX/person
**Anchor (PM):** [Activity]
**Dinner:** [Restaurant name](URL) — [cuisine, 1-line description] — ~$XX/person
**Alt dinner:** [Restaurant name](URL) — [backup option]
**Transit:** [A→B method, ~time, ~cost]
**If it rains / you're tired:** [one swap]
**Day est:** $XX
```

For restaurant links, search with `webSearch` for `"best [cuisine] restaurant [neighborhood] [city]"` or `"[city] [neighborhood] restaurants site:google.com/maps"`. Link to Google Maps, Yelp, or the restaurant's website.

### 4. Web App — Map + Itinerary

**Always build a web app** that combines two views the user can switch between:

1. **Map view** — all locations plotted on an interactive map with color-coded markers by type (airports, hotels, activities, restaurants). Each marker has a popup with name, time, and links. Connect same-day stops with route lines so the user can see the flow.

2. **Itinerary view** — a beautiful, card-based day-by-day layout. Each day is a card with the day number, neighborhood/theme, and a timeline of activities, meals, and transit. Include photos or icons for each stop, estimated costs, and direct links to book or learn more.

Use the **Nominatim API** (OpenStreetMap) for geocoding addresses to lat/lng — no API key required.

The user should be able to toggle between map and itinerary views. Clicking a day in the itinerary should highlight that day's markers on the map.

### 5. Budget Summary

| Category | Est. Total |
|----------|-----------|
| Flights | $XXX |
| Accommodation (X nights) | $XXX |
| Food | $XXX |
| Activities/Entries | $XXX |
| Local Transport | $XXX |
| **Trip Total** | **$X,XXX** |

## Entry Requirements — Check Before Anything Else

Getting this wrong ends the trip at the airport. webSearch every time — rules change.

| Check | Source | Notes |
|-------|--------|-------|
| Visa requirements | `travel.state.gov` (US citizens) or `[passport country] [destination] visa requirements` | |
| Schengen 90/180 (Europe) | `ec.europa.eu` calculator or `schengenvisainfo.com/visa-calculator` | 90 days in any rolling 180-day window. Does NOT reset on exit. Count days not months. Entry + exit days both count as full days. Schengen ≠ EU (UK, Ireland out; Switzerland, Norway in) |
| ETIAS (Europe) | `etias.com` | Pre-authorization now required even for visa-free travelers |
| Passport validity | — | Many countries require 6 months validity beyond your departure date. Check blank pages too (some need 2+) |
| Vaccines | `cdc.gov/travel` | Yellow fever is mandatory (with certificate) for some countries if arriving from an endemic zone |
| Onward ticket proof | — | Some countries (Thailand, Philippines, Indonesia, Costa Rica, Peru) won't let you board without proof you're leaving |
| Safety advisories | `travel.state.gov/content/travel/en/traveladvisories` | |

## Itinerary Pacing — The #1 Mistake Is Overplanning

**Hard limits:**

- **Max 1 anchor activity per half-day.** One museum in the morning, one neighborhood in the afternoon. Hour-by-hour schedules fall apart by day 2.
- **Transit tax:** every change of location costs 30-60 min more than Google Maps says (finding the entrance, ticketing, getting lost once). Budget it.
- **Day 1 after a long-haul flight is dead.** Plan a walk and an early dinner, nothing with a timed entry.
- **3-night minimum per city** for multi-city trips. 2 nights = 1 real day. Fewer cities, done well, beats a checklist.
- **One unplanned afternoon per 3 days.** The best travel moments are unscheduled.
- **Cluster by geography** — plot everything on a map first, then group by neighborhood. Never cross the city twice in a day.

**Known closure patterns:**

- Europe: many museums closed Mondays (Louvre, Prado) or Tuesdays (Italy). Always verify.
- Japan: many restaurants/shops closed one weekday (often Mon or Wed). Golden Week (late Apr-early May) = everything packed.
- Middle East: Friday is the weekend day; expect closures.
- Siesta countries (Spain, Greece, parts of Italy): 2-5pm dead zone outside tourist cores.

## Budget Estimation

| Category | Budget | Mid | High | Notes |
|----------|--------|-----|------|-------|
| Sleep /night | $25-50 | $80-180 | $250+ | Hostels/guesthouses → 3-star → boutique |
| Food /day | $15-30 | $40-80 | $120+ | Street + one sit-down → restaurants → tasting menus |
| Local transit /day | $5-15 | $15-30 | $50+ | Metro pass → occasional taxi → car+driver |
| Activities /day | $0-20 | $30-60 | $100+ | Free walking tours → paid entries → private guides |

Southeast Asia / Central America / Eastern Europe: use the low end. Western Europe / Japan / Australia: mid-to-high. Switzerland / Norway / Iceland: add 30% to whatever you estimated.

**Always add:** intercity transport (trains/flights between cities — often the hidden budget killer), travel insurance (~4-8% of trip cost), SIM/eSIM (~$20-40), visa fees, 10-15% buffer.

## Useful lookups (webSearch)

- `"[city] 3 day itinerary reddit"` — real traveler pacing, not SEO content
- `"rome2rio [city A] to [city B]"` — compares train/bus/flight/ferry with rough prices
- `"numbeo cost of living [city]"` — meal/taxi/beer price baselines
- `"seat61 [country]"` — train travel bible, especially Europe/Asia
- `"[attraction] skip the line"` — whether advance booking is actually necessary

## Limitations

- Can't see live prices/availability — user must verify before booking
- Visa rules change — always confirm on official government sites
- Can't book anything
