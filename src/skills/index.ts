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

  function processFile(filePath: string, file: string) {
    try {
      const raw = fs.readFileSync(filePath, 'utf-8');
      const { data, content } = matter(raw);
      // For SKILL.md we definitely need to use the frontmatter name or directory name
      let name: string = data.name as string;
      if (!name) {
        if (file === 'SKILL.md') name = path.basename(path.dirname(filePath));
        else name = path.basename(file, '.md');
      }
      
      if (seen.has(name)) return;
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

  for (const dir of dirs) {
    if (!fs.existsSync(dir)) continue;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      if (entry.isFile() && entry.name.endsWith('.md')) {
        processFile(path.join(dir, entry.name), entry.name);
      } else if (entry.isDirectory()) {
        const subDir = path.join(dir, entry.name);
        const skillMdPath = path.join(subDir, 'SKILL.md');
        if (fs.existsSync(skillMdPath)) {
          processFile(skillMdPath, 'SKILL.md');
        } else {
          // optionally check other md files inside the folder
          const subFiles = fs.readdirSync(subDir).filter(f => f.endsWith('.md'));
          for (const f of subFiles) {
             processFile(path.join(subDir, f), f);
          }
        }
      }
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
