import fs from 'fs';
import path from 'path';
import os from 'os';

export interface McpServerConfig {
  command: string;
  args: string[];
  env?: Record<string, string>;
}

export interface DevyConfig {
  provider: 'ollama';
  ollamaUrl: string;
  model: string;
  defaultAgent: string;
  mcpServers: Record<string, McpServerConfig>;
  agentDirs: string[];
  skillDirs: string[];
  theme: 'dark' | 'light';
  maxHistoryMessages: number;
  autoCompactAt: number;
}

export const DEFAULT_CONFIG: DevyConfig = {
  provider: 'ollama',
  ollamaUrl: 'http://localhost:11434',
  model: '',
  defaultAgent: 'auto',
  mcpServers: {},
  agentDirs: [],
  skillDirs: [],
  theme: 'dark',
  maxHistoryMessages: 100,
  autoCompactAt: 80,
};

export function getConfigDir(): string {
  return path.join(os.homedir(), '.devy');
}

export function getConfigPath(): string {
  return path.join(getConfigDir(), 'config.json');
}

export function getConfig(): DevyConfig {
  const configPath = getConfigPath();
  if (!fs.existsSync(configPath)) return { ...DEFAULT_CONFIG };
  try {
    const raw = fs.readFileSync(configPath, 'utf-8');
    return { ...DEFAULT_CONFIG, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_CONFIG };
  }
}

export function saveConfig(config: Partial<DevyConfig>): void {
  const dir = getConfigDir();
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const current = getConfig();
  fs.writeFileSync(getConfigPath(), JSON.stringify({ ...current, ...config }, null, 2));
}

export function getAgentDirs(): string[] {
  const config = getConfig();
  const dirs: string[] = [];

  const builtinDir = path.join(__dirname, '..', 'agents');
  if (fs.existsSync(builtinDir)) dirs.push(builtinDir);

  const userAgentDir = path.join(getConfigDir(), 'agents');
  if (fs.existsSync(userAgentDir)) dirs.push(userAgentDir);

  const cwdAgentDir = path.join(process.cwd(), '.devy', 'agents');
  if (fs.existsSync(cwdAgentDir)) dirs.push(cwdAgentDir);

  for (const d of config.agentDirs) {
    if (fs.existsSync(d)) dirs.push(d);
  }

  return [...new Set(dirs)];
}

export function getSkillDirs(): string[] {
  const config = getConfig();
  const dirs: string[] = [];

  const builtinDir = path.join(__dirname, '..', 'skills');
  if (fs.existsSync(builtinDir)) dirs.push(builtinDir);

  const userSkillDir = path.join(getConfigDir(), 'skills');
  if (fs.existsSync(userSkillDir)) dirs.push(userSkillDir);

  const cwdSkillDir = path.join(process.cwd(), '.devy', 'skills');
  if (fs.existsSync(cwdSkillDir)) dirs.push(cwdSkillDir);

  for (const d of config.skillDirs) {
    if (fs.existsSync(d)) dirs.push(d);
  }

  return [...new Set(dirs)];
}

export function getSessionsDir(): string {
  return path.join(getConfigDir(), 'sessions');
}
