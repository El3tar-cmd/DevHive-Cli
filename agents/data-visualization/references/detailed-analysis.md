# Detailed Analysis Report Guide

This reference explains how to generate a comprehensive analysis report when the user opts in during Step 6.

## Gathering Data

Before writing the report, collect all available data:

### 1. Curl API Endpoints

Fetch raw JSON from every endpoint defined in the api-server routes. Follow the shared proxy rules from the `pnpm-workspace` skill:

```bash
# Example: fetch all endpoints and save responses
curl http://localhost:80/api/data/endpoint1 | jq '.'
curl http://localhost:80/api/data/endpoint2 | jq '.'
curl "http://localhost:80/api/metrics/kpis?startDate=2024-01-01&endDate=2024-12-31" | jq '.'
```

Look at the actual numbers — totals, averages, min/max values, distributions, and time-series progressions.

### 2. Visual Patterns

Call `screenshot` on the dashboard (or specific sections if it has tabs/views) to capture visual patterns:

```javascript
await screenshot({ path: "/my-dashboard/" });
```

Analyze the returned screenshot yourself — identify trends, outliers, correlations, and notable patterns in each chart.

### 3. Cross-Reference

Combine API data with visual observations. The raw numbers give precision; the charts reveal trends and relationships that may not be obvious from numbers alone.

## Report Structure

Write the report as a markdown file with this structure:

```markdown
# <Topic> — Detailed Analysis

## Executive Summary

<2-3 sentences capturing the single most important finding and overall picture. This should stand alone — a reader who only reads this paragraph should understand the key takeaway.>

## Key Findings

### 1. <Most impactful finding>

<Explanation of the finding with specific numbers and context. Why does this matter? What does it mean for the user?>

<Supporting data — quote specific metrics, percentages, or comparisons from the dashboard.>

### 2. <Second finding>

<Same structure: explanation + supporting data.>

### 3. <Third finding>

<Continue for each significant finding. Aim for 3-6 findings, ordered from most to least impactful.>

## Data Summary

<Include a markdown table summarizing the key metrics. Example:>

| Metric | Value | Change | Period |
|--------|-------|--------|--------|
| Total Revenue | $1.2M | +12% | Q4 2024 |
| Monthly Churn | 5.8% | +1.6pp | Last 3 months |
| Avg Order Value | $84.50 | -3% | vs. prior quarter |

## Trends & Patterns

<Describe time-series trends, seasonal patterns, correlations between metrics, or any cyclical behavior observed in the data.>

## Recommendations

<3-5 actionable recommendations based on the findings. Each should be specific and tied to a finding above.>

1. **<Action>** — <Why, based on which finding, and expected impact.>
2. **<Action>** — <Why, based on which finding, and expected impact.>
3. **<Action>** — <Why, based on which finding, and expected impact.>
```

## Quality Standards

- **Use specific numbers** — never say "significant increase" when you can say "increased 23% from $840K to $1.03M"
- **Cite the dashboard** — reference specific charts or KPIs (e.g., "As shown in the Monthly Revenue chart...")
- **Order by impact** — lead with the finding that matters most to the user's original question
- **Include tables** — use markdown tables for any comparison or multi-metric summary
- **Keep recommendations actionable** — "Investigate the 42% day-1 drop-off with an onboarding survey" is better than "Improve onboarding"
- **Match the user's question** — if they asked "Why are users churning?", the report should be structured around answering that question, not just describing data

## File Naming

Use kebab-case derived from the user's question or the dashboard topic:

- "Why are my users churning?" → `user-churn-analysis.md`
- "Show me revenue trends" → `revenue-trends-analysis.md`
- "Stripe payment analytics" → `stripe-payment-analysis.md`
- "GitHub issues dashboard" → `github-issues-analysis.md`

Always save to `.agents/outputs/` directory (create it if it doesn't exist).

## Example Output

For a user who asked "Why are my users churning?":

```markdown
# User Churn — Detailed Analysis

## Executive Summary

Churn has risen from 4.2% to 5.8% over the last quarter, driven primarily by first-week disengagement — 42% of churned users never returned after day 1. The mid-tier plan ($29/mo) shows disproportionately high churn at 8.1%, suggesting a pricing or value-perception gap.

## Key Findings

### 1. Day-1 Drop-Off Is the Primary Churn Driver

42% of users who eventually churned had zero sessions after their first day. This "silent churn" pattern indicates that users are not finding value quickly enough during onboarding. The median time-to-first-value for retained users is 12 minutes, while churned users averaged 34 minutes before abandoning.

### 2. Mid-Tier Plan Churn Is 2x the Average

The $29/mo Professional plan has an 8.1% monthly churn rate, compared to 3.9% for the $9/mo Starter plan and 2.7% for the $79/mo Enterprise plan. This suggests users at this tier expect more than what's delivered, or the jump from Starter to Professional doesn't feel justified.

### 3. Churn Spikes After Billing Events

Monthly churn consistently spikes 2-3 days after billing cycle dates. Users who received a billing email were 1.4x more likely to cancel within 48 hours, particularly those who hadn't logged in during the previous 7 days.

## Data Summary

| Metric | Value | Change | Period |
|--------|-------|--------|--------|
| Overall Monthly Churn | 5.8% | +1.6pp | Last 3 months |
| Day-1 Drop-Off Rate | 42% | +8pp | vs. 6 months ago |
| Mid-Tier Churn | 8.1% | +2.3pp | Last quarter |
| Post-Billing Cancellations | 34% of all churn | — | Last 90 days |

## Trends & Patterns

Churn has followed an upward linear trend since October, accelerating in January (likely due to annual plan renewals and New Year budget reviews). Weekend signups churn at 1.5x the rate of weekday signups, possibly due to less support availability during onboarding.

## Recommendations

1. **Redesign the first-session onboarding** — Target a time-to-first-value under 15 minutes. The 42% day-1 drop-off is the largest lever available.
2. **Audit the Professional plan value proposition** — At 8.1% churn (2x average), either add features that justify the price or introduce an intermediate tier.
3. **Add a pre-billing engagement nudge** — Send a value-recap email 3 days before billing to inactive users, showing what they'd lose by canceling.
```
