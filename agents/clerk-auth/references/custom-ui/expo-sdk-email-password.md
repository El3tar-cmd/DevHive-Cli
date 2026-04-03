# Build a custom email/password authentication flow with Expo SDK

This guide demonstrates how to build a custom user interface for signing up and signing in using email and password.

## Sign-up flow

First, understand that the `useSignUp()` hook returns an object with the following properties:

- `signUp`: The `SignUpFuture` object. Use this to initiate the sign-up process and check the current state of the sign-up attempt.
- `errors`: The `Errors` object that contains the errors that occurred during the last API request. You can use this to display errors to the user in your custom UI.
- `fetchStatus`: The fetch status of the underlying `SignUpFuture` resource. You can use this to display a loading state or disable buttons while the request is in progress.

Then, to sign up a user using their email and password, and verify their sign-up with an email verification code, you must:

1. Initiate the sign-up process by collecting the user's email address and password with the `signUp.password()` method.
1. Send a one-time code to the provided email address with the `signUp.verifications.sendEmailCode()` method.
1. Collect the user's one-time code and verify it with the `signUp.verifications.verifyEmailCode()` method.
1. If the email address verification is successful, the `signUp.status` will be `complete`, and you can finish the sign-up flow with the `signUp.finalize()` method to set the newly created session as the active session.

In the `(auth)` group, create a `sign-up.tsx` file with the following code. The `useSignUp()` hook is used to create a sign-up flow. The user can sign up using their email and password and will receive an email verification code to confirm their email.

```tsx {{ filename: 'app/(auth)/sign-up.tsx', collapsible: true }}
import { ThemedText } from '@/components/themed-text'
import { ThemedView } from '@/components/themed-view'
import { useAuth, useSignUp } from '@clerk/expo'
import { type Href, Link, useRouter } from 'expo-router'
import React from 'react'
import { Pressable, StyleSheet, TextInput, View } from 'react-native'

export default function Page() {
  const { signUp, errors, fetchStatus } = useSignUp()
  const { isSignedIn } = useAuth()
  const router = useRouter()

  const [emailAddress, setEmailAddress] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [code, setCode] = React.useState('')

  const handleSubmit = async () => {
    const { error } = await signUp.password({
      emailAddress,
      password,
    })
    if (error) {
      console.error(JSON.stringify(error, null, 2))
      return
    }

    if (!error) await signUp.verifications.sendEmailCode()
  }

  const handleVerify = async () => {
    await signUp.verifications.verifyEmailCode({
      code,
    })
    if (signUp.status === 'complete') {
      await signUp.finalize({
        // Redirect the user to the home page after signing up
        navigate: ({ session, decorateUrl }) => {
          if (session?.currentTask) {
            // Handle pending session tasks
            // See https://clerk.com/docs/guides/development/custom-flows/authentication/session-tasks
            console.log(session?.currentTask)
            return
          }

          const url = decorateUrl('/')
          if (url.startsWith('http')) {
            window.location.href = url
          } else {
            router.push(url as Href)
          }
        },
      })
    } else {
      // Check why the sign-up is not complete
      console.error('Sign-up attempt not complete:', signUp)
    }
  }

  if (signUp.status === 'complete' || isSignedIn) {
    return null
  }

  if (
    signUp.status === 'missing_requirements' &&
    signUp.unverifiedFields.includes('email_address') &&
    signUp.missingFields.length === 0
  ) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText type="title" style={styles.title}>
          Verify your account
        </ThemedText>
        <TextInput
          style={styles.input}
          value={code}
          placeholder="Enter your verification code"
          placeholderTextColor="#666666"
          onChangeText={(code) => setCode(code)}
          keyboardType="numeric"
        />
        {errors.fields.code && (
          <ThemedText style={styles.error}>{errors.fields.code.message}</ThemedText>
        )}
        <Pressable
          style={({ pressed }) => [
            styles.button,
            fetchStatus === 'fetching' && styles.buttonDisabled,
            pressed && styles.buttonPressed,
          ]}
          onPress={handleVerify}
          disabled={fetchStatus === 'fetching'}
        >
          <ThemedText style={styles.buttonText}>Verify</ThemedText>
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.secondaryButton, pressed && styles.buttonPressed]}
          onPress={() => signUp.verifications.sendEmailCode()}
        >
          <ThemedText style={styles.secondaryButtonText}>I need a new code</ThemedText>
        </Pressable>
      </ThemedView>
    )
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.title}>
        Sign up
      </ThemedText>

      <ThemedText style={styles.label}>Email address</ThemedText>
      <TextInput
        style={styles.input}
        autoCapitalize="none"
        value={emailAddress}
        placeholder="Enter email"
        placeholderTextColor="#666666"
        onChangeText={(emailAddress) => setEmailAddress(emailAddress)}
        keyboardType="email-address"
      />
      {errors.fields.emailAddress && (
        <ThemedText style={styles.error}>{errors.fields.emailAddress.message}</ThemedText>
      )}
      <ThemedText style={styles.label}>Password</ThemedText>
      <TextInput
        style={styles.input}
        value={password}
        placeholder="Enter password"
        placeholderTextColor="#666666"
        secureTextEntry={true}
        onChangeText={(password) => setPassword(password)}
      />
      {errors.fields.password && (
        <ThemedText style={styles.error}>{errors.fields.password.message}</ThemedText>
      )}
      <Pressable
        style={({ pressed }) => [
          styles.button,
          (!emailAddress || !password || fetchStatus === 'fetching') && styles.buttonDisabled,
          pressed && styles.buttonPressed,
        ]}
        onPress={handleSubmit}
        disabled={!emailAddress || !password || fetchStatus === 'fetching'}
      >
        <ThemedText style={styles.buttonText}>Sign up</ThemedText>
      </Pressable>
      {/* For your debugging purposes. You can just console.log errors, but we put them in the UI for convenience */}
      {errors && <ThemedText style={styles.debug}>{JSON.stringify(errors, null, 2)}</ThemedText>}

      <View style={styles.linkContainer}>
        <ThemedText>Already have an account? </ThemedText>
        <Link href="/sign-in">
          <ThemedText type="link">Sign in</ThemedText>
        </Link>
      </View>

      {/* Required for sign-up flows. Clerk's bot sign-up protection is enabled by default */}
      <View nativeID="clerk-captcha" />
    </ThemedView>
  )
}
```

