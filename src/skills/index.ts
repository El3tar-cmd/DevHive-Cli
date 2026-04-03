import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { getSkillDirs } from '../config';

export interface Skill {
  name: string;
  description: string;
  content: string;
  tags: string[];
  filePath: string;
}

export function loadAllSkills(): Skill[] {
  const dirs = getSkillDirs();
  const skills: Skill[] = [];
  const seen = new Set<string>();

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
        skills.push({
          name,
          description: (data.description as string) || '',
          content: content.trim(),
          tags: (data.tags as string[]) || [],
          filePath,
        });
      } catch {}
    }
  }
  return skills;
}

export function getSkill(name: string): Skill | undefined {
  return loadAllSkills().find((s) => s.name === name);
}

export function loadSkillFromPath(filePath: string): Skill | null {
  const absPath = path.resolve(process.cwd(), filePath);
  if (!fs.existsSync(absPath)) return null;
  try {
    const raw = fs.readFileSync(absPath, 'utf-8');
    const { data, content } = matter(raw);
    return {
      name: (data.name as string) || path.basename(filePath, '.md'),
      description: (data.description as string) || '',
      content: content.trim(),
      tags: (data.tags as string[]) || [],
      filePath: absPath,
    };
  } catch {
    return null;
  }
}

export function buildSkillContext(skillNames: string[]): string {
  const skills = loadAllSkills().filter((s) => skillNames.includes(s.name));
  if (skills.length === 0) return '';
  return skills.map((s) => `## Skill: ${s.name}\n${s.content}`).join('\n\n---\n\n');
}
