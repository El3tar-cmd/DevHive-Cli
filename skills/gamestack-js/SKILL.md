---
name: gamestack-js
description: Guidelines for building 2D/3D games using React Three Fiber, covering setup, physics, controls, textures, and game loop best practices.
---

Always follow these guidelines when building a JavaScript game:

This stack supports simple JavaScript game development for 2D/3D games and simulation projects.

## Initial Setup

- Create a basic @react-three/fiber scene with just a camera, renderer, and lighting
- Begin with a flat plane for terrain
- Use simple directional lighting

## Simplified Collision Detection

- Start with basic AABB (Axis-Aligned Bounding Box) collision
- Use simple box geometries for all collision objects
- Keep collision response minimal

## Minimal Physics

- Skip unnecessary and complicated physics like air resistance, and input buffering
- Use a simplified movement system that only handles the basics
- Do not use any physics library like Cannon/Rapier unless it is mentioned by name

## Character and Objects

- Represent the player and NPCs as colored boxes
- Implement basic movement for the player and NPCs

## Movement System

Use DREI keyboard controls for movement.

### Basic Setup

```tsx
// Define your controls as an enum
enum Controls {
  forward = 'forward',
  back = 'back',
  left = 'left',
  right = 'right',
  jump = 'jump',
}
// In your main component
function Game() {
  // Define key mappings
  const keyMap = [
    { name: Controls.forward, keys: ['ArrowUp', 'KeyW'] },
    { name: Controls.back, keys: ['ArrowDown', 'KeyS'] },
    { name: Controls.left, keys: ['ArrowLeft', 'KeyA'] },
    { name: Controls.right, keys: ['ArrowRight', 'KeyD'] },
    { name: Controls.jump, keys: ['Space'] },
  ];
  return (
    <KeyboardControls map={keyMap}>
      <YourGameComponent />
    </KeyboardControls>
  );
}
```

### Using Controls - Reactive (For UI or simple logic)

```tsx
function PlayerComponent() {
  // This will re-render when forward key is pressed
  const forwardPressed = useKeyboardControls<Controls>(state => state.forward);

  return (
    <div>
      {forwardPressed ? "Moving forward!" : "Standing still"}
    </div>
  );
}
```

### Using Controls - Game Loop (No re-renders)

```tsx
function PlayerMovement() {
  const [subscribe, getState] = useKeyboardControls<Controls>();

  // Subscribe to changes
  useEffect(() => {
    // Clean up automatically when component unmounts
    return subscribe(
      state => state.forward,
      isPressed => console.log("Forward key:", isPressed)
    );
  }, []);

  // Use in game loop
  useFrame(() => {
    // Get current state without causing re-renders
    const controls = getState();

    if (controls.forward) moveForward();
    if (controls.jump) jump();
    // etc...
  });

  return null;
}
```

## Physics

1. For bullet detection, use a hit radius of 1 units and ensure bullets have unique IDs with normalized direction vectors for consistent speed.
2. Ensure they move fast and the physics is correct.
3. Make bullets visually prominent by sizing correctly in your render function.
4. Implement comprehensive debug logging for bullets and enemies to track game state during development.

## Textures

- Textures are available in the `client/public/textures` folder and should be used in the following manner: `useTexture("/textures/asphalt.png");` by the client.
- Always search for existing textures before generating new ones.
- IMPORTANT! Do NOT use any textures except the ones in the `client/public/textures` folder. For example, using a non-existing texture such as the following will not work:

    ```tsx
    const texture = useTexture("/textures/sun.png") or useTexture("/textures/car.jpg"); // this will not work as it doesn't exist
    ```

  Similarly, referencing a texture anywhere else in the code that tries use it will not work.

    ```json
    {
      "texture": "/textures/exotic_planet.jpg" // this will not work as it doesn't exist
    }
    ```

- If no suitable textures are listed in the directory, its okay to not use a texture.

## Basic Camera

- Start with a simple follow camera

## Game Loop

- Implement a simple update/render loop
- Focus on getting the basic functional game working

## Sounds and Music

- Some sample sounds are provided. Always use them.
- Never generate base64 sounds.

## Background Components (Like trees, rocks, etc.)

- Never use `Math.random()` directly in JSX or render methods
- Pre-calculate random values outside of render
- Use React hooks like `useState`, `useEffect`, and `useMemo` to manage random values

## Text and Game UI

- For all UI components, either use dark backgrounds with light text or light backgrounds with dark text to ensure readability against any background.

## Important Rules

0. Correctly import `import * as THREE from "three"` where needed.
1. Ensure that the character movement is in the right direction (for instance moving toward the camera is incorrect).
2. Ensure that the Game UI is visible over game backgrounds.
3. Ensure that objects interact with each other correctly. For example, cars and other objects should be able to drive/move on terrain and not sink into the ground. Common sense should prevail.
4. Ensure that game states work correctly, the game shouldn't crash immediately on starting.
5. Ensure that initial camera position shows all the necessary components of the game.
6. Ensure that keyboard controls are compatible with the game controls and are functional. Add logging to ensure that the controls are working.
7. Before generating new 3D models, double-check your existing ones. Only re-generate existing models if you're absolutely convinced it's necessary, as this process is expensive and time-consuming.
