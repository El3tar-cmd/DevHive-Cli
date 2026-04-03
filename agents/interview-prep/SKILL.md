---
name: interview-prep
description: Prepare for job interviews with tailored questions, STAR answers, and company research. Builds interactive web apps for practice.
---

# Job Interview Prep Kit

Prepare for interviews with company-specific research, behavioral story banks, technical frameworks, and salary negotiation scripts. Always delivers as an interactive web app.

## When to Use

- Upcoming interview, mock question practice, salary negotiation prep, behavioral story coaching

## When NOT to Use

- Resume creation (resume-maker), broad career research (deep-research)

## Step 0: Ask the User — Mode Selection

Before doing anything else, ask the user:

1. **What role and company** are you interviewing for?
2. **Which prep mode do you want?**
   - **Voice mock interview** — AI-powered voice conversation simulating a real interview (uses OpenAI Realtime API for speech-to-speech)
   - **Text mock interview** — Chat-based interview simulator where the AI asks questions and gives feedback in real time
   - **Interview prep dashboard** — A reference website with expected questions, company intel, story frameworks, and negotiation scripts

All three modes are built as **web apps** deployed as artifacts. Do not output raw markdown — always build an interactive app.

## Step 1: Research the Role and Company

Before building anything, use `webSearch` to gather real intel. This data populates whichever mode the user chose.

| Source | Query | What you get |
|---|---|---|
| **Glassdoor** | `site:glassdoor.com [Company] interview questions [role]` | Actual questions asked, by round. Filter to last 6 months. |
| **Blind** | `site:teamblind.com [Company] interview` OR `[Company] onsite` | Unfiltered loop structure, which rounds matter, bar-raiser tells, comp bands |
| **levels.fyi** | `site:levels.fyi [Company]` | Real comp by level + location. Critical for negotiation anchoring. |
| **LeetCode Discuss** | `site:leetcode.com/discuss [Company] [role]` | Tagged coding problems actually asked |
| **LinkedIn** | `[Company] [team name]` → recent posts from hiring manager | What they're shipping, what they celebrate, vocabulary they use |
| **Eng blog / Newsroom** | `[Company] engineering blog` | System design context. Mentioning their published architecture in an interview is a strong signal. |

For Amazon specifically: each interviewer is assigned 1-3 Leadership Principles to probe. Map stories to LPs before the loop.

## Step 2: Build the Web App

### Mode A: Voice Mock Interview

Build a React web app that uses the **OpenAI Realtime API** for voice-to-voice interview simulation. The app should:

- Connect to OpenAI's Realtime API via WebSocket for low-latency speech-to-speech
- Configure the AI persona as an interviewer for the specific role/company
- Seed the system prompt with the researched questions from Step 1
- Include a **question queue** panel showing upcoming questions (behavioral, technical, situational) drawn from Glassdoor/Blind research
- Show a **live transcript** panel so the user can review what they said
- After each answer, provide **written feedback** on: STAR structure, specificity, quantification, and areas to improve
- Include a **timer** per question (recommended 2-3 min per behavioral, 15-20 min per system design)
- End with a **scorecard** summarizing performance across categories

