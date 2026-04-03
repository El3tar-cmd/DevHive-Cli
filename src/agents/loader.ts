import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { getAgentDirs } from '../config';

export const ALL_TOOL_NAMES = [
  'read_file',
  'write_file',
  'list_files',
  'create_dir',
  'delete_file',
  'run_shell',
  'web_fetch',
];

export interface AgentDefinition {
  name: string;
  description: string;
  tools: string[];
  model?: string;
  systemPrompt: string;
  filePath: string;
  category?: string;
}

let cachedAgents: AgentDefinition[] | null = null;

export function loadAgents(force = false): AgentDefinition[] {
  if (cachedAgents && !force) return cachedAgents;

  const dirs = getAgentDirs();
  const agents: AgentDefinition[] = [];
  const seen = new Set<string>();
  const errors: string[] = [];

  for (const dir of dirs) {
    if (!fs.existsSync(dir)) continue;
    const files = fs.readdirSync(dir).filter((f) => f.endsWith('.md'));

    for (const file of files) {
      const filePath = path.join(dir, file);
      try {
        const raw = fs.readFileSync(filePath, 'utf-8');
        const { data, content } = matter(raw);
        const name: string = (data.name as string) || path.basename(file, '.md');
        if (seen.has(name)) continue;
        seen.add(name);

        const rawTools = data.tools;
        const tools: string[] = Array.isArray(rawTools)
          ? (rawTools as unknown[]).filter((t): t is string => typeof t === 'string' && ALL_TOOL_NAMES.includes(t))
          : ALL_TOOL_NAMES;

        agents.push({
          name,
          description: (data.description as string) || '',
          tools,
          model: data.model as string | undefined,
          systemPrompt: content.trim(),
          filePath,
          category: data.category as string | undefined,
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        errors.push(`${file}: ${msg}`);
      }
    }
  }

  if (errors.length > 0) {
    process.stderr.write(`\n⚠️  Agent loading warnings (${errors.length}):\n`);
    for (const e of errors) process.stderr.write(`  • ${e}\n`);
  }

  cachedAgents = agents;
  return agents;
}

export function getAgent(name: string): AgentDefinition | undefined {
  return loadAgents().find((a) => a.name === name);
}

export function createAgentFile(name: string, description: string, tools: string[], systemPrompt: string, model?: string): string {
  const dirs = getAgentDirs();
  const targetDir = dirs[1] || dirs[0];

  if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });

  const frontmatter = [
    '---',
    `name: ${name}`,
    `description: ${description}`,
    model ? `model: ${model}` : null,
    'tools:',
    ...tools.map((t) => `  - ${t}`),
    '---',
  ].filter(Boolean).join('\n');

  const content = `${frontmatter}\n\n${systemPrompt}`;
  const filePath = path.join(targetDir, `${name}.md`);
  fs.writeFileSync(filePath, content);
  cachedAgents = null;
  return filePath;
}
