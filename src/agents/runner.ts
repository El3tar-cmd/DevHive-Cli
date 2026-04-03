import { AgentDefinition } from './loader';
import { getProvider } from '../providers';
import { getConfig } from '../config';
import { getToolsForAgent } from '../tools';
import { getMcpToolDefinitions, callMcpTool } from '../mcp/client';
import { Message, ToolDefinition } from '../providers/types';
import { buildSkillContext } from '../skills';

export interface RunOptions {
  onToken: (token: string) => void;
  onToolStart: (name: string, args: Record<string, unknown>) => void;
  onToolEnd: (name: string, result: string) => void;
  onError: (err: string) => void;
  onRound?: (round: number) => void;
}

export async function runAgentTurn(
  agent: AgentDefinition,
  history: Message[],
  userMessage: string,
  loadedSkills: string[],
  opts: RunOptions
): Promise<Message[]> {
  const config = getConfig();
  const model = agent.model || config.model;
  const provider = getProvider();
  const tools = getToolsForAgent(agent.tools);
  const mcpToolDefs = getMcpToolDefinitions();
  const toolDefs: ToolDefinition[] = [...tools.map((t) => t.definition), ...mcpToolDefs];

  const skillContext = buildSkillContext(loadedSkills);
  const systemContent = [
    agent.systemPrompt,
    skillContext ? `\n\n## Loaded Skills\n${skillContext}` : '',
    `\n\n## Environment\n- Working directory: ${process.cwd().replace(/\\/g, '/')}\n- Date: ${new Date().toISOString().split('T')[0]}\n- Agent: ${agent.name}\n- Model: ${model}`,
  ].join('');

  const systemMessage: Message = { role: 'system', content: systemContent };
  const messages: Message[] = [systemMessage, ...history, { role: 'user', content: userMessage }];

  const MAX_ROUNDS = 20;
  let round = 0;

  while (round < MAX_ROUNDS) {
    round++;
    opts.onRound?.(round);

    let assistantMessage: Message | null = null;
    let assistantContent = '';

    try {
      assistantMessage = await provider.chat(messages, toolDefs, model, (chunk) => {
        if (chunk.content) {
          assistantContent += chunk.content;
          opts.onToken(chunk.content);
        }
      });
    } catch (err: unknown) {
      const error = err as { message?: string };
      opts.onError(error.message || String(err));
      break;
    }

    messages.push(assistantMessage);

    if (!assistantMessage.tool_calls || assistantMessage.tool_calls.length === 0) break;

    for (const toolCall of assistantMessage.tool_calls) {
      const toolName = toolCall.function.name;
      let args: Record<string, unknown> = {};
      try { args = JSON.parse(toolCall.function.arguments) as Record<string, unknown>; } catch {}

      opts.onToolStart(toolName, args);

      let result: string;

      if (toolName.startsWith('mcp__')) {
        const parts = toolName.split('__');
        const serverName = parts[1];
        const mcpToolName = parts.slice(2).join('__');
        result = await callMcpTool(serverName, mcpToolName, args);
      } else {
        const tool = tools.find((t) => t.definition.function.name === toolName);
        if (!tool) {
          result = `❌ Tool not found: ${toolName}`;
        } else {
          try {
            result = await tool.execute(args as Record<string, string>);
          } catch (err: unknown) {
            const error = err as { message?: string };
            result = `❌ Tool error: ${error.message || String(err)}`;
          }
        }
      }

      opts.onToolEnd(toolName, result);
      messages.push({ role: 'tool', content: result, tool_call_id: toolCall.id });
    }
  }

  const newHistory: Message[] = [
    ...history,
    { role: 'user', content: userMessage },
    ...messages.slice(history.length + 2),
  ];
  return newHistory;
}