## Sign-in flow

First, understand that the `useSignIn()` hook returns an object with the following properties:

- `signIn`: The `SignInFuture` object. Use this to initiate the sign-in process and check the current state of the sign-in attempt.
- `errors`: The `Errors` object that contains the errors that occurred during the last API request. You can use this to display errors to the user in your custom UI.
- `fetchStatus`: The fetch status of the underlying `SignInFuture` resource. You can use this to display a loading state or disable buttons while the request is in progress.

Then, to sign in a user using their email and password, you must:

1. Initiate the sign-in process by collecting the user's email address and password with the `signIn.password()` method.
1. If the `signIn.status` is `'needs_second_factor'`, the user has MFA enabled. See the MFA custom flow guide for how to handle this status. If the status is `'needs_client_trust'`, see the Client Trust custom flow guide.
1. If the `signIn.status` is `'complete'`, finish the sign-in flow with the `signIn.finalize()` method to set the newly created session as the active session.

In the `(auth)` group, create a `sign-in.tsx` file with the following code. The `useSignIn()` hook is used to create a sign-in flow. The user can sign in using email address and password, or navigate to the sign-up page.

```tsx {{ filename: 'app/(auth)/sign-in.tsx', collapsible: true }}
import { ThemedText } from '@/components/themed-text'
import { ThemedView } from '@/components/themed-view'
import { useSignIn } from '@clerk/expo'
import { type Href, Link, useRouter } from 'expo-router'
import React from 'react'
import { Pressable, StyleSheet, TextInput, View } from 'react-native'

export default function Page() {
  const { signIn, errors, fetchStatus } = useSignIn()
  const router = useRouter()

  const [emailAddress, setEmailAddress] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [code, setCode] = React.useState('')

  const handleSubmit = async () => {
    const { error } = await signIn.password({
      emailAddress,
      password,
    })
    if (error) {
      console.error(JSON.stringify(error, null, 2))
      return
    }

    if (signIn.status === 'complete') {
      await signIn.finalize({
        navigate: ({ session, decorateUrl }) => {
          if (session?.currentTask) {
            // Handle pending session tasks
            // See https://clerk.com/docs/guides/development/custom-flows/authentication/session-tasks
            console.log(session?.currentTask)
            return
          }

          const url = decorateUrl('/')
          if (url.startsWith('http')) {
            window.location.href = url
          } else {
            router.push(url as Href)
          }
        },
      })
    } else if (signIn.status === 'needs_second_factor') {
      // See https://clerk.com/docs/guides/development/custom-flows/authentication/multi-factor-authentication
    } else if (signIn.status === 'needs_client_trust') {
      // For other second factor strategies,
      // see https://clerk.com/docs/guides/development/custom-flows/authentication/client-trust
      const emailCodeFactor = signIn.supportedSecondFactors.find(
        (factor) => factor.strategy === 'email_code',
      )

      if (emailCodeFactor) {
        await signIn.mfa.sendEmailCode()
      }
    } else {
      // Check why the sign-in is not complete
      console.error('Sign-in attempt not complete:', signIn)
    }
  }

  const handleVerify = async () => {
    await signIn.mfa.verifyEmailCode({ code })

    if (signIn.status === 'complete') {
      await signIn.finalize({
        navigate: ({ session, decorateUrl }) => {
          if (session?.currentTask) {
            // Handle pending session tasks
            // See https://clerk.com/docs/guides/development/custom-flows/authentication/session-tasks
            console.log(session?.currentTask)
            return
          }

          const url = decorateUrl('/')
          if (url.startsWith('http')) {
            window.location.href = url
          } else {
            router.push(url as Href)
          }
        },
      })
    } else {
      // Check why the sign-in is not complete
      console.error('Sign-in attempt not complete:', signIn)
    }
  }

  if (signIn.status === 'needs_client_trust') {
    return (
      <ThemedView style={styles.container}>
        <ThemedText type="title" style={[styles.title, { fontSize: 24, fontWeight: 'bold' }]}>
          Verify your account
        </ThemedText>
        <TextInput
          style={styles.input}
          value={code}
          placeholder="Enter your verification code"
          placeholderTextColor="#666666"
          onChangeText={(code) => setCode(code)}
          keyboardType="numeric"
        />
        {errors.fields.code && (
          <ThemedText style={styles.error}>{errors.fields.code.message}</ThemedText>
        )}
        <Pressable
          style={({ pressed }) => [
            styles.button,
            fetchStatus === 'fetching' && styles.buttonDisabled,
            pressed && styles.buttonPressed,
          ]}
          onPress={handleVerify}
          disabled={fetchStatus === 'fetching'}
        >
          <ThemedText style={styles.buttonText}>Verify</ThemedText>
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.secondaryButton, pressed && styles.buttonPressed]}
          onPress={() => signIn.mfa.sendEmailCode()}
        >
          <ThemedText style={styles.secondaryButtonText}>I need a new code</ThemedText>
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.secondaryButton, pressed && styles.buttonPressed]}
          onPress={() => signIn.reset()}
        >
          <ThemedText style={styles.secondaryButtonText}>Start over</ThemedText>
        </Pressable>
      </ThemedView>
    )
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.title}>
        Sign in
      </ThemedText>

      <ThemedText style={styles.label}>Email address</ThemedText>
      <TextInput
        style={styles.input}
        autoCapitalize="none"
        value={emailAddress}
        placeholder="Enter email"
        placeholderTextColor="#666666"
        onChangeText={(emailAddress) => setEmailAddress(emailAddress)}
        keyboardType="email-address"
      />
      {errors.fields.identifier && (
        <ThemedText style={styles.error}>{errors.fields.identifier.message}</ThemedText>
      )}
      <ThemedText style={styles.label}>Password</ThemedText>
      <TextInput
        style={styles.input}
        value={password}
        placeholder="Enter password"
        placeholderTextColor="#666666"
        secureTextEntry={true}
        onChangeText={(password) => setPassword(password)}
      />
      {errors.fields.password && (
        <ThemedText style={styles.error}>{errors.fields.password.message}</ThemedText>
      )}
      <Pressable
        style={({ pressed }) => [
          styles.button,
          (!emailAddress || !password || fetchStatus === 'fetching') && styles.buttonDisabled,
          pressed && styles.buttonPressed,
        ]}
        onPress={handleSubmit}
        disabled={!emailAddress || !password || fetchStatus === 'fetching'}
      >
        <ThemedText style={styles.buttonText}>Continue</ThemedText>
      </Pressable>
      {/* For your debugging purposes. You can just console.log errors, but we put them in the UI for convenience */}
      {errors && <ThemedText style={styles.debug}>{JSON.stringify(errors, null, 2)}</ThemedText>}

      <View style={styles.linkContainer}>
        <ThemedText>Don't have an account? </ThemedText>
        <Link href="/sign-up">
          <ThemedText type="link">Sign up</ThemedText>
        </Link>
      </View>
    </ThemedView>
  )
}
```
