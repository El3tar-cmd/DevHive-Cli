---
name: deep-research
description: Conduct thorough, multi-source research on complex topics with structured findings and citations.
---

# Deep Research

Conduct comprehensive, multi-source research on complex topics. Systematically gather, evaluate, and synthesize information into structured reports with proper citations.

## When to Use

- User needs thorough research on a complex topic
- User asks "research this," "find out about," or "do a deep dive on"
- User needs a literature review, market analysis, or technology evaluation
- User wants to understand a topic from multiple angles with cited sources
- User needs to verify claims or compare conflicting information

## When NOT to Use

- Simple factual lookups (just use web-search directly)
- Searching within the user's own codebase (use grep/glob)
- Looking up Replit-specific features (use replit-docs skill)
- Product recommendations without research depth (use a more specific skill)

## Research Architecture

This skill follows a tree-like exploration pattern inspired by leading open-source research tools:

- **GPT Researcher** (github.com/assafelovic/gpt-researcher, ~17k stars) -- uses "plan and execute" with parallel sub-question research
- **STORM** (github.com/stanford-oval/storm, ~18k stars) -- Stanford's perspective-guided research that simulates multiple expert viewpoints
- **open_deep_research** (github.com/langchain-ai/open_deep_research) -- LangChain's iterative search-and-synthesize approach

The core pattern: decompose the question -> search broadly -> read deeply -> identify gaps -> refine queries -> synthesize with citations.

## Methodology

### Phase 1: Scope Definition

Before starting research, clearly define:

- **Research question**: What specific question(s) are you answering?
- **Scope boundaries**: What is in/out of scope?
- **Depth level**: Overview, moderate analysis, or exhaustive deep-dive?
- **Output expectations**: Report format, length, audience

### Phase 2: Parallel Source Discovery via Subagents

Decompose the topic into **5 distinct focus areas**, then launch **5 research subagents in parallel** using `startAsyncSubagent`. Each subagent gets a specific focus area and set of search terms, searches independently, and returns its findings with citations.

**How to decompose:** After the broad landscape search in Phase 1, identify 5 non-overlapping angles. For example, researching "state of electric vehicles 2026" might decompose into:

1. **Market & Competition** — market share, sales figures, manufacturer rankings
2. **Technology** — battery chemistry, charging standards, range improvements
3. **Policy & Regulation** — government incentives, emissions mandates, trade tariffs
4. **Infrastructure** — charging network growth, grid capacity, urban vs rural
5. **Consumer & Economics** — total cost of ownership, resale value, adoption demographics

**Launch all 5 in parallel:**

```javascript
// Launch 5 research subagents simultaneously
await startAsyncSubagent({
    task: `Research FOCUS AREA 1: [Market & Competition]

Topic context: [brief description of the overall research question]

Your job: Search for information specifically about [focus area]. Run at least 3-4 webSearch queries with different angles:
- [specific search term 1]
- [specific search term 2]
- [specific search term 3]
- [specific search term 4]

For the most promising results, use webFetch to read the full article.

Return your findings as a structured summary with:
- Key facts and data points (with source URLs)
- Notable claims that need cross-referencing
- Gaps or unanswered questions
- At least 5 distinct sources with URLs`
});

// Repeat for focus areas 2-5 with their own tailored search terms
await startAsyncSubagent({ task: `Research FOCUS AREA 2: [Technology] ...` });
await startAsyncSubagent({ task: `Research FOCUS AREA 3: [Policy & Regulation] ...` });
await startAsyncSubagent({ task: `Research FOCUS AREA 4: [Infrastructure] ...` });
await startAsyncSubagent({ task: `Research FOCUS AREA 5: [Consumer & Economics] ...` });

// Wait for all subagents to complete
const results = await waitForBackgroundTasks();
```

Each subagent should:

- Run 3-4 `webSearch` queries with different phrasings and angles
- Use `webFetch` on the 2-3 most relevant results to extract detailed data
- Return structured findings with source URLs
- Flag any claims that conflict with other results

This approach gathers **25+ distinct sources** across 5 focus areas simultaneously, producing far more comprehensive coverage than sequential searching.

After collecting all subagent results, proceed to Phase 3 to evaluate and cross-reference.

