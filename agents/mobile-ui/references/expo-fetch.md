# Streaming with expo/fetch + Replit AI Integrations

Use `expo/fetch` for streaming API responses on mobile. This guide shows how to integrate with Replit AI Integrations (OpenAI) for chat streaming.

## Server-Side: Express with OpenAI SDK

Use the OpenAI SDK for cleaner streaming (already configured via integration):

```ts
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

app.post('/api/chat', async (req, res) => {
  // Critical SSE headers for true streaming
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('X-Accel-Buffering', 'no'); // Disable proxy buffering
  res.flushHeaders(); // Start streaming immediately

  const stream = await openai.chat.completions.create({
    model: 'gpt-5.1', // Always use latest available model. gpt-5.1 is just a placeholder. Replace this if replit ai integration supports a newer model
    messages: req.body.messages,
    stream: true,
    max_completion_tokens: 8192, // Required for gpt-5+ models (not max_tokens)
  });

  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content || '';
    if (content) {
      res.write(`data: ${JSON.stringify({ content })}\n\n`);
    }
  }

  res.write('data: [DONE]\n\n');
  res.end();
});
```

## Client-Side: Expo App with expo/fetch

```tsx
import { fetch } from 'expo/fetch';
import { getApiUrl } from '@/lib/query-client';

async function streamChat(
  messages: { role: string; content: string }[],
  onChunk: (text: string) => void
) {
  const baseUrl = getApiUrl();

  const response = await fetch(`${baseUrl}api/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'text/event-stream',
    },
    body: JSON.stringify({ messages }),
  });

  if (!response.ok) throw new Error('Failed to get response');

  const reader = response.body?.getReader();
  if (!reader) throw new Error('No response body');

  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || ''; // Keep incomplete line in buffer

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const data = line.slice(6);
      if (data === '[DONE]') continue;
      try {
        const parsed = JSON.parse(data);
        if (parsed.content) onChunk(parsed.content);
      } catch {}
    }
  }
}
```

## React State Pattern for Chat

Add the assistant message only when first content arrives:

```tsx
const [messages, setMessages] = useState<Message[]>([]);
const [isStreaming, setIsStreaming] = useState(false);
const [showTyping, setShowTyping] = useState(false);

async function sendMessage(text: string) {
  // Capture current messages BEFORE updating state (avoids stale closure)
  const currentMessages = [...messages];

  setMessages(prev => [...prev, { role: 'user', content: text }]);
  setIsStreaming(true);
  setShowTyping(true);

  let fullContent = '';
  let assistantAdded = false;

  try {
    await streamChat(
      [...currentMessages.map(m => ({ role: m.role, content: m.content })),
       { role: 'user', content: text }],
      (chunk) => {
        fullContent += chunk;

        if (!assistantAdded) {
          setShowTyping(false);
          setMessages(prev => [...prev, { role: 'assistant', content: chunk }]);
          assistantAdded = true;
        } else {
          // Update last message with accumulated content
          setMessages(prev => {
            const updated = [...prev];
            updated[updated.length - 1] = { role: 'assistant', content: fullContent };
            return updated;
          });
        }
      }
    );
  } catch (error) {
    setShowTyping(false);
    setMessages(prev => [...prev, { role: 'assistant', content: 'Error occurred.' }]);
  } finally {
    setIsStreaming(false);
    setShowTyping(false);
  }
}
```

## FlatList for Chat (Inverted)

For inverted FlatLists, use `ListHeaderComponent` for typing indicator:

```tsx
<FlatList
  data={[...messages].reverse()}
  inverted={messages.length > 0}
  ListHeaderComponent={showTyping ? <TypingIndicator /> : null}
  keyboardDismissMode="interactive"
  keyboardShouldPersistTaps="handled"
/>
```

**Why `ListHeaderComponent`?** In an inverted FlatList:

- The list is flipped upside down
- `ListFooterComponent` appears at the TOP (oldest messages)
- `ListHeaderComponent` appears at the BOTTOM (newest messages)

## Keep Keyboard Open After Send

By default, pressing a button dismisses the keyboard. In chat apps, users expect the keyboard to stay open for quick follow-up messages.

**Three things required:**

```tsx
// 1. FlatList: Allow taps while keyboard is open
<FlatList
  keyboardShouldPersistTaps="handled"
/>

// 2. TextInput: Prevent blur on submit
<TextInput
  ref={inputRef}
  blurOnSubmit={false}
/>

// 3. Send button: Refocus input after sending
<Pressable
  onPress={() => {
    handleSend();
    inputRef.current?.focus(); // Keep keyboard open
  }}
