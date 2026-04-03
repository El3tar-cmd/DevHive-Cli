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

  const agentList = agents.map((a) => `${a.name}: ${a.description}`).join('\n');
  const provider = getProvider();
  let chosen = '';

  await provider.chat(
    [{
      role: 'user',
      content: `Pick the best agent for this request. Agents:\n${agentList}\n\nRequest: "${userMessage}"\n\nRespond with ONLY the agent name, nothing else.`,
    }],
    [],
    config.model,
    (chunk) => { if (chunk.content) chosen += chunk.content; }
  );

  chosen = chosen.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
  return agents.find((a) => a.name === chosen) || agents[0];
}