### Phase 3: Source Evaluation

Assess each source for credibility:

- **Authority**: Who published it? What are their credentials?
- **Currency**: When was it published? Is the information still current?
- **Objectivity**: Is there obvious bias? Is it sponsored content?
- **Accuracy**: Can claims be cross-referenced with other sources?
- **Coverage**: Does it cover the topic in sufficient depth?

Use webFetch to read full articles from the most promising search results.

### Phase 4: Information Synthesis

Organize findings thematically (what separates deep research from simple search):

- Group related findings across sources
- Identify areas of consensus and disagreement
- Note gaps in available information -- conduct follow-up searches to fill them
- Cross-reference critical claims across at least 2-3 independent sources
- Build a narrative that answers the research question
- Distinguish between established facts, expert opinions, and speculation
- Draw connections between sources that reveal patterns not visible in any single source

### Phase 5: Report Writing

Structure the final report clearly:

- Lead with the most important findings
- Support claims with specific sources
- Acknowledge limitations and uncertainties
- Provide actionable recommendations where appropriate

## Output Format

### Research Report Structure

```text

# [Research Topic]

## Executive Summary
[2-3 paragraph overview of key findings and conclusions]

## Background
[Context needed to understand the topic]

## Key Findings

### Finding 1: [Theme]
[Detailed analysis with source citations]

### Finding 2: [Theme]
[Detailed analysis with source citations]

### Finding 3: [Theme]
[Detailed analysis with source citations]

## Analysis
[Cross-cutting analysis, patterns, implications]

## Limitations
[What couldn't be determined, data gaps, caveats]

## Recommendations
[Actionable next steps based on findings]

## Sources
[Numbered list of all sources with URLs]

```

## Best Practices

1. **Cast a wide net first, then narrow** -- start with broad searches before diving into specifics
2. **Cross-reference critical claims** -- never rely on a single source for important facts
3. **Cite everything** -- every factual claim should trace back to a source
4. **Note disagreements** -- when sources conflict, present both sides and analyze why
5. **Timestamp your research** -- note when the research was conducted, as information changes
6. **Separate facts from analysis** -- clearly distinguish between what sources say and your interpretation

## Example Workflow

```javascript
// Phase 1: Broad landscape search to identify focus areas
const overview = await webSearch({ query: "state of electric vehicle market 2026" });

// Phase 2: Launch 5 parallel research subagents
await startAsyncSubagent({
    task: `Research EV Market & Competition: search for "EV market share by manufacturer 2025 2026",
    "electric vehicle sales global rankings", "Tesla BYD market share comparison".
    Use webFetch on best results. Return findings with source URLs.`
});
await startAsyncSubagent({
    task: `Research EV Battery Technology: search for "solid state battery progress 2026",
    "EV battery cost per kwh trend", "lithium iron phosphate vs NMC comparison".
    Use webFetch on best results. Return findings with source URLs.`
});
await startAsyncSubagent({
    task: `Research EV Policy & Regulation: search for "EV tax credit policy 2026",
    "emissions regulations electric vehicles", "EV tariffs trade policy".
    Use webFetch on best results. Return findings with source URLs.`
});
await startAsyncSubagent({
    task: `Research EV Charging Infrastructure: search for "EV charging network growth statistics",
    "NACS vs CCS charging standard adoption", "fast charging stations by country".
    Use webFetch on best results. Return findings with source URLs.`
});
await startAsyncSubagent({
    task: `Research EV Consumer Economics: search for "EV total cost of ownership vs gas 2026",
    "electric vehicle resale value trends", "EV adoption demographics income".
    Use webFetch on best results. Return findings with source URLs.`
});

// Collect all results
const results = await waitForBackgroundTasks();

// Phase 3-5: Evaluate sources, cross-reference claims, synthesize into structured report
// Write comprehensive report with all findings and citations from all 5 subagents

```

## Limitations

- Cannot access paywalled academic journals or subscription databases
- Cannot access social media content (LinkedIn, Twitter, Reddit)
- Web sources may have varying levels of reliability
- Research is a snapshot in time -- findings may change
- Cannot conduct primary research (surveys, interviews, experiments)
