---
name: canvas
description: Create, read, and manipulate shapes on the workspace canvas. Supports geometric shapes, text, notes, iframe embeds, images, and videos.
---

# Canvas Skill

## Overview

The workspace canvas is an infinite board where you can create, position, and manipulate visual elements. You have two tools:

- **`get_canvas_state`** -- Read what shapes are on the board, their positions, types, and properties.
- **`apply_canvas_actions`** -- Create, update, delete, move, resize, reorder, align, or distribute shapes.

**Always read the board before making layout-sensitive changes.**

## Coordinate System

- Origin `(0, 0)` is at the top-left of the canvas.
- Positive `x` goes right, positive `y` goes down.
- All positions and sizes are in canvas units.

## Supported Shape Types

- `geo` -- Geometric shapes (rectangles, ellipses). Props: `color`, `fill`, `text`.
- `text` -- Text labels. Props: `text`, `color`.
- `note` -- Sticky notes. Props: `text`, `color`.
- `iframe` -- Embedded web content. Requires `url` (https only). Optional: `componentPath`, `componentName`, `componentProps`.
- `image` -- Embedded images. Props: `src` (HTTPS image URL), `altText`. For local files, copy to `.canvas/assets/` and use `https://<domain>:5904/<filename>` as `src`.
- `video` -- Embedded videos. Props: `src` (HTTPS video URL), `altText`. Local files work the same way as images via `.canvas/assets/`.

## Reading the Board: `get_canvas_state`

Returns shapes at three detail levels:

- **focusedShapes** -- Full detail for shapes near the viewport or focus area. Geo/text/note shapes include color, fill, text. Iframe shapes include `url`, `componentName`, `componentPath`. Image shapes include `src`, `altText`, and `filepath` (local file path in `.canvas/assets/`, if applicable). Video shapes include `src` and `altText`.
- **blurryShapes** -- Position and basic info for shapes farther away. Iframe shapes include only `componentName`. Image shapes include `src` and `filepath`. Video shapes include `src`.
- **peripheralClusters** -- Aggregated counts for distant shape groups.
- **summary** -- Quick text description of everything on the canvas.

Pass an optional `focus_area` (`{x, y, w, h}`) to zoom into a specific region.

Example call with no arguments (uses current viewport):

```json
{"focus_area": null}
```

Example response:

```json
{
  "focusedShapes": [
    {
      "shapeId": "box-1",
      "shapeType": "geo",
      "x": 100, "y": 100, "w": 200, "h": 150,
      "color": "blue", "fill": "solid", "text": "Frontend"
    },
    {
      "shapeId": "preview-1",
      "shapeType": "iframe",
      "x": 400, "y": 100, "w": 1280, "h": 720,
      "url": "https://<resolved-domain>.replit.dev/preview/hello-world/Card",
      "componentName": "Card",
      "componentPath": "mockup/src/components/mockups/hello-world/Card.tsx"
    }
  ],
  "blurryShapes": [
    {
      "shapeId": "distant-iframe",
      "shapeType": "iframe",
      "x": 5000, "y": 100, "w": 1280, "h": 720,
      "componentName": "Sidebar"
    }
  ],
  "peripheralClusters": [],
  "viewport": {"x": 0, "y": 0, "w": 1920, "h": 1080},
  "summary": "2 shapes on canvas.",
  "focusedOmittedCount": 0,
  "blurryOmittedCount": 0
}
```

Focused iframe shapes include `url`, `componentName`, and `componentPath`. Blurry iframe shapes only include `componentName` (no URL or path). Focused image shapes include `src`, `altText`, and `filepath`. Focused video shapes include `src` and `altText`. Blurry image shapes include `src` and `filepath`. Blurry video shapes include `src`.

## Modifying the Board: `apply_canvas_actions`

Send an ordered list of actions. Each action has a `type` field. Results are returned per-action with generated `shapeId` values.

### Create

Set a `shapeId` so you can reference the shape later.

```json
{
  "type": "create",
  "shapeId": "my-box",
  "shape": {
    "type": "geo",
    "x": 100, "y": 100, "w": 200, "h": 150,
    "color": "blue", "fill": "solid", "text": "Hello"
  }
}
```

### Create Iframe

Embed live web content. The `url` **must** use `https://`.

To get the URL for a Replit dev server, run `echo $REPLIT_DOMAINS` in the shell to get the domain, then construct the full URL. For the main app on port 5000, no port suffix is needed. For other ports, append `:<port>`.

**Always resolve the actual domain first** -- do not pass literal template strings as the iframe URL.

```json
{
  "type": "create",
  "shapeId": "app-preview",
  "shape": {
    "type": "iframe",
    "x": 0, "y": 0, "w": 1280, "h": 720,
    "url": "https://<resolved-domain>.replit.dev",
    "componentName": "App Preview"
  }
}
```

- `url` -- **Required.** Must be `https`. This is what actually loads content.
- `componentPath` -- File path shown in the title bar (metadata label only).
- `componentName` -- Display name shown in the title bar (metadata label only).
- `componentProps` -- Extra props dict merged into shape props.

**To embed individual React components** (not just the full app), you need a component preview server that renders each component at its own URL. Use the **mockup-sandbox** skill to set it up.

### Create Image

Embed an image on the canvas.

From an external URL:

```json
{
  "type": "create",
  "shapeId": "hero-image",
  "shape": {
    "type": "image",
    "x": 0, "y": 0, "w": 800, "h": 600,
    "src": "https://example.com/hero.png",
    "altText": "Hero banner image"
  }
}
```

From a local file (copy to `.canvas/assets/`, resolve domain, use port 5904):

```bash
mkdir -p .canvas/assets
cp assets/hero.png .canvas/assets/hero.png
echo $REPLIT_DOMAINS  # e.g. abc123.replit.dev
```

