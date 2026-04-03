---
name: photo-editor
description: Edit, resize, crop, filter, and optimize images using code-based image processing
---

# Photo Editor

Resize, crop, filter, and optimize images. Pillow for Python, sharp for Node. Clarify intent before starting.

## Clarify Intent First

When a user asks to "edit a photo" or "change an image," the request could mean two very different things. **Ask before proceeding** if it's ambiguous:

1. **Edit the existing image** — crop, resize, recolor, adjust brightness/contrast, add text, remove background, apply filters, watermark, etc. → Use the tools below (Pillow, sharp, OpenCV).
2. **Generate a new AI image** — create something from scratch or heavily reimagine the photo (e.g., "make this photo look like a painting," "put me on a beach," "create a logo from this concept"). → Use image generation tools instead, not this skill.

**When to ask:**

- "Can you fix this photo?" → Probably editing. Ask what specifically needs fixing.
- "Make this look better" → Ambiguous. Ask: "Do you want me to adjust the existing photo (brightness, contrast, cropping, etc.) or generate a new version with AI?"
- "Change the background" → Could be either. Ask: "Should I remove the current background (I can make it transparent or a solid color), or do you want an AI-generated scene behind you?"
- "Make a profile picture from this" → Likely crop/resize, but could mean AI enhancement. Clarify.

**Don't ask when it's obvious:**

- "Crop this to 1080x1080" → Just crop it.
- "Make this a PNG" → Just convert it.
- "Remove the background" → Use rembg.
- "Generate a photo of a sunset" → No existing photo to edit — use image generation.

## Tool Selection

| Tool | Use when | Install |
|---|---|---|
| **Pillow** | Default: resize, crop, filters, text, format conversion | `pip install Pillow` |
| **OpenCV** | Computer vision: face detection, perspective transform, contours | `pip install opencv-python` |
| **sharp** (Node) | High-volume pipelines — 4-5x faster than Pillow (libvips-backed) | `npm install sharp` |
| **rembg** | AI background removal | `pip install rembg` |
| **ImageMagick** | CLI batch ops, 200+ formats | `apt install imagemagick` |

## Open — ALWAYS Fix Orientation First

```python
from PIL import Image, ImageOps

img = Image.open("photo.jpg")
img = ImageOps.exif_transpose(img)   # CRITICAL: applies EXIF rotation, then strips tag

# Without this, phone photos appear sideways after processing

```

## Resize & Crop

```python
from PIL import Image, ImageOps

# --- Fit inside box, keep aspect ratio (shrink only) ---
img.thumbnail((1080, 1080), Image.Resampling.LANCZOS)  # modifies in place

# --- Exact size, keep aspect, center-crop overflow (best for thumbnails) ---
thumb = ImageOps.fit(img, (300, 300), Image.Resampling.LANCZOS, centering=(0.5, 0.5))

# --- Exact size, keep aspect, pad with color (letterbox) ---
padded = ImageOps.pad(img, (1920, 1080), color=(0, 0, 0))

# --- Exact size, ignore aspect (will distort) ---
stretched = img.resize((800, 600), Image.Resampling.LANCZOS)

# --- Scale by factor ---
half = img.resize((img.width // 2, img.height // 2), Image.Resampling.LANCZOS)

# --- Manual crop (left, upper, right, lower) — NOT (x, y, w, h) ---
cropped = img.crop((100, 50, 900, 650))

```

**Resampling filters:** `LANCZOS` for photo downscale (best quality), `BICUBIC` for upscale, `NEAREST` for pixel art/icons (no smoothing).

## Color & Exposure

```python
from PIL import ImageEnhance, ImageOps

# --- Enhancers: 1.0 = unchanged, <1 less, >1 more ---
img = ImageEnhance.Brightness(img).enhance(1.15)
img = ImageEnhance.Contrast(img).enhance(1.2)
img = ImageEnhance.Color(img).enhance(1.1)      # saturation
img = ImageEnhance.Sharpness(img).enhance(1.5)

# --- Quick ops ---
gray = ImageOps.grayscale(img)
inverted = ImageOps.invert(img.convert("RGB"))
auto = ImageOps.autocontrast(img, cutoff=1)     # stretch histogram, clip 1% extremes
equalized = ImageOps.equalize(img)              # flatten histogram

```

## Filters

```python
from PIL import ImageFilter

img.filter(ImageFilter.GaussianBlur(radius=5))
img.filter(ImageFilter.UnsharpMask(radius=2, percent=150, threshold=3))  # better than SHARPEN
img.filter(ImageFilter.BoxBlur(10))
img.filter(ImageFilter.FIND_EDGES)
img.filter(ImageFilter.MedianFilter(size=3))    # denoise, removes salt-and-pepper

```

## Text & Watermark

