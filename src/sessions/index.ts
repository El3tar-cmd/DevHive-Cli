import fs from 'fs';
import path from 'path';
import { getSessionsDir } from '../config';
import { Message } from '../providers/types';

export interface Session {
  id: string;
  name: string;
  agentName: string | null;
  model: string;
  history: Message[];
  loadedSkills: string[];
  createdAt: string;
  updatedAt: string;
  messageCount: number;
}

function ensureSessionsDir(): string {
  const dir = getSessionsDir();
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function sessionPath(id: string): string {
  return path.join(ensureSessionsDir(), `${id}.json`);
}

export function listSessions(): Session[] {
  const dir = ensureSessionsDir();
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.json'));
  const sessions: Session[] = [];
  for (const file of files) {
    try {
      const raw = fs.readFileSync(path.join(dir, file), 'utf-8');
      sessions.push(JSON.parse(raw) as Session);
    } catch {}
  }
  return sessions.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function loadSession(id: string): Session | null {
  const p = sessionPath(id);
  if (!fs.existsSync(p)) return null;
  try {
    return JSON.parse(fs.readFileSync(p, 'utf-8')) as Session;
  } catch {
    return null;
  }
}

export function saveSession(session: Session): void {
  session.updatedAt = new Date().toISOString();
  session.messageCount = session.history.length;
  fs.writeFileSync(sessionPath(session.id), JSON.stringify(session, null, 2));
}

export function createSession(name: string, model: string, agentName: string | null): Session {
  const id = `${Date.now()}-${name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
  const session: Session = {
    id,
    name,
    agentName,
    model,
    history: [],
    loadedSkills: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    messageCount: 0,
  };
  saveSession(session);
  return session;
}

export function deleteSession(id: string): boolean {
  const p = sessionPath(id);
  if (!fs.existsSync(p)) return false;
  fs.unlinkSync(p);
  return true;
}

export function exportSession(session: Session, outputPath: string): void {
  const lines: string[] = [
    `# Session: ${session.name}`,
    `- Date: ${session.createdAt}`,
    `- Agent: ${session.agentName || 'auto'}`,
    `- Model: ${session.model}`,
    '',
    '---',
    '',
  ];
  for (const msg of session.history) {
    if (msg.role === 'system') continue;
    const label = msg.role === 'user' ? '**You**' : '**Devy**';
    lines.push(`${label}\n\n${msg.content}\n\n---\n`);
  }
  fs.writeFileSync(outputPath, lines.join('\n'));
}
