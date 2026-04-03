export interface Message {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  tool_call_id?: string;
  tool_calls?: ToolCall[];
}

export interface ToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
}

export interface ToolDefinition {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: {
      type: 'object';
      properties: Record<string, { type: string; description: string; enum?: string[] }>;
      required: string[];
    };
  };
}

export interface StreamChunk {
  content?: string;
  toolCalls?: ToolCall[];
  done: boolean;
}

export interface Provider {
  chat(
    messages: Message[],
    tools: ToolDefinition[],
    model: string,
    onChunk: (chunk: StreamChunk) => void
  ): Promise<Message>;

  listModels(): Promise<string[]>;
  isAvailable(): Promise<boolean>;
}
