import chalk from 'chalk';
import os from 'os';

export const COLORS = {
  // Gold family
  gold:       chalk.hex('#C9A84C'),
  brightGold: chalk.hex('#E8C872'),
  paleGold:   chalk.hex('#F0DCA0'),
  // Beige family
  beige:      chalk.hex('#F5F0E6'),
  warmBeige:  chalk.hex('#C4B8A4'),
  // Neutrals
  black:      chalk.hex('#0D0D0D'),
  richWhite:  chalk.hex('#F0EBE3'),
  // Functional
  success:    chalk.hex('#7DB87D'),
  warning:    chalk.hex('#E8C872'),
  error:      chalk.hex('#C75D5D'),
  // Modifiers
  dim:        chalk.hex('#6B5E4E'),
  bold:       chalk.bold,
  muted:      chalk.hex('#8B7355'),
};

// ─── Palette Constants ────────────────────────────────────────────────────────
const BG =           '#0D0D0D';  // deep black
const GOLD =        '#C9A84C';  // rich gold
const GOLD_BRIGHT = '#E8C872';  // bright gold
const GOLD_PALE =   '#F0DCA0';  // pale gold (highlights)
const BEIGE =       '#F5F0E6';  // soft beige
const BEIGE_WARM =  '#C4B8A4';  // warm beige (secondary text)
const DIM_GOLD =    '#8B6914';  // dim gold (subtle UI)
const MUTED =       '#6B5E4E';  // warm muted brown

export interface TableRow {
  [key: string]: string;
}