```javascript
// OpenAI Realtime API connection pattern
const pc = new RTCPeerConnection();
const audioEl = document.createElement("audio");
audioEl.autoplay = true;

// Add local audio track for user's microphone
const ms = await navigator.mediaDevices.getUserMedia({ audio: true });
pc.addTrack(ms.getTracks()[0]);
pc.ontrack = (e) => { audioEl.srcObject = e.streams[0]; };

// Connect to OpenAI Realtime
const tokenRes = await fetch("/api/realtime-session", { method: "POST" });
const { client_secret } = await tokenRes.json();
const offer = await pc.createOffer();
await pc.setLocalDescription(offer);

const sdpRes = await fetch("https://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${client_secret.value}`,
    "Content-Type": "application/sdp",
  },
  body: offer.sdp,
});
await pc.setRemoteDescription({ type: "answer", sdp: await sdpRes.text() });
```

The backend route (`/api/realtime-session`) creates an ephemeral token via:

```javascript
const r = await fetch("https://api.openai.com/v1/realtime/sessions", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    model: "gpt-4o-realtime-preview",
    voice: "verse",
    instructions: `You are an interviewer for [Role] at [Company]. Ask behavioral and technical questions one at a time. After the candidate answers, give brief feedback, then move to the next question. Questions: [insert researched questions from Step 1]`,
  }),
});
const data = await r.json();
// Return data.client_secret to the frontend
```

### Mode B: Text Mock Interview

Build a React chat app that simulates a text-based interview. The app should:

- Present a chat interface styled like a messaging app
- AI asks one question at a time from the researched question bank
- After each user response, AI provides inline feedback (STAR structure check, specificity score, improvement suggestions)
- Include a **sidebar** with: question categories (behavioral / technical / situational), progress tracker, tips for the current question type
- Use the OpenAI Chat Completions API (not Realtime) via a backend route
- End with a **summary report** scoring each answer

System prompt for the interviewer AI:

```text
You are interviewing a candidate for [Role] at [Company]. Ask questions one at a time from this list: [researched questions]. After each answer, give brief, constructive feedback focusing on: specificity, use of "I" vs "we", quantified results, and STAR structure. Then ask the next question. Be professional but conversational.
```

### Mode C: Interview Prep Dashboard

Build a polished single-page React app with these sections:

1. **Company Intel Panel** — loop structure, recent news (from web search), team info, culture notes
2. **Question Bank** — categorized tabs (Behavioral, Technical, System Design, Culture Fit) with actual questions from Glassdoor/Blind research. Each question expandable to show:
   - Why they ask this
   - Framework to use (STAR, CAR, SOAR, STAR+L)
   - Example strong answer structure
3. **Story Builder** — interactive 6-story matrix (Leadership, Conflict, Failure, Ambiguity, Impact, Scope Creep). User fills in their STAR components; the app validates completeness and flags missing quantification
4. **Comp & Negotiation** — levels.fyi data, target/walk-away ranges, scripted negotiation lines
5. **Questions to Ask** — curated list with context on what each reveals
6. **Countdown Timer** — if the user has an interview date, show days remaining with a suggested daily prep schedule

## Behavioral Story Frameworks

**STAR is the baseline. Know the variants:**

- **STAR** — Situation (1-2 sent) → Task (1 sent) → Action (60% of airtime, use "I" not "we") → Result (quantified)
- **CAR** — Challenge → Action → Result. Tighter; better for rapid-fire rounds.
- **SOAR** — Situation → Obstacle → Action → Result. Use when the story's value is in what you overcame.
- **STAR+L** — Append Learning. Mandatory for failure questions.

**Build a 6-story matrix, not a script per question.** One well-told story covers 3-4 question variants.

| Category | Prepare 1 story each | Maps to questions like |
|---|---|---|
| Leadership | Stepped up without authority | "Influenced without authority," "led a project" |
| Conflict | Disagreed with manager/peer, resolved | "Difficult coworker," "disagree and commit" |
| Failure | Owned a mistake, quantify damage + fix | "Project that failed," "missed a deadline" |
| Ambiguity | Decided with incomplete info | "Moved fast," "prioritized under uncertainty" |
| Impact | Your single biggest measurable win | "Most proud of," "biggest accomplishment" |
| Scope creep | Did more than asked | "Exceeded expectations," "ownership" |

**"Tell me about yourself":** Present (current role + one win) → Past (how you got here, 1 pivot) → Future (why this role is the logical next step). 90 seconds.

## Technical Frameworks

**System design — RADIO:**

- **R**equirements — Functional + non-functional. Ask: scale? latency target? (~15% of time)
- **A**rchitecture — Boxes and arrows. Client, API layer, services, data stores, queues. (~20%)
- **D**ata model — Entities, fields, relationships. (~15%)
- **I**nterface — API contracts. REST vs GraphQL vs gRPC. (~15%)
- **O**ptimizations — Caching, CDN, sharding, read replicas. Senior signal lives here. (~35%)

**Coding pattern recognition:** ~75% of LeetCode-style questions reduce to: sliding window, two pointers, BFS/DFS, binary search on answer, heap for top-K, DP (1D/2D), union-find, monotonic stack.

## Salary Negotiation

1. **Never give a number first.** *"I'd want to learn more about the role before discussing comp — what range did you have budgeted?"*
2. **Only negotiate after a yes.** Once they want to hire you.
3. **BATNA is everything.** Competing offer > current job > nothing.
4. **Anchor with data.** levels.fyi for exact company + level + location. Quote 75th percentile.
5. **Negotiate the package, not the base.** Signing bonus, equity refresh, start date, remote days, title.
6. **The reframe script:** *"I'm really excited about this. Based on levels.fyi data for [level] at [company], I was expecting something closer to [X]. Is there flexibility?"*
7. **Silence is a tool.** State your number. Stop talking.
8. **Get it in writing.**

## Questions to Ask Interviewers

- "What's the one thing that, if it goes wrong in the next 6 months, keeps you up at night?"
- "What did the last person who was great in this role do differently?"
- "What's something the team tried recently that didn't work?"
- "How are decisions made when engineering and product disagree?"
- To the hiring manager: "What would make you say 'I'm so glad we hired them' at the 6-month mark?"

## Best Practices

1. **6 stories, not 30 answers** — depth beats breadth
2. **Quantify or it didn't happen** — "cut p99 from 340ms to 45ms" > "improved performance"
3. **Practice out loud** — written answers don't survive contact with your mouth
4. **"I don't have a great example" is fine** — better than a weak story. Pivot: "The closest I have is..."
5. **Failure questions: own it fully** — hedging is the most common disqualifier

## Limitations

- Voice mode requires user to provide their OpenAI API key (for Realtime API access)
- Comp data lags reality by ~3-6 months; cross-reference Blind for recency
- Company-specific intel quality depends on how much employees post publicly
- Cannot access internal question banks or recruiter portals
