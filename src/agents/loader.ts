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
  'edit_file',
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


  function processFile(filePath: string, file: string) {
    try {
      const raw = fs.readFileSync(filePath, 'utf-8');
      const { data, content } = matter(raw);
      
      let name: string = data.name as string;
      if (!name) {
        if (file === 'AGENT.md' || file === 'SKILL.md') name = path.basename(path.dirname(filePath));
        else name = path.basename(file, '.md');
      }
      
      if (seen.has(name)) return;
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

  for (const dir of dirs) {
    if (!fs.existsSync(dir)) continue;
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.isFile() && entry.name.endsWith('.md')) {
        processFile(path.join(dir, entry.name), entry.name);
      } else if (entry.isDirectory()) {
        const subDir = path.join(dir, entry.name);
        const mdPath = path.join(subDir, 'AGENT.md');
        const skillMdPath = path.join(subDir, 'SKILL.md');
        if (fs.existsSync(mdPath)) processFile(mdPath, 'AGENT.md');
        else if (fs.existsSync(skillMdPath)) processFile(skillMdPath, 'SKILL.md');
        else {
          const subFiles = fs.readdirSync(subDir).filter((f) => f.endsWith('.md'));
          for (const f of subFiles) {
            processFile(path.join(subDir, f), f);
          }
        }
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