function stripAnsi(str: string): string {
  return str.replace(/\x1B\[[0-?]*[ -/]*[@-~]/g, '');
}

function padEndAnsi(str: string, len: number): string {
  const visible = stripAnsi(str).length;
  return str + ' '.repeat(Math.max(0, len - visible));
}

export function table(rows: TableRow[], columns: string[]): string {
  if (rows.length === 0) return chalk.dim('  (empty)\n');
  const widths = columns.map((col) => Math.max(col.length, ...rows.map((r) => stripAnsi(r[col] || '').length)));
  const header = columns.map((col, i) => chalk.bold.hex(GOLD)(col.padEnd(widths[i]))).join('  ');
  const sep = columns.map((_, i) => chalk.hex(MUTED)('─'.repeat(widths[i]))).join('  ');
  const rowLines = rows.map((row) =>
    columns.map((col, i) => padEndAnsi(row[col] || '', widths[i])).join('  ')
  );
  return ['  ' + header, '  ' + sep, ...rowLines.map((r) => '  ' + r)].join('\n') + '\n';
}

export function panel(title: string, content: string, color = chalk.hex(GOLD)): string {
  const lines = content.split('\n');
  const width = Math.max(title.length + 4, ...lines.map((l) => l.length + 4), 50);
  const top = color('┌' + '─'.repeat(width - 2) + '┐');
  const titleLine = color('│ ') + chalk.bold(title.padEnd(width - 4)) + color(' │');
  const sep = color('├' + '─'.repeat(width - 2) + '┤');
  const contentLines = lines.map((l) => color('│ ') + l.padEnd(width - 4) + color(' │'));
  const bottom = color('└' + '─'.repeat(width - 2) + '┘');
  return [top, titleLine, sep, ...contentLines, bottom].join('\n');
}

export function badge(text: string, color = chalk.hex(GOLD)): string {
  return color(`[${text}]`);
}

export function statusDot(active: boolean): string {
  return active ? chalk.hex('#7DB87D')('●') : chalk.hex(MUTED)('○');
}

export function printBanner(agentCount?: number, model?: string): void {
  const username = os.userInfo().username;
  const cwd = process.cwd();
  const cwdDisplay = cwd.replace(os.homedir(), '~');

  const gold   = chalk.hex(GOLD);
  const goldBr = chalk.hex(GOLD_BRIGHT);
  const dim    = chalk.hex(MUTED);
  const pale   = chalk.hex(GOLD_PALE);
  const white  = chalk.bold.hex(BEIGE);

  console.log('');
  console.log(gold('  ╔════ DevHive ════════════════════════════════════════╗'));
  console.log(gold('  ║') + ' '.repeat(53) + gold('║'));
  console.log(gold('  ║') + pale('             ✦  Welcome to DevHive  ✦                ').padEnd(53) + gold('║'));
  console.log(gold('  ║') + ' '.repeat(53) + gold('║'));
  // ASCII art — elegant gold block letters (53 chars wide exactly)
  const art = [
    ['██████╗ ███████╗██╗   ██╗', '██╗  ██╗██╗██╗   ██╗███████╗'],
    ['██╔══██╗██╔════╝██║   ██║', '██║  ██║██║██║   ██║██╔════╝'],
    ['██║  ██║█████╗  ██║   ██║', '███████║██║██║   ██║█████╗  '],
    ['██║  ██║██╔══╝  ╚██╗ ██╔╝', '██╔══██║██║╚██╗ ██╔╝██╔══╝  '],
    ['██████╔╝███████╗ ╚████╔╝ ', '██║  ██║██║ ╚████╔╝ ███████╗'],
    ['╚═════╝ ╚══════╝  ╚═══╝  ', '╚═╝  ╚═╝╚═╝  ╚═══╝  ╚══════╝'],
  ];
  for (let row = 0; row < art.length; row++) {
    const left  = gold(art[row][0]);
    const right = goldBr(art[row][1]);
    console.log(gold('  ║') + left + right + gold('║'));
  }
  console.log(gold('  ║') + ' '.repeat(53) + gold('║'));
  console.log(gold('  ║') + dim('         Multi-Agent AI Engineering Platform         ').padEnd(53) + gold('║'));
  console.log(gold('  ║') + ' '.repeat(53) + gold('║'));
  
  // Socials section
  console.log(gold('  ╟─────────────────────────────────────────────────────╢'));
  console.log(gold('  ║') + ' '.repeat(53) + gold('║'));
  console.log(gold('  ║') + chalk.hex(BEIGE_WARM)('  Email    : abdalrhamn.mahmoud@gmail.com').padEnd(53) + gold('║'));
  console.log(gold('  ║') + chalk.hex(BEIGE_WARM)('  Facebook : https://www.facebook.com/share/1CMHZog6hZ/').padEnd(53) + gold('║'));
  console.log(gold('  ║') + chalk.hex(BEIGE_WARM)('  Company  : https://www.facebook.com/share/1bvbFW6T99/').padEnd(53) + gold('║'));
  console.log(gold('  ║') + ' '.repeat(53) + gold('║'));
  
  // Terminal Info
  console.log(gold('  ╠═════════════════════════════════════════════════════╣'));
  console.log(gold('  ║') + white(`  ${username}`) + chalk.hex(MUTED)(` @ ${cwdDisplay}`).padEnd(53 - username.length) + gold('║'));
  if (model) {
    console.log(gold('  ║') + chalk.hex(BEIGE_WARM)(`  Model: ${model}`).padEnd(53) + gold('║'));
  }
  if (agentCount !== undefined) {
    console.log(gold('  ║') + chalk.hex(MUTED)(`  ${agentCount} agents loaded  ·  /help for commands`).padEnd(53) + gold('║'));
  }
  console.log(gold('  ╚═════════════════════════════════════════════════════╝'));
  console.log('');
}

export function printDivider(label?: string): void {
  if (label) {
    console.log(chalk.hex(MUTED)(`  ── ${label} ${'─'.repeat(Math.max(0, 44 - label.length))}`));
  } else {
    console.log(chalk.hex(MUTED)('  ' + '─'.repeat(50)));
  }
}

export function printSection(title: string): void {
  console.log('');
  console.log(chalk.bold.hex(GOLD)(`  ✦ ${title}`));
  console.log(chalk.hex(MUTED)('  ' + '─'.repeat(48)));
}

export function truncate(str: string, max: number): string {
  const visible = stripAnsi(str);
  return visible.length > max ? visible.slice(0, max - 3) + '...' : str;
}

export function agentBadge(name: string): string {
  const palette: Record<string, string> = {
    orchestrator: '#C9A84C',
    frontend:     '#E8C872',
    backend:      '#D4AF37',
    architect:    '#F0DCA0',
    security:     '#C75D5D',
    debugger:     '#E8A060',
    planner:      '#C4B8A4',
    executor:     '#C9A84C',
    documenter:   '#7DB87D',
    researcher:   '#8FA8C4',
    devops:       '#A898C4',
    analyst:      '#E8C872',
    assistant:    '#F5F0E6',
    coder:        '#C9A84C',
  };
  const color = palette[name] || '#C9A84C';
  return chalk.hex(color).bold(`[${name}]`);
}
