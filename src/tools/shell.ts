import { exec } from 'child_process';
import { Tool } from './types';

const BLOCKED = ['rm -rf /', 'mkfs', ':(){:|:&};:'];

export const runShellTool: Tool = {
  definition: {
    type: 'function',
    function: {
      name: 'run_shell',
      description: 'Execute a shell command. Use for: running scripts, installing packages, git, npm/pnpm/pip, compiling, testing, listing processes, etc.',
      parameters: {
        type: 'object',
        properties: {
          command: { type: 'string', description: 'Shell command to execute' },
          cwd: { type: 'string', description: 'Working directory (optional)' },
          timeout: { type: 'string', description: 'Timeout in seconds (default: 60)' },
        },
        required: ['command'],
      },
    },
  },
  async execute(args) {
    for (const blocked of BLOCKED) {
      if (args.command.includes(blocked)) return `❌ Blocked: ${args.command}`;
    }
    const timeout = parseInt(args.timeout || '60', 10) * 1000;

    return new Promise<string>((resolve) => {
      exec(
        args.command,
        {
          cwd: args.cwd || process.cwd(),
          timeout,
          encoding: 'utf-8',
          maxBuffer: 10 * 1024 * 1024,
        },
        (err, stdout, stderr) => {
          if (err) {
            const msg = (stderr || err.message || 'Command failed').slice(0, 4000);
            resolve(`❌ ${msg}`);
          } else {
            resolve(stdout || '✅ Done (no output)');
          }
        }
      );
    });
  },
};
