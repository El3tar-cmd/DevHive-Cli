# CSS Overrides for Data Visualization

Patch `artifacts/<slug>/src/index.css` to fix Tailwind v4 variants, fonts, shadows, chart colors, and print styles.

Add after the `@plugin` imports at the top of the file:

```css
@custom-variant hover (&:hover);
@custom-variant dark (&:where(.dark, .dark *));
```

In `:root`, add/override:

```css
color-scheme: light;
--app-font-sans: 'IBM Plex Sans', sans-serif;
--app-font-serif: Georgia, serif;
--app-font-mono: Menlo, monospace;
--shadow-2xs: 0 1px 1px 0 rgb(0 0 0 / 0);
--shadow-xs: 0 1px 2px 0 rgb(0 0 0 / 0);
--shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0);
--shadow: 0 1px 3px 0 rgb(0 0 0 / 0), 0 1px 2px -1px rgb(0 0 0 / 0);
--shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0), 0 2px 4px -2px rgb(0 0 0 / 0);
--shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0), 0 4px 6px -4px rgb(0 0 0 / 0);
--shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0), 0 8px 10px -6px rgb(0 0 0 / 0);
--shadow-2xl: 0 25px 50px -12px rgb(0 0 0 / 0);
--chart-1: 211 100% 47%;  /* Blue: #0079F2 */
--chart-2: 250 100% 68%;  /* Purple: #795EFF */
--chart-3: 130 100% 28%;  /* Green: #009118 */
--chart-4: 0 91% 34%;     /* Red: #A60808 */
--chart-5: 330 81% 60%;   /* Pink: #ec4899 */
```

Do NOT use Tailwind shadow utility classes (shadow-sm, shadow-md, etc.) on any elements. The shadow CSS variables are intentionally set to zero. Adding shadow-* classes bypasses this.

In `.dark`, add/override:

```css
color-scheme: dark;
--chart-1: 211 100% 55%;
--chart-2: 250 100% 74%;
--chart-3: 130 100% 36%;
--chart-4: 0 91% 42%;
--chart-5: 330 81% 65%;
```

In `@layer base`, add:

```css
button { cursor: pointer; }
```

Also in `@layer base`, add calendar and popover fixes:

```css
[data-slot="calendar"] {
  --cell-size: 2.25rem;
}
[data-radix-popper-content-wrapper] [data-slot="popover-content"] {
  box-shadow: 0 4px 16px -2px rgb(0 0 0 / 0.12), 0 2px 4px -2px rgb(0 0 0 / 0.06);
  border: 1px solid hsl(var(--border));
}
.dark [data-radix-popper-content-wrapper] [data-slot="popover-content"] {
  box-shadow: 0 4px 16px -2px rgb(0 0 0 / 0.4), 0 2px 4px -2px rgb(0 0 0 / 0.2);
}
```

Add `@media print` at end of file:

```css
@media print {
  @page { margin: 0; }
  body { margin: 0.5in; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .gap-4, .gap-6 { row-gap: 0 !important; }
  :root, .dark {
    color-scheme: light;
    --background: 0 0% 100%; --foreground: 222 47% 11%;
    --card: 0 0% 100%; --card-foreground: 222 47% 11%;
    --card-border: 214 32% 91%; --muted-foreground: 215 16% 47%;
  }
  .shadcn-card { box-shadow: none !important; border: 1px solid #d1d5db !important; break-inside: avoid; margin-top: 0.3in; }
  .recharts-responsive-container { display: flex !important; justify-content: center !important; break-inside: avoid; }
  [data-radix-scroll-area-viewport] { overflow: visible !important; max-height: none !important; height: auto !important; }
  .overflow-auto, .overflow-y-auto, .overflow-scroll, .overflow-y-scroll { overflow: visible !important; max-height: none !important; }
  [style*="max-height"] { max-height: none !important; }
}
```

These ensure Tailwind v4 variants work, fonts/shadows render correctly, chart colors match common-color-guide.md, and PDF export works.
