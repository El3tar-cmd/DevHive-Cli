---
name: podcast-generator
description: Turn research or topics into podcast scripts and audio using ElevenLabs
---

# Podcast Generator

Turn research, articles, or topics into podcast-ready scripts and audio content. Generate conversational scripts with host/guest dynamics and produce audio using ElevenLabs text-to-speech.

## When to Use

- User wants to turn written content into a podcast episode
- User wants to create a podcast-style summary of a topic or paper
- User wants to generate audio content from research
- User mentions "AI Pods", podcast, or audio content creation

## When NOT to Use

- Music creation or sound effects
- Video content (use storyboard skill for planning)
- Written summaries only (use deep-research skill)

## Methodology

### Step 1: Content Ingestion

Gather the source material:

- Read provided documents, articles, or URLs
- Research the topic using webSearch if needed
- Identify key points, interesting angles, and narrative arc
- Note any technical terms that need explanation

### Step 2: Format Selection

Choose the podcast format:

| Format | Description | Best For |
|--------|-------------|----------|
| **Solo explainer** | One host walks through the topic | Tutorials, news summaries, deep dives |
| **Conversational duo** | Two hosts discuss and riff | Making complex topics accessible, entertainment |
| **Interview style** | Host asks questions, expert answers | Technical topics, research papers |
| **Debate** | Two perspectives argue a topic | Controversial or nuanced subjects |
| **Narrative** | Storytelling with narration | Case studies, historical events |

### Step 3: Script Writing — NotebookLM Pattern

The two-host format that works (reverse-engineered from Google's Audio Overviews):

- **Host A = "The Explainer"** — knows the material, breaks down concepts
- **Host B = "The Questioner"** — audience surrogate, asks the "wait, why?" questions
- **Dialog rhythm:** alternate short punchy lines with longer explanations. Sprinkle affirmations: "Right.", "Exactly.", "Okay so—"
- **Arc:** open with common misconception → introduce source that challenges it → unpack implications → "so what does this mean for you"
- **Transitions:** "And on that note..." / "Which brings us to..." / "Here's where it gets weird—"

**Structure (target ~150 words per minute of audio):**

1. **Cold open** (15–30s) — the single most surprising finding, stated as a question or contradiction
2. **Setup** (30–60s) — what we're covering, why it matters now
3. **Segments** (3–5 × 2–4 min) — one idea each; end each with a mini-hook into the next
4. **Takeaways** (1–2 min) — 3 things to remember
5. **Outro** (15s) — sign-off

**Write for ears, not eyes:** contractions always, no semicolons, no parentheticals. If you wouldn't say it out loud, rewrite it.

**Script format** — one line per utterance, speaker tag in brackets, blank line between speakers. This is the unit you'll chunk for TTS:

```text
[ALEX]: So today we're diving into something that honestly broke my brain a little.

[SAM]: Oh no. What now.

[ALEX]: Okay — you know how everyone says [common belief]? There's this paper from [source] that basically says... the opposite.

[SAM]: Wait. The *opposite* opposite?

```

### Step 4: Audio Generation — ElevenLabs

**Install:** `pip install elevenlabs pydub`

**Model choice:** `eleven_multilingual_v2` for quality (10K char limit per call); `eleven_turbo_v2_5` for speed/cost (40K char limit, ~300ms latency, ~3x faster).

**Voice IDs that work for duo podcasts** (from the default library — verify with `client.voices.search()`):

- `JBFqnCBsd6RMkjVDRZzb` (George — warm, mid-range male)
- `21m00Tcm4TlvDq8ikWAM` (Rachel — clear, measured female)
- `pNInz6obpgDQGcFmaJgB` (Adam — energetic narrator)
- `EXAVITQu4vr4xnSDxMaL` (Bella — conversational female)

**Settings for conversational podcast delivery:**

- `stability: 0.45` — lower = more expressive; below 0.3 gets inconsistent
- `similarity_boost: 0.8` — keeps voice consistent across chunks
- `style: 0.3` — mild exaggeration for energy (0 = flat)
- `use_speaker_boost: True`

```python
import os
from elevenlabs.client import ElevenLabs
from pydub import AudioSegment
import io

client = ElevenLabs(api_key=os.environ["ELEVENLABS_API_KEY"])
VOICES = {"ALEX": "JBFqnCBsd6RMkjVDRZzb", "SAM": "21m00Tcm4TlvDq8ikWAM"}

def render_line(speaker: str, text: str) -> AudioSegment:
    audio = client.text_to_speech.convert(
        voice_id=VOICES[speaker],
        text=text,
        model_id="eleven_multilingual_v2",
        output_format="mp3_44100_128",
        voice_settings={"stability": 0.45, "similarity_boost": 0.8,
                        "style": 0.3, "use_speaker_boost": True},
    )
    return AudioSegment.from_mp3(io.BytesIO(b"".join(audio)))

# parse script → list of (speaker, text) tuples, render each, concat
gap = AudioSegment.silent(duration=350)  # 350ms between speakers
episode = sum((render_line(s, t) + gap for s, t in lines), AudioSegment.empty())
episode.export("episode_raw.mp3", format="mp3", bitrate="128k")

```

**Chunking long utterances:** split at sentence boundaries (`.`, `?`, `!`), keep under ~800 chars per call. Pass `previous_text`/`next_text` params to preserve prosody across chunk boundaries.

### Step 5: Loudness Normalization

Podcast standard is **-16 LUFS** (stereo) per Apple/Spotify specs. pydub's `normalize()` is peak-only — not LUFS. Use ffmpeg's two-pass `loudnorm` via the `ffmpeg-normalize` wrapper:

```bash
pip install ffmpeg-normalize
ffmpeg-normalize episode_raw.mp3 -o episode.mp3 -c:a libmp3lame -b:a 128k \
    -t -16 -tp -1.5 -lra 11 --normalization-type ebu

```

`-t -16` = target LUFS, `-tp -1.5` = true-peak ceiling (prevents clipping), `-lra 11` = loudness range. This runs two passes automatically (analyze, then correct).

## Episode Length Guidelines

| Content Type | Target Length | Script Word Count |
|-------------|-------------|-------------------|
| News summary | 5-10 min | 750-1,500 words |
| Topic explainer | 10-20 min | 1,500-3,000 words |
| Deep dive | 20-40 min | 3,000-6,000 words |
| Research paper review | 15-25 min | 2,250-3,750 words |

Rule of thumb: ~150 words per minute of audio.

## Best Practices

1. **Hook early** — if the first 30 seconds aren't interesting, listeners skip
2. **One idea per segment** — don't cram too much; let ideas breathe
3. **Use stories and examples** — abstract concepts need concrete illustrations
4. **Vary pacing** — alternate between fast energy and slow, thoughtful moments
5. **End with value** — give listeners a clear takeaway or action item

## Limitations

- Requires `ELEVENLABS_API_KEY` env var
- Voices mispronounce technical terms/acronyms — spell phonetically in the script (`"Kubernetes"` → `"koo-ber-NET-eez"`) or use ElevenLabs pronunciation dictionaries
- `eleven_multilingual_v2` has known issues with very long single calls (voice drift, occasional stutter) — chunk at sentence boundaries, don't send 5K-char blobs
- Cost: ~$0.18–0.30 per 1000 characters depending on plan; a 20-min episode (~3000 words) ≈ $3–5
