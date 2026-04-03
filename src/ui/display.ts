import chalk from 'chalk';
import os from 'os';
import path from 'path';

export const COLORS = {
  primary: chalk.hex('#F5A623'),
  secondary: chalk.hex('#E8851A'),
  accent: chalk.hex('#FFD166'),
  success: chalk.green,
  warning: chalk.yellow,
  error: chalk.red,
  dim: chalk.dim,
  bold: chalk.bold,
  muted: chalk.hex('#888888'),
};

export interface TableRow {
  [key: string]: string;
}

export function table(rows: TableRow[], columns: string[]): string {
  if (rows.length === 0) return chalk.dim('  (empty)\n');
  const widths = columns.map((col) => Math.max(col.length, ...rows.map((r) => stripAnsi(r[col] || '').length)));
  const header = columns.map((col, i) => chalk.bold.hex('#F5A623')(col.padEnd(widths[i]))).join('  ');
  const sep = columns.map((_, i) => chalk.dim('─'.repeat(widths[i]))).join('  ');
  const rowLines = rows.map((row) =>
    columns.map((col, i) => padEndAnsi(row[col] || '', widths[i])).join('  ')
  );
  return ['  ' + header, '  ' + sep, ...rowLines.map((r) => '  ' + r)].join('\n') + '\n';
}

function stripAnsi(str: string): string {
  return str.replace(/\x1B\[[0-?]*[ -/]*[@-~]/g, '');
}

function padEndAnsi(str: string, len: number): string {
  const visible = stripAnsi(str).length;
  return str + ' '.repeat(Math.max(0, len - visible));
}

export function panel(title: string, content: string, color = chalk.hex('#F5A623')): string {
  const lines = content.split('\n');
  const width = Math.max(title.length + 4, ...lines.map((l) => l.length + 4), 50);
  const top = color('┌' + '─'.repeat(width - 2) + '┐');
  const titleLine = color('│ ') + chalk.bold(title.padEnd(width - 4)) + color(' │');
  const sep = color('├' + '─'.repeat(width - 2) + '┤');
  const contentLines = lines.map((l) => color('│ ') + l.padEnd(width - 4) + color(' │'));
  const bottom = color('└' + '─'.repeat(width - 2) + '┘');
  return [top, titleLine, sep, ...contentLines, bottom].join('\n');
}

export function badge(text: string, color: (text: string) => string = chalk.hex('#F5A623')): string {
  return color(`[${text}]`);
}

export function statusDot(active: boolean): string {
  return active ? chalk.green('●') : chalk.dim('○');
}

const AMBER = '#F5A623';
const GOLD = '#FFD166';
const DIM_AMBER = '#9A6614';

export function printBanner(agentCount?: number, model?: string): void {
  const username = os.userInfo().username;
  const cwd = process.cwd();
  const cwdDisplay = cwd.replace(os.homedir(), '~');

  const border = chalk.hex(AMBER);
  const title = chalk.bold.hex(GOLD);
  const dimText = chalk.hex(DIM_AMBER);
  const white = chalk.bold.white;

  console.log('');
  console.log(border('  ┌─── DevHive ') + border('─'.repeat(38)) + border('┐'));
  console.log(border('  │') + ' '.repeat(51) + border('│'));
  console.log(border('  │') + title('       ⬡  Welcome to DevHive  ⬡       ').padEnd(51) + border('│'));
  console.log(border('  │') + ' '.repeat(51) + border('│'));
  console.log(border('  │') + chalk.hex(AMBER)([
    '    ██████╗ ███████╗██╗   ██╗',
  ].join('')) + ' '.repeat(21) + border('│'));
  console.log(border('  │') + chalk.hex(AMBER)([
    '    ██╔══██╗██╔════╝██║   ██║',
  ].join('')) + ' '.repeat(21) + border('│'));
  console.log(border('  │') + chalk.hex(AMBER)([
    '    ██║  ██║█████╗  ██║   ██║',
  ].join('')) + chalk.hex(GOLD)('  ██╗  ██╗██╗██╗   ██╗███████╗') + ' '.repeat(0) + border('│'));
  console.log(border('  │') + chalk.hex(AMBER)([
    '    ██║  ██║██╔══╝  ╚██╗ ██╔╝',
  ].join('')) + chalk.hex(GOLD)('  ██║  ██║██║██║   ██║██╔════╝') + ' '.repeat(0) + border('│'));
  console.log(border('  │') + chalk.hex(AMBER)([
    '    ██████╔╝███████╗ ╚████╔╝ ',
  ].join('')) + chalk.hex(GOLD)('  ███████║██║██║   ██║█████╗  ') + border('│'));
  console.log(border('  │') + chalk.hex(AMBER)([
    '    ╚═════╝ ╚══════╝  ╚═══╝  ',
  ].join('')) + chalk.hex(GOLD)('  ██╔══██║██║╚██╗ ██╔╝██╔══╝  ') + border('│'));
  console.log(border('  │') + ' '.repeat(31) + chalk.hex(GOLD)('  ██║  ██║██║ ╚████╔╝ ███████╗') + border('│'));
  console.log(border('  │') + ' '.repeat(31) + chalk.hex(GOLD)('  ╚═╝  ╚═╝╚═╝  ╚═══╝  ╚══════╝') + border('│'));
  console.log(border('  │') + ' '.repeat(51) + border('│'));
  console.log(border('  │') + dimText('  Multi-Agent AI Engineering Platform').padEnd(51) + border('│'));
  console.log(border('  │') + ' '.repeat(51) + border('│'));
  console.log(border('  ├') + border('─'.repeat(50)) + border('┤'));
  console.log(border('  │') + white(`  ${username}`) + chalk.dim(` @ ${cwdDisplay}`).padEnd(50 - username.length) + border(' │'));
  if (model) {
    console.log(border('  │') + dimText(`  Model: ${model}`).padEnd(51) + border('│'));
  }
  if (agentCount !== undefined) {
    console.log(border('  │') + dimText(`  Agents: ${agentCount} loaded  •  Type /help for commands`).padEnd(51) + border('│'));
  }
  console.log(border('  └') + border('─'.repeat(50)) + border('┘'));
  console.log('');
}

export function printDivider(label?: string): void {
  if (label) {
    console.log(chalk.hex(DIM_AMBER)(`  ── ${label} ${'─'.repeat(Math.max(0, 46 - label.length))}`));
  } else {
    console.log(chalk.hex(DIM_AMBER)('  ' + '─'.repeat(50)));
  }
}

export function printSection(title: string): void {
  console.log('');
  console.log(chalk.bold.hex(AMBER)(`  ⬡ ${title}`));
  console.log(chalk.hex(DIM_AMBER)('  ' + '─'.repeat(48)));
}

export function truncate(str: string, max: number): string {
  const visible = stripAnsi(str);
  return visible.length > max ? visible.slice(0, max - 3) + '...' : str;
}

export function agentBadge(name: string): string {
  const colors: Record<string, string> = {
    orchestrator: '#FF6B6B',
    frontend:     '#4ECDC4',
    backend:      '#45B7D1',
    architect:    '#96CEB4',
    security:     '#FF4757',
    debugger:     '#FF7F50',
    planner:      '#A29BFE',
    executor:     '#FD79A8',
    documenter:   '#00B894',
    researcher:   '#0984E3',
    devops:       '#6C5CE7',
    analyst:      '#FDCB6E',
    assistant:    '#55EFC4',
    coder:        '#F5A623',
  };
  const color = colors[name] || '#F5A623';
  return chalk.hex(color).bold(`[${name}]`);
}
