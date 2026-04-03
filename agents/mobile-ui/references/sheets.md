# Sheets and Modals in Expo Router

This skill covers sheet and modal presentations for focused tasks, multi-step flows, and quick actions.

## Choosing the Right Presentation

- **`formSheet`**: Use for single screen, no nested navigation. Appears as partial card from bottom with detents.
- **`modal`**: Use for multi-step flows with nested Stack. Appears as full-screen overlay.

**Important:** `formSheet` has a known bug where content inside nested navigation renders with zero height. Use `modal` for any flow requiring navigation between screens (auth flows, wizards, etc.).

## Simple Sheets (formSheet)

Use for single-screen presentations without nested navigation:

- Quick confirmations
- Settings panels (single screen)
- Share menus
- Action sheets

```tsx
// app/_layout.tsx
import { Stack } from "expo-router";

export default function Layout() {
  return (
    <Stack>
      <Stack.Screen name="index" />
      <Stack.Screen
        name="confirm"
        options={{
          presentation: "formSheet",
          sheetAllowedDetents: [0.25],
          sheetGrabberVisible: true,
          contentStyle: { backgroundColor: "transparent" },
        }}
      />
    </Stack>
  );
}
```

```tsx
// app/confirm.tsx
export default function ConfirmSheet() {
  return (
    <View style={{ flex: 1 }}>
      <View style={{ flex: 1, padding: 24, alignItems: "center", justifyContent: "center" }}>
        <Text style={{ fontSize: 18, fontWeight: "600" }}>Confirm Action</Text>
        <Text style={{ color: "#666" }}>Are you sure?</Text>
      </View>
      <View style={{ flexDirection: "row", padding: 16, gap: 12 }}>
        <Pressable style={styles.cancelBtn} onPress={() => router.back()}>
          <Text>Cancel</Text>
        </Pressable>
        <Pressable style={styles.confirmBtn} onPress={handleConfirm}>
          <Text style={{ color: "white" }}>Confirm</Text>
        </Pressable>
      </View>
    </View>
  );
}
```

### Sheet Options

- `sheetAllowedDetents` (number[]): Height stops (0-1 range), e.g., `[0.5, 1]`
- `sheetGrabberVisible` (boolean): Shows drag handle at top
- `sheetExpandsWhenScrolledToEdge` (boolean, default true): Expand when scrolling to edge
- `contentStyle` (object): Container styles; use transparent for glass effect

### Common Detent Configurations

```tsx
sheetAllowedDetents: [0.25]        // Quarter - compact actions
sheetAllowedDetents: [0.5]         // Half - forms, settings
sheetAllowedDetents: [0.75]        // Three-quarter - detailed content
sheetAllowedDetents: [0.5, 1]      // Expandable - starts half, can go full
```

## Multi-Step Flows (modal)

For flows with navigation between screens (Login → Register → Forgot Password), use `modal` presentation with a nested Stack:

```text
app/
  _layout.tsx              ← Root stack, presents (auth) as modal
  index.tsx
  (auth)/
    _layout.tsx            ← Nested stack for auth flow
    login.tsx
    register.tsx
    forgot-password.tsx
```

### Root Layout - Present as Modal

```tsx
// app/_layout.tsx
import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: "Home" }} />
      <Stack.Screen
        name="(auth)"
        options={{
          presentation: "modal",
          headerShown: false,
        }}
      />
    </Stack>
  );
}
```

### Nested Auth Stack

```tsx
// app/(auth)/_layout.tsx
import { Stack } from "expo-router";

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerBackButtonDisplayMode: "minimal",
      }}
    >
      <Stack.Screen name="login" options={{ title: "Sign In" }} />
      <Stack.Screen name="register" options={{ title: "Create Account" }} />
      <Stack.Screen name="forgot-password" options={{ title: "Reset Password" }} />
    </Stack>
  );
}
```

### Navigating Within the Modal

```tsx
// app/(auth)/login.tsx
import { View, Text, Pressable, TextInput, StyleSheet } from "react-native";
import { Link, router } from "expo-router";

export default function LoginScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Welcome Back</Text>

        <TextInput style={styles.input} placeholder="Email" />
        <TextInput style={styles.input} placeholder="Password" secureTextEntry />

        <Pressable style={styles.primaryButton}>
          <Text style={styles.primaryText}>Sign In</Text>
        </Pressable>

        <Link href="/(auth)/forgot-password" asChild>
          <Pressable>
            <Text style={styles.link}>Forgot password?</Text>
          </Pressable>
        </Link>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Don't have an account?</Text>
        <Link href="/(auth)/register" asChild>
          <Pressable>
            <Text style={styles.link}>Sign Up</Text>
          </Pressable>
        </Link>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, padding: 24, gap: 16 },
  title: { fontSize: 28, fontWeight: "700", marginBottom: 8 },
  input: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#f5f5f5",
    fontSize: 16,
  },
  primaryButton: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#007AFF",
    alignItems: "center",
  },
  primaryText: { color: "white", fontSize: 16, fontWeight: "600" },
  link: { color: "#007AFF", fontSize: 14 },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    padding: 24,
    gap: 4,
  },
  footerText: { color: "#666", fontSize: 14 },
});
```

## Dismissing

```tsx
import { router } from "expo-router";

// Go back one screen (within nested stack)
router.back();

// Dismiss entire modal and return to root
router.dismissAll();

// Replace current screen (no back button to previous)
router.replace("/(auth)/register");
```

## Liquid Glass Effect (iOS 26+)

For simple sheets, set transparent background for automatic glass effect:

```tsx
<Stack.Screen
  name="sheet"
  options={{
    presentation: "formSheet",
    contentStyle: { backgroundColor: "transparent" },
    headerTransparent: true,
  }}
/>
```

## Known Issues

### formSheet + nested navigation = blank screen

Content inside `formSheet` renders with zero height when using nested Stack navigation. This is a bug in react-native-screens.

**Solution:** Use `presentation: "modal"` instead of `formSheet` for any flow with nested navigation.

### Content not filling sheet

Ensure root View has `flex: 1`.

### Header not showing in nested screens

Set `headerShown: false` on the modal's Stack.Screen, and configure headers in the nested layout instead.
