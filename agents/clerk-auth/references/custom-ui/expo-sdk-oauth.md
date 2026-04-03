# Build a custom flow for authenticating with OAuth connections with Expo SDK

## Build the custom flow

The following example **will both sign up _and_ sign in users**, eliminating the need for a separate sign-up page.

The following example:

1. Uses the `useSSO()` hook to access the `startSSOFlow()` method.
1. Calls the `startSSOFlow()` method with the `strategy` param set to `oauth_google`, but you can use any of the supported OAuth strategies. The optional `redirect_url` param is also set in order to redirect the user once they finish the authentication flow.
   - If authentication is successful, the `setActive()` method is called to set the active session with the new `createdSessionId`.
   - If authentication is not successful, you can handle the missing requirements, such as MFA, using the `signIn` or `signUp` object returned from `startSSOFlow()`, depending on if the user is signing in or signing up. These objects include properties, like `status`, that can be used to determine the next steps. See the respective linked references for more information.

```tsx {{ filename: 'app/(auth)/sign-in.tsx', collapsible: true }}
import React, { useCallback, useEffect } from 'react'
import * as WebBrowser from 'expo-web-browser'
import * as AuthSession from 'expo-auth-session'
import { useSSO } from '@clerk/expo'
import { useRouter } from 'expo-router'
import { View, Button, Platform } from 'react-native'

// Preloads the browser for Android devices to reduce authentication load time
// See: https://docs.expo.dev/guides/authentication/#improving-user-experience
export const useWarmUpBrowser = () => {
  useEffect(() => {
    if (Platform.OS !== 'android') return
    void WebBrowser.warmUpAsync()
    return () => {
      // Cleanup: closes browser when component unmounts
      void WebBrowser.coolDownAsync()
    }
  }, [])
}

// Handle any pending authentication sessions
WebBrowser.maybeCompleteAuthSession()

export default function Page() {
  useWarmUpBrowser()

  // Use the `useSSO()` hook to access the `startSSOFlow()` method
  const { startSSOFlow } = useSSO()
  const router = useRouter()

  const onPress = useCallback(async () => {
    try {
      // Start the authentication process by calling `startSSOFlow()`
      const { createdSessionId, setActive, signIn, signUp } = await startSSOFlow({
        strategy: 'oauth_google',
        // For web, defaults to current path
        // For native, you must pass a scheme, like AuthSession.makeRedirectUri({ scheme, path })
        // For more info, see https://docs.expo.dev/versions/latest/sdk/auth-session/#authsessionmakeredirecturioptions
        redirectUrl: AuthSession.makeRedirectUri(),
      })

      // If sign in was successful, set the active session
      if (createdSessionId) {
        setActive!({
          session: createdSessionId,
          // Handle session tasks
          // See https://clerk.com/docs/guides/development/custom-flows/authentication/session-tasks
          navigate: async ({ session, decorateUrl }) => {
            if (session?.currentTask) {
              console.log(session?.currentTask)
              return
            }

            router.push(decorateUrl('/'))
          },
        })
      } else {
        // If there is no `createdSessionId`,
        // there are missing requirements, such as MFA
        // See https://clerk.com/docs/guides/development/custom-flows/authentication/oauth-connections#handle-missing-requirements
      }
    } catch (err) {
      // See https://clerk.com/docs/guides/development/custom-flows/error-handling
      // for more info on error handling
      console.error(JSON.stringify(err, null, 2))
    }
  }, [])

  return (
    <View>
      <Button title="Sign in with Google" onPress={onPress} />
    </View>
  )
}
```

## Handle missing requirements

Depending on your instance settings, users might need to provide extra information before their sign-up can be completed, such as when a username or accepting legal terms is required. In these cases, the `SignUp` object returns a status of `"missing_requirements"` along with a `missingFields` array. You can create a "Continue" page to collect these missing fields and complete the sign-up flow. Handling the missing requirements will depend on your instance settings. For example, if your instance settings require a phone number, you will need to handle verifying the phone number.

```tsx {{ filename: 'app/(auth)/continue.tsx' }}
import { useState } from 'react'
import { useSignUp } from '@clerk/expo'
import { type Href, useRouter } from 'expo-router'
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native'

function snakeToCamel(str: string | undefined): string {
  return str
    ? str.replace(/([-_][a-z])/g, (match) => match.toUpperCase().replace(/-|_/, ''))
    : ''
}

export default function ContinueSignUp() {
  const router = useRouter()
  // Use `useSignUp()` hook to access the `SignUp` object
  // `missing_requirements` and `missingFields` are only available on the `SignUp` object
  const { signUp } = useSignUp()
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({})

  const handleSubmit = async () => {
    // Update the `SignUp` object with the missing fields
    // The logic that goes here will depend on your instance settings
    // E.g. if your app requires a phone number, you will need to collect and verify it here
    await signUp.update(fieldValues)
    if (signUp.status === 'complete') {
      await signUp.finalize({
        navigate: async ({ session, decorateUrl }) => {
          if (session?.currentTask) {
            // Handle session tasks
            // See https://clerk.com/docs/guides/development/custom-flows/authentication/session-tasks
            console.log(session?.currentTask)
            return
          }

          const url = decorateUrl('/')
          router.push(url as Href)
        },
      })
    }
  }

  if (signUp.status === 'missing_requirements') {
    // For simplicity, all missing fields in this example are text inputs.
    // In a real app, you might want to handle them differently:
    // - legal_accepted: Switch component
    // - username: text with validation
    // - phone_number: phone input, etc.
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Continue sign-up</Text>
        {signUp.missingFields.map((field) => (
          <View key={field} style={styles.field}>
            <Text style={styles.label}>{field}</Text>
            <TextInput
              style={styles.input}
              value={fieldValues[snakeToCamel(field)] || ''}
              onChangeText={(text) =>
                setFieldValues((prev) => ({ ...prev, [snakeToCamel(field)]: text }))
              }
              placeholder={`Enter ${field}`}
            />
          </View>
        ))}

        {/* Required for sign-up flows
        Clerk's bot sign-up protection is enabled by default */}
        <View nativeID="clerk-captcha" />

        <Pressable style={styles.button} onPress={handleSubmit}>
          <Text style={styles.buttonText}>Submit</Text>
        </Pressable>
      </View>
    )
  }

  // Handle other statuses if needed
  return (
    <>
      {/* Required for sign-up flows
      Clerk's bot sign-up protection is enabled by default */}
      <View nativeID="clerk-captcha" />
    </>
  )
}
```