>
```

## Key Points

- Import `fetch` from `expo/fetch`, NOT the global fetch
- Works identically on iOS, Android, and web
- Always use the latest model available through replit's ai integration
- Use `max_completion_tokens` instead of `max_tokens` for gpt-5+ models
- Always buffer incomplete SSE lines (they can span multiple chunks)
- `TextDecoder` is available globally in Expo SDK 54+

## Troubleshooting

- **Streaming feels delayed**: Proxy buffering → Add `X-Accel-Buffering: no` header + `res.flushHeaders()`
- **Chunks arrive all at once**: Headers not flushed → Call `res.flushHeaders()` before streaming loop
- **Incomplete JSON parse errors**: SSE line split across chunks → Use buffer pattern to accumulate incomplete lines
- **State updates stale**: Closure captures old state → Capture state before async operation starts
- **Typing indicator above messages**: Wrong FlatList prop → Use `ListHeaderComponent` for inverted lists
- **Empty state renders upside down**: Using `transform: scaleY(-1)` hack → NEVER use this to flip empty state containers
- **Model not found error**: Using wrong model name → Check integration docs to find latest model string
- **Empty bubble before content**: Adding message too early → Add assistant message on first chunk, not before
- **Duplicate key errors in FlatList**: IDs not unique enough → Use counter + timestamp + random (see Unique ID Generation)
- **Messages disappear after AI responds**: Context/storage sync overwrites local state → Only sync from storage on initial load
- **User message vanishes**: useEffect syncs stale context data → Use initializedRef to prevent re-syncing after first load
- **Keyboard dismisses on send**: Missing focus restoration → Add `inputRef.current?.focus()` after handleSend

## Unique ID Generation

```tsx
// WRONG: Can produce duplicates if called within same millisecond
const id = Date.now().toString();

// CORRECT: Use a module-level counter for guaranteed uniqueness
let messageCounter = 0;
function generateUniqueId(): string {
  messageCounter++;
  return `msg-${Date.now()}-${messageCounter}-${Math.random().toString(36).substr(2, 9)}`;
}
```

## State Management with Persistence

When combining local state with AsyncStorage/Context persistence, local state must be the source of truth during the active session:

```tsx
// WRONG: Syncing from context on every change overwrites messages mid-stream
useEffect(() => {
  if (conversation?.messages) {
    setMessages(conversation.messages); // This OVERWRITES local messages!
  }
}, [conversation?.messages]);

// CORRECT: Only sync on initial load, never during active session
const initializedRef = useRef(false);
useEffect(() => {
  if (conversation?.messages && !initializedRef.current) {
    setMessages(conversation.messages);
    initializedRef.current = true;
  }
}, [conversation?.messages]);
```

Save to storage only AFTER streaming completes, not during:

```tsx
// In finally block after streaming completes:
finally {
  setIsStreaming(false);
  // NOW save to persistent storage
  await saveConversation(conversationId, messages);
}
```

## Complete Example: Chat Screen

```tsx
import { View, FlatList } from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { useState } from 'react';
import { fetch } from 'expo/fetch';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getApiUrl } from '@/lib/query-client';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

// Module-level counter for guaranteed unique IDs
let messageCounter = 0;
function generateUniqueId(): string {
  messageCounter++;
  return `msg-${Date.now()}-${messageCounter}-${Math.random().toString(36).substr(2, 9)}`;
}

export default function ChatScreen() {
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [showTyping, setShowTyping] = useState(false);

  async function handleSend(text: string) {
    if (isStreaming) return;

    const currentMessages = [...messages];
    const userMessage: Message = {
      id: generateUniqueId(),
      role: 'user',
      content: text,
    };

    setMessages(prev => [...prev, userMessage]);
    setIsStreaming(true);
    setShowTyping(true);

    try {
      const baseUrl = getApiUrl();
      const chatHistory = [
        ...currentMessages.map(m => ({ role: m.role, content: m.content })),
        { role: 'user', content: text },
      ];

      const response = await fetch(`${baseUrl}api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
        },
        body: JSON.stringify({ messages: chatHistory }),
      });

      if (!response.ok) throw new Error('Failed to get response');

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let fullContent = '';
      let buffer = '';
      let assistantAdded = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6);
          if (data === '[DONE]') continue;

          try {
            const parsed = JSON.parse(data);
            if (parsed.content) {
              fullContent += parsed.content;

              if (!assistantAdded) {
                setShowTyping(false);
                setMessages(prev => [...prev, {
                  id: generateUniqueId(),
                  role: 'assistant',
                  content: fullContent,
                }]);
                assistantAdded = true;
              } else {
                setMessages(prev => {
                  const updated = [...prev];
                  updated[updated.length - 1] = {
                    ...updated[updated.length - 1],
                    content: fullContent,
                  };
                  return updated;
                });
              }
            }
          } catch {}
        }
      }
    } catch (error) {
      setShowTyping(false);
      setMessages(prev => [...prev, {
        id: generateUniqueId(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
      }]);
    } finally {
      setIsStreaming(false);
      setShowTyping(false);
    }
  }

  const reversedMessages = [...messages].reverse();

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior="padding"
      keyboardVerticalOffset={0}
    >
      <FlatList
        data={reversedMessages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <MessageBubble message={item} />}
        inverted={messages.length > 0}
        ListHeaderComponent={showTyping ? <TypingIndicator /> : null}
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
      />
      <View style={{ paddingBottom: insets.bottom }}>
        <ChatInput onSend={handleSend} disabled={isStreaming} />
      </View>
    </KeyboardAvoidingView>
  );
}
```
