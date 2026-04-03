import { AgentDefinition, loadAgents } from './loader';
import { getProvider } from '../providers';
import { getConfig } from '../config';

export async function pickAgent(userMessage: string, preferredAgent?: string): Promise<AgentDefinition> {
  const agents = loadAgents();
  if (agents.length === 0) throw new Error('No agents found. Check agent directories with /agent list');
  if (agents.length === 1) return agents[0];

  if (preferredAgent && preferredAgent !== 'auto') {
    const found = agents.find((a) => a.name === preferredAgent);
    if (found) return found;
  }

  const config = getConfig();
  if (config.defaultAgent !== 'auto') {
    const found = agents.find((a) => a.name === config.defaultAgent);
    if (found) return found;
  }

  const agentList = agents.map((a) => `- ${a.name}: ${a.description}`).join('\n');
  const provider = getProvider();
  let chosen = '';

  const messages = [
    {
      role: 'system' as const,
      content: `You are the core Orchestrator AI router for DevHive. Your sole responsibility is to accurately route the user's task to the most specialized Agent available.
Below is the list of available agents:
${agentList}

CRITICAL RULES:
1. Evaluate the user's request, scan the ENTIRE list, and select the single best agent for the task.
2. Reply with ONLY the exact name of the agent (e.g., "coder" or "branding-generator").
3. Do NOT include markdown, punctuation, or any explanation.
4. If no specialized agent perfectly matches, or it is a general coding request, return "coder".`
    },
    {
      role: 'user' as const,
      content: `USER TASK: "${userMessage}"\n\nROUTING DECISION (Exact name only):`
    }
  ];

  await provider.chat(
    messages,
    [],
    config.model,
    (chunk) => { if (chunk.content) chosen += chunk.content; }
  );

  chosen = chosen.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
  return agents.find((a) => a.name === chosen) || agents.find((a) => a.name === 'coder') || agents[0];
}