```python
from PIL import Image, ImageDraw, ImageFont

draw = ImageDraw.Draw(img)
try:
    font = ImageFont.truetype("DejaVuSans-Bold.ttf", 48)   # Linux default
except OSError:
    font = ImageFont.load_default()                        # fallback (tiny, ugly)

# --- Text with outline ---
draw.text((50, 50), "Caption", font=font, fill="white",
          stroke_width=3, stroke_fill="black")

# --- Centered text ---
bbox = draw.textbbox((0, 0), "Centered", font=font)
tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
draw.text(((img.width - tw) // 2, (img.height - th) // 2), "Centered", font=font, fill="white")

# --- Watermark (semi-transparent PNG overlay) ---
logo = Image.open("logo.png").convert("RGBA")
logo.thumbnail((img.width // 5, img.height // 5))

# Fade to 40% opacity
alpha = logo.split()[3].point(lambda p: int(p * 0.4))
logo.putalpha(alpha)
pos = (img.width - logo.width - 20, img.height - logo.height - 20)
img.paste(logo, pos, logo)  # third arg = alpha mask — REQUIRED for transparency

```

## Save & Optimize

```python

# --- JPEG ---
img.convert("RGB").save("out.jpg", quality=85, optimize=True, progressive=True)

# convert("RGB") REQUIRED if source has alpha — JPEG can't store transparency

# --- PNG (lossless — quality param does nothing) ---
img.save("out.png", optimize=True, compress_level=9)

# --- WebP (best web format: ~30% smaller than JPEG at same quality) ---
img.save("out.webp", quality=85, method=6)   # method 0-6, 6=slowest/best compression

# --- AVIF (smallest files, Pillow 11+, slower encode) ---
img.save("out.avif", quality=75)             # 75 ≈ JPEG 85 visually, ~50% smaller

# --- Strip all metadata (privacy) ---
clean = Image.new(img.mode, img.size)
clean.putdata(list(img.getdata()))
clean.save("stripped.jpg", quality=85)

```

**Quality guide:** JPEG/WebP 85 = sweet spot. 90+ = diminishing returns. <70 = visible artifacts. Never re-save JPEGs repeatedly — each save degrades (generation loss).

## Batch Processing

```python
from pathlib import Path
from PIL import Image, ImageOps

out = Path("optimized"); out.mkdir(exist_ok=True)
for p in Path("photos").glob("*.[jJ][pP]*[gG]"):   # matches jpg, jpeg, JPG, JPEG
    img = ImageOps.exif_transpose(Image.open(p))
    img.thumbnail((1920, 1920), Image.Resampling.LANCZOS)
    img.convert("RGB").save(out / f"{p.stem}.webp", quality=85, method=6)

```

## sharp (Node.js — use for high throughput)

```javascript
const sharp = require('sharp');

// Resize + convert + optimize, streaming (flat memory)
await sharp('in.jpg')
  .rotate()                          // auto-rotate from EXIF (like exif_transpose)
  .resize(1080, 1080, { fit: 'cover', position: 'center' })  // = ImageOps.fit
  .webp({ quality: 85 })
  .toFile('out.webp');

// fit options: 'cover' (crop), 'contain' (letterbox), 'inside' (shrink to fit), 'fill' (stretch)

// Composite watermark
await sharp('photo.jpg')
  .composite([{ input: 'logo.png', gravity: 'southeast' }])
  .toFile('watermarked.jpg');

```

sharp strips all metadata by default. Use `.withMetadata()` to preserve EXIF/ICC.

## OpenCV (when Pillow isn't enough)

```python
import cv2

img = cv2.imread("in.jpg")                    # BGR order, not RGB!
gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

# Face detection
cascade = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")
faces = cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5)
for (x, y, w, h) in faces:
    cv2.rectangle(img, (x, y), (x+w, y+h), (0, 255, 0), 2)

cv2.imwrite("out.jpg", img)

# Pillow ↔ OpenCV
import numpy as np
cv_img = cv2.cvtColor(np.array(pil_img), cv2.COLOR_RGB2BGR)
pil_img = Image.fromarray(cv2.cvtColor(cv_img, cv2.COLOR_BGR2RGB))

```

## Platform Dimensions

| Platform | Size | Ratio |
|---|---|---|
| Instagram post | 1080×1080 | 1:1 |
| Instagram story / TikTok | 1080×1920 | 9:16 |
| Twitter/X | 1200×675 | 16:9 |
| YouTube thumbnail | 1280×720 | 16:9 |
| Open Graph (link preview) | 1200×630 | 1.91:1 |

## Gotchas

- **`img.crop()` box is `(left, top, right, bottom)`** — absolute coords, NOT `(x, y, width, height)`
- **`thumbnail()` mutates in place and returns `None`** — don't do `img = img.thumbnail(...)`
- **Paste with transparency** needs the image as the third (mask) arg: `bg.paste(fg, pos, fg)`
- **Palette mode ("P")** breaks many filters — `img.convert("RGB")` first
- **Fonts:** `ImageFont.truetype` needs a real font file. Linux: `/usr/share/fonts/truetype/dejavu/`. Ship a `.ttf` with your code for portability.
