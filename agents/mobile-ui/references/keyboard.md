# Keyboard Handling in Expo

Use `react-native-keyboard-controller` for all keyboard handling. It provides better control than React Native's built-in KeyboardAvoidingView and works consistently across iOS and Android.

## Quick Reference

- **Forms with multiple inputs**: Use `KeyboardAwareScrollViewCompat` with `bottomOffset`, `keyboardShouldPersistTaps="handled"`
- **FlatList with inputs in items**: Use `FlatList` + `renderScrollComponent={(props) => <KeyboardAwareScrollView {...props} />}`
- **Chat/messaging apps**: Use `KeyboardAvoidingView` + `FlatList` with `behavior="padding"` (on KAV), `keyboardShouldPersistTaps="handled"` (on FlatList)
- **Single input (search, comment)**: Use `KeyboardAvoidingView` with `behavior="padding"`

## Setup

The Expo v4 template comes with `react-native-keyboard-controller` pre-installed and `KeyboardProvider` already wrapped in the root layout. No additional setup needed.

If you need to verify the setup, check that `_layout.tsx` has:

```tsx
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

// GestureHandlerRootView must be outermost, KeyboardProvider inside
<GestureHandlerRootView>
  <KeyboardProvider>
    {/* Your app */}
  </KeyboardProvider>
</GestureHandlerRootView>
```

## Forms: KeyboardAwareScrollViewCompat

Use `KeyboardAwareScrollViewCompat` for screens with multiple text inputs (login, signup, profile edit, settings). It automatically scrolls to keep the focused input visible and falls back to ScrollView on web.

```tsx
import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';
```

### Complete Form Example

```tsx
import { View, TextInput, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';

export default function LoginScreen() {
  const insets = useSafeAreaInsets();

  return (
    <KeyboardAwareScrollViewCompat
      style={styles.container}
      contentContainerStyle={{
        paddingTop: insets.top + 20,
        paddingBottom: insets.bottom + 20,
        paddingHorizontal: 16,
      }}
      bottomOffset={20}
    >
      <TextInput
        placeholder="Email"
        keyboardType="email-address"
        autoCapitalize="none"
        style={styles.input}
      />
      <TextInput
        placeholder="Password"
        secureTextEntry
        style={styles.input}
      />
      <TextInput
        placeholder="Confirm Password"
        secureTextEntry
        style={styles.input}
      />
      {/* Submit button */}
    </KeyboardAwareScrollViewCompat>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
});
```

### Key Props

- `bottomOffset` (default 0): Extra space below focused input
- `keyboardShouldPersistTaps` (default "handled"): Allow tapping buttons while keyboard open
- `enabled` (default true): Enable/disable keyboard avoidance

### bottomOffset

Use `bottomOffset` to add extra space below the focused input when keyboard opens.

- **Form with submit button below inputs**: Height of button + spacing (e.g., `60`)
- **Form ending at screen bottom**: `20` (breathing room)
- **Form with tab bar**: Not needed (tab bar hides with keyboard)

## FlatList with Inputs: renderScrollComponent

When you have a FlatList/SectionList where **list items contain TextInputs** (settings forms, editable lists, dynamic forms), use `renderScrollComponent` to wrap the list with keyboard awareness:

```tsx
import { FlatList } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';

// Basic usage
<FlatList
  data={items}
  renderItem={renderItem}
  renderScrollComponent={(props) => <KeyboardAwareScrollView {...props} />}
/>
```

### With FlashList or Libraries Requiring Refs

For libraries that need refs (like FlashList), use `forwardRef`:

```tsx
import { forwardRef } from 'react';
import { ScrollView, ScrollViewProps } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';

const RenderScrollComponent = forwardRef<ScrollView, ScrollViewProps>(
  (props, ref) => <KeyboardAwareScrollView {...props} ref={ref} />,
);

<FlashList
  data={items}
  renderItem={renderItem}
  renderScrollComponent={RenderScrollComponent}
/>
```

**When to use this pattern:**

- Settings screens with inline text inputs
- Editable lists where each item has an input
- Dynamic forms rendered as list items
- Any virtualized list containing focusable inputs

**When NOT to use this pattern:**

- Chat apps (input is outside the list) - use `KeyboardAvoidingView` instead
- Static forms (not virtualized) - use `KeyboardAwareScrollViewCompat` instead

## Chat: KeyboardAvoidingView

For chat/messaging screens, wrap your screen in `KeyboardAvoidingView` to keep the input above the keyboard:

```tsx
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';

<KeyboardAvoidingView
  style={{ flex: 1 }}
  behavior="padding"
  keyboardVerticalOffset={0}
>
  <FlatList ... />
  <View style={{ paddingBottom: insets.bottom }}>
    <ChatInput />
  </View>
</KeyboardAvoidingView>
```

### keyboardVerticalOffset Calculation

The offset depends on your header configuration:

- **No header (`headerShown: false`)**: offset `0` - Content starts from screen top
- **Transparent header (default in Expo Router)**: offset `0` - Content renders behind header
- **Opaque header**: offset `headerHeight` - Content starts below header

### Key Props for Chat FlatList

```tsx
<FlatList
  keyboardDismissMode="interactive"      // Dismiss as user scrolls
  keyboardShouldPersistTaps="handled"    // Allow tapping buttons with keyboard open
/>
```

To keep keyboard open after sending a message, refocus the input:

```tsx
<Pressable onPress={() => {
  handleSend();
  inputRef.current?.focus();
}}>
```

## Platform Differences

- **iOS**: Use `behavior="padding"` - Smooth keyboard animation
- **Android**: Use `behavior="padding"` - Works well with keyboard-controller
- **Web**: Fallback to ScrollView - Keyboards vary by device

With `react-native-keyboard-controller`, you can use `behavior="padding"` consistently on both platforms. The library normalizes behavior differences.

## Keyboard Utilities

### Dismissing the Keyboard

```tsx
import { Keyboard } from 'react-native';

// Programmatic dismiss
Keyboard.dismiss();

// Dismiss on tap outside (wrap screen in Pressable)
<Pressable onPress={Keyboard.dismiss} style={{ flex: 1 }}>
  {/* Screen content */}
</Pressable>

// Dismiss on scroll (FlatList/ScrollView)
<FlatList keyboardDismissMode="interactive" />  // Dismisses as you scroll
<FlatList keyboardDismissMode="on-drag" />      // Dismisses when drag starts
```

### Detecting Keyboard Visibility

```tsx
import { useKeyboardHandler } from 'react-native-keyboard-controller';
import { useSharedValue } from 'react-native-reanimated';

function MyComponent() {
  const keyboardHeight = useSharedValue(0);

  useKeyboardHandler({
    onMove: (e) => {
      'worklet';
      keyboardHeight.value = e.height;
    },
  });

  // Use keyboardHeight.value in animated styles
}
```

### Simple Keyboard Visibility Hook

```tsx
import { useEffect, useState } from 'react';
import { Keyboard, Platform } from 'react-native';

export function useKeyboardVisible() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, () => setIsVisible(true));
    const hideSub = Keyboard.addListener(hideEvent, () => setIsVisible(false));

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  return isVisible;
}
```

## Common Pitfalls

### Never Use InputAccessoryView in Expo Go

`InputAccessoryView` doesn't render properly in Expo Go. Use `KeyboardAvoidingView` with proper offset instead.

### Never Nest KeyboardAvoidingViews

Only one `KeyboardAvoidingView` should wrap your content. Nesting causes unpredictable behavior.

```tsx
// WRONG
<KeyboardAvoidingView>
  <KeyboardAvoidingView>
    <TextInput />
  </KeyboardAvoidingView>
</KeyboardAvoidingView>

// CORRECT
<KeyboardAvoidingView>
  <View>
    <TextInput />
  </View>
</KeyboardAvoidingView>
```

### Wrong keyboardVerticalOffset

If content is cut off or there's extra space:

- Transparent header: offset should be `0`
- Opaque header: offset should equal `headerHeight`
- No header: offset should be `0`

## Troubleshooting

- **Keyboard covers input**: Missing KeyboardAvoidingView → Wrap screen in KeyboardAvoidingView
- **Content jumps when keyboard opens**: Wrong `behavior` prop → Use `behavior="padding"`
- **Extra space above keyboard**: Wrong `keyboardVerticalOffset` → Check header type and adjust offset
- **Input hidden behind tab bar**: Not accounting for tab bar → Use `insets.bottom` for input container padding
- **Taps don't work with keyboard open**: Missing `keyboardShouldPersistTaps` → Add `keyboardShouldPersistTaps="handled"`
- **Keyboard doesn't dismiss on scroll**: Missing `keyboardDismissMode` → Add `keyboardDismissMode="interactive"`
- **Keyboard dismisses on send**: Input loses focus on button press → Use `inputRef.current?.focus()` after send
