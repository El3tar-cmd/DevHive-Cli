import { getProvider } from '../providers';
import { getConfig } from '../config';
import { getToolsForAgent } from '../tools';
import { ALL_TOOL_NAMES } from '../agents/loader';
import { Message, ToolDefinition } from '../providers/types';
import { callMcpTool, getMcpToolDefinitions } from '../mcp/client';

export interface SubAgentResult {
  success: boolean;
  output: string;
  toolsUsed: string[];
  rounds: number;
}

export interface SubAgentOptions {
  task: string;
  tools?: string[];
  model?: string;
  systemPrompt?: string;
  onProgress?: (msg: string) => void;
  maxRounds?: number;
}

export async function runSubAgent(opts: SubAgentOptions): Promise<SubAgentResult> {
  const config = getConfig();
  const model = opts.model || config.model;
  const provider = getProvider();
  const toolNames = opts.tools || ALL_TOOL_NAMES;
  const tools = getToolsForAgent(toolNames);
  const mcpDefs = getMcpToolDefinitions();
  const toolDefs: ToolDefinition[] = [...tools.map((t) => t.definition), ...mcpDefs];

  const systemPrompt = opts.systemPrompt || `You are a focused autonomous sub-agent.
Your job is to complete the assigned task fully and independently using the available tools.
Think step by step. Plan, then execute. When done, summarize what you did.
Working directory: ${process.cwd()}
Date: ${new Date().toISOString().split('T')[0]}`;

  const messages: Message[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: `Complete this task: ${opts.task}` },
  ];

  const toolsUsed: string[] = [];
  let fullOutput = '';
  const maxRounds = opts.maxRounds || 15;
  let round = 0;

  while (round < maxRounds) {
    round++;
    opts.onProgress?.(`[sub-agent round ${round}]`);

    let assistantMessage: Message | null = null;
    let assistantContent = '';

    try {
      assistantMessage = await provider.chat(messages, toolDefs, model, (chunk) => {
        if (chunk.content) {
          assistantContent += chunk.content;
          fullOutput += chunk.content;
        }
      });
    } catch (err: unknown) {
      const error = err as { message?: string };
      return { success: false, output: `Error: ${error.message}`, toolsUsed, rounds: round };
    }

    messages.push(assistantMessage);

    if (!assistantMessage.tool_calls || assistantMessage.tool_calls.length === 0) break;

    for (const toolCall of assistantMessage.tool_calls) {
      const toolName = toolCall.function.name;
      toolsUsed.push(toolName);
      let args: Record<string, unknown> = {};
      try { args = JSON.parse(toolCall.function.arguments) as Record<string, unknown>; } catch {}

      opts.onProgress?.(`  ⚙ ${toolName}`);

      let result: string;
      if (toolName.startsWith('mcp__')) {
        const parts = toolName.split('__');
        result = await callMcpTool(parts[1], parts.slice(2).join('__'), args);
      } else {
        const tool = tools.find((t) => t.definition.function.name === toolName);
        result = tool ? await tool.execute(args as Record<string, string>) : `❌ Tool not found: ${toolName}`;
      }

      messages.push({ role: 'tool', content: result, tool_call_id: toolCall.id });
    }
  }

  return { success: true, output: fullOutput, toolsUsed: [...new Set(toolsUsed)], rounds: round };
}
