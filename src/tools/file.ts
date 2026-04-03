import fs from 'fs';
import path from 'path';
import { Tool } from './types';

export const readFileTool: Tool = {
  definition: {
    type: 'function',
    function: {
      name: 'read_file',
      description: 'Read the contents of a file. Use to inspect code, configs, or any text file.',
      parameters: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'File path (relative or absolute)' },
          offset: { type: 'string', description: 'Start line number (optional)' },
          limit: { type: 'string', description: 'Number of lines to read (optional, default all)' },
        },
        required: ['path'],
      },
    },
  },
  async execute(args) {
    const filePath = path.resolve(process.cwd(), args.path);
    if (!fs.existsSync(filePath)) return `❌ File not found: ${args.path}`;
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) return `❌ Path is a directory. Use list_files instead.`;
    if (stat.size > 2 * 1024 * 1024) return `❌ File too large (${(stat.size / 1024).toFixed(0)}KB). Read a smaller range.`;
    let content = fs.readFileSync(filePath, 'utf-8');
    if (args.offset || args.limit) {
      const lines = content.split('\n');
      const start = Math.max(0, parseInt(args.offset || '1', 10) - 1);
      const end = args.limit ? start + parseInt(args.limit, 10) : lines.length;
      content = lines.slice(start, end).join('\n');
    }
    return content;
  },
};

export const writeFileTool: Tool = {
  definition: {
    type: 'function',
    function: {
      name: 'write_file',
      description: 'Write or overwrite content to a file. Creates parent directories automatically.',
      parameters: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'File path to write to' },
          content: { type: 'string', description: 'Content to write' },
          mode: { type: 'string', description: 'Write mode: overwrite (default) or append', enum: ['overwrite', 'append'] },
        },
        required: ['path', 'content'],
      },
    },
  },
  async execute(args) {
    const filePath = path.resolve(process.cwd(), args.path);
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    if (args.mode === 'append') {
      fs.appendFileSync(filePath, args.content, 'utf-8');
    } else {
      fs.writeFileSync(filePath, args.content, 'utf-8');
    }
    const size = Buffer.byteLength(args.content, 'utf-8');
    return `✅ Written ${size} bytes to ${args.path}`;
  },
};

export const listFilesTool: Tool = {
  definition: {
    type: 'function',
    function: {
      name: 'list_files',
      description: 'List files and directories in a path as a tree. Use before reading/writing files.',
      parameters: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'Directory path (default: current directory)' },
          depth: { type: 'string', description: 'Max depth (default: 2)' },
        },
        required: [],
      },
    },
  },
  async execute(args) {
    const dirPath = path.resolve(process.cwd(), args.path || '.');
    const maxDepth = parseInt(args.depth || '2', 10);
    if (!fs.existsSync(dirPath)) return `❌ Path not found: ${args.path}`;

    const IGNORED = new Set(['node_modules', '.git', 'dist', 'build', '__pycache__', '.venv', 'venv']);

    function walkDir(dir: string, depth: number, prefix: string): string {
      if (depth > maxDepth) return '';
      let items: string[];
      try { items = fs.readdirSync(dir).filter((f) => !f.startsWith('.') || f === '.env'); }
      catch { return ''; }
      items = items.filter((f) => !IGNORED.has(f));
      return items.map((item, i) => {
        const isLast = i === items.length - 1;
        const branch = isLast ? '└── ' : '├── ';
        const childPrefix = isLast ? '    ' : '│   ';
        const itemPath = path.join(dir, item);
        let isDir = false;
        try { isDir = fs.statSync(itemPath).isDirectory(); } catch { return ''; }
        const line = `${prefix}${branch}${item}${isDir ? '/' : ''}`;
        return isDir && depth < maxDepth
          ? line + '\n' + walkDir(itemPath, depth + 1, prefix + childPrefix)
          : line;
      }).filter(Boolean).join('\n');
    }

    return `${dirPath}\n${walkDir(dirPath, 0, '')}`;
  },
};

export const createDirTool: Tool = {
  definition: {
    type: 'function',
    function: {
      name: 'create_dir',
      description: 'Create a directory (and all parent directories if needed).',
      parameters: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'Directory path to create' },
        },
        required: ['path'],
      },
    },
  },
  async execute(args) {
    const dirPath = path.resolve(process.cwd(), args.path);
    fs.mkdirSync(dirPath, { recursive: true });
    return `✅ Created directory: ${args.path}`;
  },
};

export const deleteFileTool: Tool = {
  definition: {
    type: 'function',
    function: {
      name: 'delete_file',
      description: 'Delete a file or empty directory.',
      parameters: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'File or directory path to delete' },
        },
        required: ['path'],
      },
    },
  },
  async execute(args) {
    const filePath = path.resolve(process.cwd(), args.path);
    if (!fs.existsSync(filePath)) return `❌ Not found: ${args.path}`;
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) { fs.rmdirSync(filePath); return `✅ Deleted directory: ${args.path}`; }
    fs.unlinkSync(filePath);
    return `✅ Deleted: ${args.path}`;
  },
};
