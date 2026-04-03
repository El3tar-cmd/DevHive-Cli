# Native Tabs

Use `expo-router/unstable-native-tabs` for platform-specific tab implementations with liquid glass on iOS 26+.

## Basic Setup with Liquid Glass (SDK 54)

```tsx
import { isLiquidGlassAvailable } from "expo-glass-effect";
import { Tabs } from "expo-router";
import { NativeTabs, Icon, Label } from "expo-router/unstable-native-tabs";
import { BlurView } from "expo-blur";
import { Platform, StyleSheet, useColorScheme, View } from "react-native";
import { SymbolView } from "expo-symbols";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";

function NativeTabLayout() {
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="index">
        <Icon sf={{ default: "house", selected: "house.fill" }} />
        <Label>Home</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="profile">
        <Icon sf={{ default: "person", selected: "person.fill" }} />
        <Label>Profile</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

function ClassicTabLayout() {
  const colors = useColors();
  const colorScheme = useColorScheme();
  const safeAreaInsets = useSafeAreaInsets();
  const isDark = colorScheme === "dark";
  const isIOS = Platform.OS === "ios";
  const isWeb = Platform.OS === "web";

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedForeground,
        tabBarStyle: {
          position: "absolute",
          backgroundColor: isIOS ? "transparent" : colors.background,
          borderTopWidth: isWeb ? 1 : 0,
          borderTopColor: colors.border,
          elevation: 0,
          paddingBottom: safeAreaInsets.bottom,
          ...(isWeb ? { height: 84 } : {}),
        },
        tabBarBackground: () =>
          isIOS ? (
            <BlurView
              intensity={100}
              tint={isDark ? "dark" : "light"}
              style={StyleSheet.absoluteFill}
            />
          ) : isWeb ? (
            <View
              style={[
                StyleSheet.absoluteFill,
                { backgroundColor: colors.background },
              ]}
            />
          ) : null,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="house" tintColor={color} size={24} />
            ) : (
              <Feather name="home" size={22} color={color} />
            ),
        }}
      />
    </Tabs>
  );
}

export default function TabLayout() {
  if (isLiquidGlassAvailable()) {
    return <NativeTabLayout />;
  }
  return <ClassicTabLayout />;
}
```

## Key Rules

- Each tab needs a trigger with name matching the route exactly
- Prefer search tab to be last so it can combine with the search bar
- Android enforces a five-tab maximum per Material Design specs
- Native tabs cannot nest within other native tabs
- On web, set `height: 84` to `tabBarStyle` for a bottom inset

## SDK 54 Imports

SDK 54 requires importing `Icon`, `Label`, `Badge` as separate exports:

```tsx
import { NativeTabs, Icon, Label, Badge } from "expo-router/unstable-native-tabs";
```

## Icon Configuration

```tsx
// SF Symbol with selected state
<Icon sf={{ default: "house", selected: "house.fill" }} />

// With Android drawable fallback
<Icon sf="house.fill" drawable="ic_home" />

// With Material icon for Android
<Icon sf="house.fill" md="home" />

// Custom image
<Icon src={require('./icon.png')} />
```

## Platform Features

**iOS 26+**: Liquid glass effects with system-native appearance via `NativeTabs`
**Pre-iOS 26**: BlurView background fallback via classic `Tabs`
**Android**: Material 3 bottom navigation
**Web**: Requires explicit handling - defaults to white background if not configured

## Web Platform Handling

Web doesn't support BlurView and gets undefined values from `Platform.select()` if not explicitly included. Always handle web in `ClassicTabLayout`:

```tsx
function ClassicTabLayout() {
  const colors = useColors();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const isWeb = Platform.OS === "web";
  const isIOS = Platform.OS === "ios";

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedForeground,
        tabBarStyle: {
          position: "absolute",
          backgroundColor: isIOS ? "transparent" : colors.background,
          borderTopWidth: isWeb ? 1 : 0,
          borderTopColor: colors.border,
          elevation: 0,
          ...(isWeb ? { height: 84 } : {})
        },
        tabBarBackground: () =>
          isIOS ? (
            <BlurView intensity={100} tint={isDark ? "dark" : "light"} style={StyleSheet.absoluteFill} />
          ) : isWeb ? (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.background }]} />
          ) : null,
      }}
    >
      {/* tabs */}
    </Tabs>
  );
}
```

**Key points:**

- Use explicit `Platform.OS` checks instead of `Platform.select()` to ensure web is handled
- Web needs a solid `View` background since BlurView doesn't work
- Set `tabBarActiveTintColor` and `tabBarInactiveTintColor` from `useColors()` tokens — do not hardcode hex values
- Add `borderTopWidth: 1` on web for visual separation
- Add `height: 84` on web to inset the tab bar content
- **`SymbolView` only renders on iOS** - use a `Platform.OS === "ios"` ternary with `Feather` from `@expo/vector-icons` for tab icons on web/Android

## Search Tab

```tsx
<NativeTabs.Trigger name="search" role="search">
  <Icon sf="magnifyingglass" />
  <Label>Search</Label>
</NativeTabs.Trigger>
```

## Badges

```tsx
<NativeTabs.Trigger name="notifications">
  <Icon sf="bell.fill" />
  <Label>Alerts</Label>
  <Badge>5</Badge>
</NativeTabs.Trigger>
```

## Content Insets

**NativeTabs automatically handles bottom insets** - do NOT manually add tab bar padding.

- **iOS**: ScrollViews have automatic content inset adjustment
- **Android**: Content is wrapped in SafeAreaView with bottom inset

**DO NOT use `useBottomTabBarHeight()`** with NativeTabs - it throws an error.

Best approach - use automatic inset adjustment:

```tsx
<ScrollView contentInsetAdjustmentBehavior="automatic">
  {/* content - no manual padding needed */}
</ScrollView>
```

This works for both NativeTabs and classic Tabs.
