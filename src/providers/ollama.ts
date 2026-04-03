import { Provider, Message, ToolDefinition, StreamChunk, ToolCall } from './types';

export class OllamaProvider implements Provider {
  constructor(private baseUrl: string) {}

  async isAvailable(): Promise<boolean> {
    try {
      const res = await fetch(`${this.baseUrl}/api/tags`, { signal: AbortSignal.timeout(3000) });
      return res.ok;
    } catch {
      return false;
    }
  }

  async listModels(): Promise<string[]> {
    const res = await fetch(`${this.baseUrl}/api/tags`);
    if (!res.ok) throw new Error('Cannot connect to Ollama. Run: ollama serve');
    const data = (await res.json()) as { models: { name: string }[] };
    return data.models.map((m) => m.name);
  }

  async chat(
    messages: Message[],
    tools: ToolDefinition[],
    model: string,
    onChunk: (chunk: StreamChunk) => void
  ): Promise<Message> {
    const body: Record<string, unknown> = {
      model,
      messages: messages.map((m) => ({
        role: m.role,
        content: m.content,
        ...(m.tool_calls ? { 
          tool_calls: m.tool_calls.map(tc => ({
            ...tc,
            function: {
              ...tc.function,
              arguments: typeof tc.function.arguments === 'string' 
                ? JSON.parse(tc.function.arguments || '{}') 
                : tc.function.arguments
            }
          }))
        } : {}),
        ...(m.tool_call_id ? { tool_call_id: m.tool_call_id } : {}),
      })),
      stream: true,
      options: { temperature: 0.7, num_ctx: 32768 },
    };

    if (tools.length > 0) body.tools = tools;

    const res = await fetch(`${this.baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Ollama error (${res.status}): ${text}`);
    }

    let fullContent = '';
    const toolCalls: ToolCall[] = [];
    const reader = res.body!.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const lines = decoder.decode(value).split('\n').filter(Boolean);
      for (const line of lines) {
        try {
          const data = JSON.parse(line) as {
            message?: {
              content?: string;
              tool_calls?: Array<{ function: { name: string; arguments: Record<string, unknown> | string } }>;
            };
            done?: boolean;
          };

          if (data.message?.content) {
            fullContent += data.message.content;
            onChunk({ content: data.message.content, done: false });
          }

          if (data.message?.tool_calls) {
            for (let i = 0; i < data.message.tool_calls.length; i++) {
              const tc = data.message.tool_calls[i];
              toolCalls.push({
                id: `call_${Date.now()}_${i}`,
                type: 'function',
                function: {
                  name: tc.function.name,
                  arguments: typeof tc.function.arguments === 'string'
                    ? tc.function.arguments
                    : JSON.stringify(tc.function.arguments),
                },
              });
            }
          }

          if (data.done) onChunk({ done: true });
        } catch {}
      }
    }

    if (toolCalls.length > 0) return { role: 'assistant', content: fullContent, tool_calls: toolCalls };
    return { role: 'assistant', content: fullContent };
  }
}