```json
{
  "type": "create",
  "shapeId": "hero-image",
  "shape": {
    "type": "image",
    "x": 0, "y": 0, "w": 800, "h": 600,
    "src": "https://<resolved-domain>:5904/hero.png",
    "altText": "Hero banner image"
  }
}
```

### Create Video

Embed a video on the canvas. Local files work the same way as images via `.canvas/assets/`.

From an external URL:

```json
{
  "type": "create",
  "shapeId": "demo-video",
  "shape": {
    "type": "video",
    "x": 0, "y": 0, "w": 1280, "h": 720,
    "src": "https://example.com/demo.mp4",
    "altText": "Product demo video"
  }
}
```

From a local file:

```bash
cp assets/demo.mp4 .canvas/assets/demo.mp4
```

```json
{
  "type": "create",
  "shapeId": "demo-video",
  "shape": {
    "type": "video",
    "x": 0, "y": 0, "w": 1280, "h": 720,
    "src": "https://<resolved-domain>:5904/demo.mp4",
    "altText": "Product demo video"
  }
}
```

### Update

Only include the fields you want to change. Always set `shapeType` to the shape's type (from get_canvas_state).

```json
{
  "type": "update",
  "shapeId": "my-box",
  "updates": {"shapeType": "geo", "color": "red", "text": "Updated"}
}
```

### Delete

```json
{"type": "delete", "shapeId": "my-box"}
```

### Move

```json
{"type": "move", "shapeId": "my-box", "x": 300, "y": 200}
```

### Resize

```json
{"type": "resize", "shapeId": "my-box", "w": 400, "h": 300}
```

### Reorder (Z-index)

Direction: `"front"` or `"back"`.

```json
{"type": "reorder", "shapeId": "my-box", "direction": "front"}
```

### Align

Align multiple shapes. Options: `"left"`, `"center-horizontal"`, `"right"`, `"top"`, `"center-vertical"`, `"bottom"`.

```json
{
  "type": "align",
  "shapeIds": ["box-1", "box-2", "box-3"],
  "alignment": "center-horizontal"
}
```

### Distribute

Evenly space shapes. Direction: `"horizontal"` or `"vertical"`.

```json
{
  "type": "distribute",
  "shapeIds": ["box-1", "box-2", "box-3"],
  "direction": "horizontal"
}
```

## Iframe Rules & Gotchas

- **URL must be `https`** -- `http` and `about:blank` are rejected.
- **Resolve the domain first** -- run `echo $REPLIT_DOMAINS` in the shell, then build the URL from the result. Never pass a literal template string as the URL.
- **Port rules:** no port suffix = port 5000 (main app). For other servers, append `:<port>`.
- **External sites may block embedding** -- sites with `X-Frame-Options: DENY` or restrictive CSP headers will show a blank iframe. Replit dev URLs work fine.
- **For component previews, use the mockup sandbox** -- do not embed the main app's dev server URL to preview individual components. The main app URL shows the entire app with navigation, layout, and routing — not an isolated component. Use the mockup-sandbox skill to set up a preview server, then embed `/preview/{folder}/{Component}` URLs. This gives you isolated components that can be iterated on independently.

### Placeholder Workflow

Since iframe URLs must be `https` (no `about:blank`), to plan a layout before you have real URLs:

1. Create `geo` shapes at the desired positions with labels describing what goes there.
2. Once you have the real URLs, delete the `geo` shapes.
3. Create `iframe` shapes at the same positions with the actual URLs.

## Typical Workflow

1. Call `get_canvas_state` to see what's on the board.
2. Use the `summary` and `focusedShapes` to understand positions and IDs.
3. Call `apply_canvas_actions` with a batch of changes.
4. **Communicate and offer to show** -- Tell the user what you placed and where, referencing shape names or labels so they can orient themselves. Then ask if they'd like you to focus on the new or changed shapes (e.g. "Want me to pan to the new layout?"). Don't auto-focus -- moving the viewport while the user is working is disorienting.
5. **Show on request** -- When the user confirms, call `focus_canvas_shapes` with the IDs of all relevant shapes. Use `animate_ms: 500` for a smooth transition.

## Error Codes

- `SHAPE_NOT_FOUND` -- Shape ID doesn't exist.
- `UNSUPPORTED_SHAPE_TYPE` -- Invalid shape type.
- `INVALID_PROPS` -- Bad property values (e.g., non-https iframe URL).
- `VALIDATION_FAILED` -- Shape with that ID already exists.
- `INSUFFICIENT_SHAPES` -- Not enough shapes for align/distribute.

## Best Practices

1. **Read before writing** -- Always call `get_canvas_state` before layout-sensitive changes.
2. **Set shapeId on create** -- So you can reference, update, or delete the shape later.
3. **Offer to show your work.** After creating or significantly modifying shapes, don't auto-focus the viewport -- the user may be looking at something else and sudden panning is disorienting. Instead, finish your work and ask the user if they'd like to see it (e.g. "Would you like me to focus on the new shapes?"). When the user confirms, call `focus_canvas_shapes` on the affected shape IDs with `animate_ms: 500` for smooth transitions. After a batch of creates, focus on all new shape IDs together in a single call.
4. **Batch actions** -- Group related changes in one `apply_canvas_actions` call.
5. **Use https URLs** -- Iframe shapes reject http URLs.
6. **Label iframes** -- Set `componentPath` and `componentName` so users can identify embedded content.
7. **Use focus_area** -- For large boards, pass a region to `get_canvas_state` to get detail where you need it.

### Viewport Presets

- Mobile: 390 x 844
- Tablet: 768 x 1024
- Desktop: 1280 x 720
