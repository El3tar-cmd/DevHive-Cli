# App Icon Generation

Use these guidelines when generating app icons, splash screens, or other image assets for Expo apps.

## Image Generation Rules

When using the `media-generation` skill for any image asset:

1. **Describe colors using natural language only** (e.g., "vibrant purple", "soft coral pink", "bright sky blue") - do NOT use hex codes, RGB values, or any number-based color specifications in the prompt
2. **Never include text in generated images** - the generated image must never contain visible text, letters, numbers, words, labels, or any alphanumeric characters
3. **Use descriptive language** - describe visual elements using shapes, colors, gradients, compositions, and styles only
4. **End every prompt with**: "Absolutely no text, letters, numbers, shadows, or alphanumeric characters visible anywhere."

## App Icon Design Guidelines

- **Embrace simplicity** - make it unique and memorable with a minimal number of shapes
- **Use simple backgrounds** - solid colors or gradients work best
- **Add depth with overlapping shapes** - solid shapes in the foreground, particularly when paired with transparency and blurring, create a sense of depth
- **Capture the app's essence** - the icon should reflect the app's purpose and established design guidelines

## Example Prompts

For a fitness tracking app:
> "A minimalist app icon with overlapping circular shapes in energetic orange and deep blue gradients, suggesting movement and vitality, with a subtle blur effect on the background circle, clean modern design on a soft white background. Absolutely no text, letters, numbers, shadows, or alphanumeric characters visible anywhere."

For a recipe app:
> "An elegant app icon featuring a stylized chef's hat shape in warm cream white with a subtle gradient, overlapping a circular plate shape in soft terracotta, minimalist design, clean background in light sage green. Absolutely no text, letters, numbers, shadows, or alphanumeric characters visible anywhere."

Use the generated icon as the splash screen icon as well, ensuring visual consistency across the app's branding. Save to `assets/images/icon.png` — do not generate or save a separate `splash-icon.png` unless explicitly asked to do so.
