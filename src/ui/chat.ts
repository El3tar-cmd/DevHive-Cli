import readline from 'readline';
import chalk from 'chalk';
import { printBanner, printDivider, printSection, table, truncate, statusDot, COLORS, agentBadge } from './display';
import { getConfig, saveConfig, getConfigDir } from '../config';
import { getProvider } from '../providers';
import { loadAgents, getAgent, createAgentFile, AgentDefinition } from '../agents/loader';
import { pickAgent } from '../agents/orchestrator';
import { runAgentTurn } from '../agents/runner';
import {
  createSession, listSessions, loadSession, saveSession, deleteSession, exportSession, Session,
} from '../sessions';
import { loadAllSkills, getSkill, loadSkillFromPath } from '../skills';
import {
  connectMcp, disconnectMcp, addMcpServer, removeMcpServer, listMcpConnections,
  getMcpToolDefinitions, getMcpToolsForServer, setAutoConnect, autoConnectServers,
} from '../mcp/client';
import { MCP_STORE, CATEGORY_INFO, searchStore, getStoreEntry, getPopular, getRecommendedFor, McpCategory } from '../mcp/store';
import { runSubAgent } from '../subagent';

const COMMANDS = [
  '/model', '/agent', '/skills', '/mcp', '/session', '/sub', '/context', '/config', '/status', '/clear', '/exit', '/help',
];

const COMMAND_COMPLETIONS = [
  ...COMMANDS,
  '/model list',
  '/model set',
  '/model pull',
  '/model info',
  '/agent list',
  '/agent switch',
  '/agent show',
  '/agent new',
  '/agent reload',
  '/agent auto',
  '/skills list',
  '/skills load',
  '/skills unload',
  '/skills add',
  '/skills show',
  '/skills clear',
  '/mcp store',
  '/mcp search',
  '/mcp install',
  '/mcp popular',
  '/mcp recommend',
  '/mcp connect',
  '/mcp disconnect',
  '/mcp tools',
  '/mcp status',
  '/mcp autoconnect',
  '/mcp add',
  '/mcp remove',
  '/session list',
  '/session new',
  '/session switch',
  '/session save',
  '/session delete',
  '/session export',
  '/context clear',
  '/context compact',
  '/config set',
  '/config path',
];

function resolveUniquePrefix(input: string, candidates: string[]): string | null {
  const exact = candidates.find((c) => c === input);
  if (exact) return exact;
  const hits = candidates.filter((c) => c.startsWith(input));
  if (hits.length === 1) return hits[0] || null;
  return null;
}

async function ensureModelSelected(rl: readline.Interface, state: { currentModel: string; session: Session }): Promise<void> {
  const config = getConfig();
  const current = (state.currentModel || '').trim();
  if (current) return;

  const provider = getProvider();
  const ok = await provider.isAvailable();
  if (!ok) {
    console.log(chalk.red('\n  ✗ Cannot reach Ollama. Is it running? (ollama serve)\n'));
    return;
  }

  let models: string[] = [];
  try {
    models = await provider.listModels();
  } catch {
    models = [];
  }

  if (!models.length) {
    console.log(chalk.red('\n  ✗ No Ollama models found. Pull a model first (e.g. ollama pull llama3.2)\n'));
    return;
  }

  printSection('Select Ollama Model');
  models.forEach((m, i) => console.log(`  ${chalk.cyan(String(i + 1).padStart(2, ' '))}) ${m}`));
  console.log('');

  const answer = await new Promise<string>((res) => rl.question(chalk.cyan('  Model (name or number): '), (a) => res(a.trim())));
  const byNumber = Number(answer);
  const picked = Number.isFinite(byNumber) && byNumber >= 1 && byNumber <= models.length
    ? models[byNumber - 1]
    : models.find((m) => m === answer) || models.find((m) => m.startsWith(answer));

  if (!picked) {
    console.log(chalk.yellow('\n  ✗ Invalid selection. You can run /model list then /model set <name>\n'));
    return;
  }

  state.currentModel = picked;
  state.session.model = picked;
  saveConfig({ model: picked });
  saveSession(state.session);

  console.log(chalk.green(`\n  ✓ Model set to: ${chalk.bold(picked)}\n`));
  if (!config.model) console.log('');
}

function printCommandMenu(): void {
  console.log('');
  printSection('Available Commands');
  console.log(`  ${chalk.cyan('/model')}     ${chalk.dim('Manage Ollama models')}`);
  console.log(`  ${chalk.cyan('/agent')}     ${chalk.dim('Manage agents')}`);
  console.log(`  ${chalk.cyan('/skills')}    ${chalk.dim('Manage skills')}`);
  console.log(`  ${chalk.cyan('/mcp')}       ${chalk.dim('MCP server management')}`);
  console.log(`  ${chalk.cyan('/session')}   ${chalk.dim('Session management')}`);
  console.log(`  ${chalk.cyan('/sub')}       ${chalk.dim('Run sub-agent')}`);
  console.log(`  ${chalk.cyan('/context')}   ${chalk.dim('Manage context')}`);
  console.log(`  ${chalk.cyan('/config')}    ${chalk.dim('Configuration')}`);
  console.log(`  ${chalk.cyan('/status')}    ${chalk.dim('System status')}`);
  console.log(`  ${chalk.cyan('/clear')}     ${chalk.dim('Clear screen')}`);
  console.log(`  ${chalk.cyan('/exit')}      ${chalk.dim('Exit DevHive')}`);
  console.log('');
  console.log(chalk.dim(`  Type a command or press Tab to autocomplete`));
  console.log('');
}

function printCommandPalette(items: string[], selectedIndex: number, query: string): void {
  console.log('');
  printSection(query ? `Commands: ${query}` : 'Commands');
  const list = items.slice(0, 12);
  if (list.length === 0) {
    console.log(chalk.dim('  No matches'));
    console.log('');
    return;
  }
  list.forEach((cmd, i) => {
    const idx = i;
    const prefix = idx === selectedIndex ? chalk.hex('#F5A623')('›') : chalk.dim(' ');
    const label = idx === selectedIndex ? chalk.bold.hex('#F5A623')(cmd) : chalk.cyan(cmd);
    console.log(`  ${prefix} ${label}`);
  });
  console.log('');
}

function renderPaletteAtCursor(items: string[], selectedIndex: number, query: string): void {
  readline.cursorTo(process.stdout, 0);
  readline.clearScreenDown(process.stdout);
  printCommandPalette(items, selectedIndex, query);
}

function updatePaletteSelection(items: string[], oldIndex: number, newIndex: number, query: string): void {
  if (oldIndex === newIndex) return;
  const maxIndex = Math.min(items.length - 1, 11); // max 12 items
  const oldValid = oldIndex <= maxIndex;
  const newValid = newIndex <= maxIndex;
  
  if (oldValid) {
    // Clear old selection
    readline.cursorTo(process.stdout, 0);
    readline.moveCursor(process.stdout, 0, oldIndex + 2); // +2 for header and empty line
    readline.clearLine(process.stdout, 0);
    const oldCmd = items[oldIndex];
    process.stdout.write(`  ${chalk.dim(' ')} ${chalk.cyan(oldCmd)}`);
  }
  
  if (newValid) {
    // Draw new selection
    readline.cursorTo(process.stdout, 0);
    readline.moveCursor(process.stdout, 0, newIndex + 2);
    readline.clearLine(process.stdout, 0);
    const newCmd = items[newIndex];
    process.stdout.write(`  ${chalk.hex('#F5A623')('›')} ${chalk.bold.hex('#F5A623')(newCmd)}`);
  }
  
  // Move cursor back to prompt line
  readline.cursorTo(process.stdout, 0);
  readline.moveCursor(process.stdout, 0, maxIndex + 4); // +4 for header, empty line, and all items
}

function printHelp(cmd?: string): void {
  const cmds: Record<string, { usage: string; sub?: Record<string, string> }> = {
    '/model': {
      usage: 'Manage Ollama models',
      sub: {
        '/model': 'Show current model',
        '/model list': 'List available Ollama models',
        '/model set <name>': 'Switch to a model',
        '/model pull <name>': 'Pull a model via Ollama',
        '/model info': 'Show model details',
      },
    },
    '/agent': {
      usage: 'Manage agents',
      sub: {
        '/agent': 'Show current agent',
        '/agent list': 'List all agents',
        '/agent switch <name>': 'Switch to agent',
        '/agent show <name>': 'Show agent details',
        '/agent new': 'Create new agent interactively',
        '/agent reload': 'Reload agents from disk',
        '/agent auto': 'Enable auto-routing',
      },
    },
    '/skills': {
      usage: 'Manage skills (context injections)',
      sub: {
        '/skills': 'Show loaded skills',
        '/skills list': 'List all available skills',
        '/skills load <name>': 'Load a skill into context',
        '/skills unload <name>': 'Remove skill from context',
        '/skills add <path>': 'Add skill from file path',
        '/skills show <name>': 'Show skill content',
        '/skills clear': 'Clear all loaded skills',
      },
    },
    '/mcp': {
      usage: '/mcp [store|search|install|connect|tools|status|recommend|add|remove|autoconnect]',
      sub: {
        '/mcp':                           'Show connection status',
        '/mcp store [category]':          'Browse the MCP server store',
        '/mcp search <query>':            'Search the store',
        '/mcp install <id> [--auto]':     'Install a server from the store',
        '/mcp popular':                   'Show popular MCP servers',
        '/mcp recommend [agent]':         'Get recommendations for an agent',
        '/mcp connect <name>':            'Connect to configured server',
        '/mcp disconnect <name>':         'Disconnect from server',
        '/mcp tools [name]':              'List tools (all or per server)',
        '/mcp status [name]':             'Detailed server status',
        '/mcp autoconnect <name> on|off': 'Toggle auto-connect on startup',
        '/mcp add <name> <cmd> [args]':   'Manually add a server',
        '/mcp remove <name>':             'Remove a server',
      },
    },
    '/session': {
      usage: 'Manage sessions (persistent conversations)',
      sub: {
        '/session': 'Show current session',
        '/session list': 'List all sessions',
        '/session new <name>': 'Create a new session',
        '/session switch <name>': 'Switch to session (by ID or name)',
        '/session save': 'Save current session',
        '/session delete <id>': 'Delete a session',
        '/session export <path>': 'Export session to markdown file',
      },
    },
    '/sub': {
      usage: 'Run a focused sub-agent',
      sub: {
        '/sub <task>': 'Spawn sub-agent for a specific task',
        '/subagent <task>': 'Same as /sub',
      },
    },
    '/context': {
      usage: 'Manage conversation context',
      sub: {
        '/context': 'Show context summary',
        '/context clear': 'Clear conversation history',
        '/context compact': 'Summarize and compress context',
      },
    },
    '/config': {
      usage: 'Configuration',
      sub: {
        '/config': 'Show all config',
        '/config set <key> <value>': 'Set a config value',
        '/config path': 'Show config file location',
      },
    },
  };

  if (cmd && cmds[cmd]) {
    printSection(`Help: ${cmd}`);
    const info = cmds[cmd];
    console.log(`  ${chalk.dim(info.usage)}\n`);
    if (info.sub) {
      for (const [subcmd, desc] of Object.entries(info.sub)) {
        console.log(`  ${chalk.cyan(subcmd.padEnd(38))} ${chalk.dim(desc)}`);
      }
    }
    console.log('');
    return;
  }

  printSection('DevHive Commands');
  for (const [name, info] of Object.entries(cmds)) {
    console.log(`  ${chalk.bold.cyan(name.padEnd(12))} ${chalk.dim(info.usage)}`);
  }
  console.log('');
  console.log(`  ${chalk.cyan('/help <cmd>').padEnd(18)} ${chalk.dim('Detailed help for a command')}`);
  console.log(`  ${chalk.cyan('/status').padEnd(18)} ${chalk.dim('Full system status')}`);
  console.log(`  ${chalk.cyan('/clear').padEnd(18)} ${chalk.dim('Clear screen')}`);
  console.log(`  ${chalk.cyan('/exit').padEnd(18)} ${chalk.dim('Exit DevHive')}`);
  console.log('');
}

function printStatus(state: ChatState): void {
  const config = getConfig();
  const agents = loadAgents();
  const mcpConnections = listMcpConnections();
  const mcpCount = Object.keys(config.mcpServers).length;

  printSection('System Status');
  console.log(`  ${chalk.dim('Provider:')}  ${chalk.cyan('Ollama')} @ ${chalk.dim(config.ollamaUrl)}`);
  console.log(`  ${chalk.dim('Model:')}     ${chalk.bold.yellow(state.currentModel)}`);
  console.log(`  ${chalk.dim('Agent:')}     ${chalk.bold.cyan(state.currentAgent?.name || 'auto')} ${state.fixedAgent ? chalk.dim('[fixed]') : chalk.dim('[auto]')}`);
  console.log(`  ${chalk.dim('Session:')}   ${chalk.cyan(state.session.name)} ${chalk.dim(`(${state.session.history.length} messages)`)}`);
  console.log(`  ${chalk.dim('Skills:')}    ${state.session.loadedSkills.length > 0 ? chalk.cyan(state.session.loadedSkills.join(', ')) : chalk.dim('none')}`);
  console.log(`  ${chalk.dim('MCP:')}       ${mcpConnections.length} connected / ${mcpCount} configured`);
  console.log(`  ${chalk.dim('Agents:')}    ${agents.length} loaded`);
  console.log(`  ${chalk.dim('Config:')}    ${chalk.dim(getConfigDir())}`);
  console.log('');
}

interface ChatState {
  session: Session;
  currentAgent: AgentDefinition | null;
  fixedAgent: string | null;
  currentModel: string;
}

export async function startChat(options: { agent?: string; session?: string } = {}): Promise<void> {
  const config = getConfig();
  let session: Session;

  if (options.session) {
    const sessions = listSessions();
    const found = sessions.find((s) => s.name === options.session || s.id === options.session);
    session = found || createSession(options.session, config.model, options.agent || null);
  } else {
    const sessions = listSessions();
    if (sessions.length > 0 && sessions[0]) {
      session = sessions[0];
    } else {
      session = createSession('default', config.model, options.agent || null);
    }
  }

  const state: ChatState = {
    session,
    currentAgent: options.agent ? getAgent(options.agent) || null : null,
    fixedAgent: options.agent || null,
    currentModel: session.model || config.model,
  };

  const agents = loadAgents();
  printBanner(agents.length, state.currentModel);
  const AMBER = '#F5A623';
  const DIM_A = '#9A6614';

  // Auto-connect saved MCP servers in background (non-blocking)
  autoConnectServers().then(() => {
    const liveCount = listMcpConnections().length;
    if (liveCount > 0) {
      const totalTools = listMcpConnections().reduce((n, c) => n + c.toolCount, 0);
      process.stdout.write(chalk.hex(DIM_A)(`  ⬡ MCP: ${liveCount} server(s) connected, ${totalTools} tools active\n`));
    }
  }).catch(() => {});

  console.log(chalk.hex(DIM_A)(`  Session: `) + chalk.hex(AMBER)(state.session.name) + chalk.hex(DIM_A)('  |  Model: ') + chalk.bold.hex(AMBER)(state.currentModel) + chalk.hex(DIM_A)(`  |  ${agents.length} agents  |  Type `) + chalk.hex(AMBER)('/help') + chalk.hex(DIM_A)(' for commands'));
  console.log('');

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: true,
    completer: (line: string) => {
      const trimmed = line.trimStart();
      if (!trimmed.startsWith('/')) return [[], line];
      const hits = COMMAND_COMPLETIONS.filter((c) => c.startsWith(trimmed));
      return [hits.length ? hits : COMMAND_COMPLETIONS, line];
    },
  });

  await ensureModelSelected(rl, state);

  // Show commands when user starts typing a slash command (without requiring Enter)
  // and enable Tab completion via the completer above.
  let didShowSlashMenu = false;
  let paletteOpen = false;
  let paletteQuery = '';
  let paletteItems: string[] = [];
  let paletteIndex = 0;
  let suppressNextLine = false;

  function getPaletteQueryFromLine(): string {
    const raw = rl.line || '';
    const trimmed = raw.trimStart();
    if (!trimmed.startsWith('/')) return '';
    return trimmed;
  }

  function updatePaletteFromLine(): void {
    paletteQuery = getPaletteQueryFromLine();
    paletteItems = COMMAND_COMPLETIONS.filter((c) => c.startsWith(paletteQuery));
    if (paletteItems.length === 0 && paletteQuery === '/') {
      paletteItems = [...COMMANDS];
    }
    paletteIndex = Math.max(0, Math.min(paletteIndex, Math.max(0, paletteItems.length - 1)));
  }

  function openPalette(): void {
    paletteOpen = true;
    paletteIndex = 0;
    updatePaletteFromLine();
    renderPaletteAtCursor(paletteItems, paletteIndex, paletteQuery);
  }

  function closePalette(): void {
    if (!paletteOpen) return;
    paletteOpen = false;
    readline.cursorTo(process.stdout, 0);
    readline.clearScreenDown(process.stdout);
    rl.setPrompt(prompt());
    rl.prompt();
  }

  function redrawPalette(): void {
    if (!paletteOpen) return;
    updatePaletteFromLine();
    renderPaletteAtCursor(paletteItems, paletteIndex, paletteQuery);
  }

  async function acceptPaletteSelection(): Promise<void> {
    if (!paletteOpen) return;
    const selected = paletteItems[paletteIndex];
    if (!selected) {
      closePalette();
      return;
    }
    
    closePalette();
    // Clear rl line and overwrite it with selected command before executing
    (rl as any).line = '';
    (rl as any).cursor = 0;
    
    await handleCommand(selected);
    rl.setPrompt(prompt());
    rl.prompt();
  }

  // Intercept keystrokes to handle palette navigation without triggering default readline behaviors
  const originalTtyWrite = (rl as any)._ttyWrite;
  (rl as any)._ttyWrite = function (d: string, key: any) {
    const current = rl.line.trim();

    if (paletteOpen) {
      if (key && key.name === 'up') {
        const oldIndex = paletteIndex;
        paletteIndex = Math.max(0, paletteIndex - 1);
        updatePaletteSelection(paletteItems, oldIndex, paletteIndex, paletteQuery);
        return;
      }
      if (key && key.name === 'down') {
        const oldIndex = paletteIndex;
        paletteIndex = Math.min(Math.max(0, paletteItems.length - 1), paletteIndex + 1);
        updatePaletteSelection(paletteItems, oldIndex, paletteIndex, paletteQuery);
        return;
      }
      if (key && key.name === 'return') {
        void acceptPaletteSelection();
        return;
      }
      if (key && key.name === 'escape') {
        closePalette();
        return;
      }
      
      // Let readline process this key, then redraw
      const res = originalTtyWrite.call(this, d, key);
      const q = getPaletteQueryFromLine();
      if (!q.startsWith('/')) {
        closePalette();
      } else {
        redrawPalette();
      }
      return res;
    }

    if (current.length === 0) {
      didShowSlashMenu = false;
    }

    const res = originalTtyWrite.call(this, d, key);
    
    const afterCurrent = rl.line.trim();
    if (!didShowSlashMenu && (afterCurrent === '/' || (afterCurrent === '' && d === '/'))) {
      didShowSlashMenu = true;
      openPalette();
    }
    
    return res;
  };

  function prompt(): string {
    const agentLabel = state.currentAgent ? agentBadge(state.currentAgent.name) : chalk.dim('[auto]');
    const sessionLabel = chalk.hex('#9A6614')(`{${state.session.name}}`);
    return `\n ${sessionLabel} ${agentLabel} ${chalk.bold.white('you')} ${chalk.hex('#9A6614')('›')} `;
  }

  async function handleCommand(line: string): Promise<void> {
    const parts = line.slice(1).trim().split(/\s+/);
    const cmdRaw = parts[0]?.toLowerCase() || '';
    const subRaw = parts[1]?.toLowerCase() || '';
    const args = parts.slice(2);

    // Show command menu when just "/" is typed
    if (line.trim() === '/') {
      printCommandMenu();
      return;
    }

    const topCandidates = COMMANDS.map((c) => c.slice(1));
    const resolvedCmd = resolveUniquePrefix(cmdRaw, topCandidates) || cmdRaw;

    if (resolvedCmd !== cmdRaw) {
      const rest = parts.slice(1).join(' ');
      await handleCommand(`/${resolvedCmd}${rest ? ' ' + rest : ''}`);
      return;
    }

    if (resolvedCmd === 'model') {
      const modelSubs = ['info', 'list', 'set', 'pull'];
      const resolvedSub = subRaw ? (resolveUniquePrefix(subRaw, modelSubs) || subRaw) : '';
      if (resolvedSub && resolvedSub !== subRaw) {
        const rest = parts.slice(2).join(' ');
        await handleCommand(`/model ${resolvedSub}${rest ? ' ' + rest : ''}`);
        return;
      }
    }

    if (resolvedCmd === 'agent') {
      const agentSubs = ['info', 'list', 'switch', 'show', 'new', 'reload', 'auto'];
      const resolvedSub = subRaw ? (resolveUniquePrefix(subRaw, agentSubs) || subRaw) : '';
      if (resolvedSub && resolvedSub !== subRaw) {
        const rest = parts.slice(2).join(' ');
        await handleCommand(`/agent ${resolvedSub}${rest ? ' ' + rest : ''}`);
        return;
      }
    }

    if (resolvedCmd === 'skills' || resolvedCmd === 'skill') {
      const skillSubs = ['list', 'load', 'unload', 'add', 'show', 'clear'];
      const resolvedSub = subRaw ? (resolveUniquePrefix(subRaw, skillSubs) || subRaw) : '';
      if (resolvedSub && resolvedSub !== subRaw) {
        const rest = parts.slice(2).join(' ');
        await handleCommand(`/${resolvedCmd} ${resolvedSub}${rest ? ' ' + rest : ''}`);
        return;
      }
    }

    const cmd = resolvedCmd;
    const sub = subRaw;

    switch (cmd) {
      case 'help':
        printHelp(sub ? `/${sub}` : undefined);
        break;

      case 'status':
        printStatus(state);
        break;

      case 'clear':
        console.clear();
        printBanner(loadAgents().length, state.currentModel);
        break;

      case 'exit':
      case 'quit':
        saveSession(state.session);
        console.log(chalk.dim('\n  Session saved. Goodbye! 👋\n'));
        rl.close();
        process.exit(0);
        break;

      // ─── MODEL ────────────────────────────────────────────────
      case 'model': {
        if (!sub || sub === 'info') {
          const ollamaAvailable = await getProvider().isAvailable();
          console.log('');
          console.log(`  ${chalk.dim('Current model:')} ${chalk.bold.yellow(state.currentModel)}`);
          console.log(`  ${chalk.dim('Ollama status:')} ${statusDot(ollamaAvailable)} ${ollamaAvailable ? chalk.green('connected') : chalk.red('offline')}`);
          console.log(`  ${chalk.dim('Ollama URL:')}    ${chalk.dim(config.ollamaUrl)}`);
          console.log('');
        } else if (sub === 'list') {
          process.stdout.write(chalk.dim('  Fetching models...\r'));
          try {
            const models = await getProvider().listModels();
            printSection('Available Ollama Models');
            models.forEach((m) => console.log(`  ${chalk.cyan('▸')} ${m}`));
            console.log('');
          } catch {
            console.log(chalk.red('  ✗ Cannot reach Ollama. Is it running? (ollama serve)'));
          }
        } else if (sub === 'set') {
          const modelName = args[0] || parts[2];
          if (!modelName) { console.log(chalk.yellow('  Usage: /model set <name>\n')); break; }
          state.currentModel = modelName;
          state.session.model = modelName;
          saveConfig({ model: modelName });
          saveSession(state.session);
          console.log(chalk.green(`  ✓ Model set to: ${chalk.bold(modelName)}\n`));
        } else if (sub === 'pull') {
          const modelName = args[0] || parts[2];
          if (!modelName) { console.log(chalk.yellow('  Usage: /model pull <name>\n')); break; }
          console.log(chalk.dim(`  Pulling ${modelName} via Ollama...\n`));
          const { runShellTool } = await import('../tools/shell');
          const result = await runShellTool.execute({ command: `ollama pull ${modelName}`, timeout: '120' });
          console.log('  ' + result + '\n');
        } else {
          const modelName = sub;
          state.currentModel = modelName;
          state.session.model = modelName;
          saveConfig({ model: modelName });
          saveSession(state.session);
          console.log(chalk.green(`  ✓ Model set to: ${chalk.bold(modelName)}\n`));
        }
        break;
      }

      // ─── AGENT ────────────────────────────────────────────────
      case 'agent': {
        const agentsList = loadAgents(true);

        if (!sub || sub === 'info') {
          if (state.currentAgent) {
            printSection(`Agent: ${state.currentAgent.name}`);
            console.log(`  ${chalk.dim('Description:')} ${state.currentAgent.description}`);
            console.log(`  ${chalk.dim('Model:')}       ${state.currentAgent.model || chalk.dim('(uses global)')}`);
            console.log(`  ${chalk.dim('Tools:')}       ${state.currentAgent.tools.join(', ')}`);
            console.log(`  ${chalk.dim('File:')}        ${chalk.dim(state.currentAgent.filePath)}`);
            console.log('');
          } else {
            console.log(`\n  ${chalk.dim('Mode:')} ${chalk.cyan('auto')} — agent is selected automatically per message\n`);
          }
        } else if (sub === 'list') {
          printSection('Available Agents');
          const rows = agentsList.map((a) => ({
            'Name': a.name,
            'Description': truncate(a.description, 42),
            'Tools': a.tools.length.toString(),
            'Model': a.model || chalk.dim('global'),
          }));
          console.log(table(rows, ['Name', 'Description', 'Tools', 'Model']));
        } else if (sub === 'switch') {
          const agentName = args[0] || parts[2];
          if (!agentName) { console.log(chalk.yellow('  Usage: /agent switch <name>\n')); break; }
          const found = agentsList.find((a) => a.name === agentName);
          if (found) {
            state.currentAgent = found;
            state.fixedAgent = found.name;
            state.session.agentName = found.name;
            saveSession(state.session);
            console.log(chalk.green(`  ✓ Switched to agent: ${chalk.bold(found.name)}\n`));
          } else {
            console.log(chalk.red(`  ✗ Agent "${agentName}" not found\n`));
          }
        } else if (sub === 'show') {
          const agentName = args[0] || parts[2];
          const found = agentsList.find((a) => a.name === agentName);
          if (!found) { console.log(chalk.red(`  ✗ Agent "${agentName}" not found\n`)); break; }
          printSection(`Agent: ${found.name}`);
          console.log(`  ${chalk.dim('Description:')} ${found.description}`);
          console.log(`  ${chalk.dim('Tools:')}       ${found.tools.join(', ')}`);
          console.log(`  ${chalk.dim('Model:')}       ${found.model || chalk.dim('(uses global)')}`);
          console.log(`  ${chalk.dim('File:')}        ${chalk.dim(found.filePath)}`);
          console.log('');
          printDivider('System Prompt');
          console.log(chalk.dim(found.systemPrompt.split('\n').slice(0, 8).map((l) => '  ' + l).join('\n')));
          console.log('');
        } else if (sub === 'auto') {
          state.currentAgent = null;
          state.fixedAgent = null;
          state.session.agentName = null;
          saveSession(state.session);
          console.log(chalk.green('  ✓ Auto-routing enabled\n'));
        } else if (sub === 'reload') {
          loadAgents(true);
          console.log(chalk.green(`  ✓ Reloaded ${loadAgents().length} agents\n`));
        } else if (sub === 'new') {
          await interactiveCreateAgent(rl, state);
        } else {
          const found = agentsList.find((a) => a.name === sub);
          if (found) {
            state.currentAgent = found;
            state.fixedAgent = found.name;
            state.session.agentName = found.name;
            saveSession(state.session);
            console.log(chalk.green(`  ✓ Switched to agent: ${chalk.bold(found.name)}\n`));
          } else {
            console.log(chalk.red(`  ✗ Unknown agent "${sub}". Try /agent list\n`));
          }
        }
        break;
      }

      // ─── SKILLS ───────────────────────────────────────────────
      case 'skills':
      case 'skill': {
        const allSkills = loadAllSkills();

        if (!sub) {
          printSection('Loaded Skills');
          if (state.session.loadedSkills.length === 0) {
            console.log(chalk.dim('  No skills loaded. Use /skills load <name>\n'));
          } else {
            state.session.loadedSkills.forEach((s) => console.log(`  ${chalk.green('●')} ${s}`));
            console.log('');
          }
        } else if (sub === 'list') {
          printSection('Available Skills');
          if (allSkills.length === 0) {
            console.log(chalk.dim('  No skills found in skill directories.\n'));
          } else {
            const rows = allSkills.map((s) => ({
              'Name': s.name,
              'Description': truncate(s.description, 48),
              'Tags': s.tags.join(', ') || chalk.dim('—'),
            }));
            console.log(table(rows, ['Name', 'Description', 'Tags']));
          }
        } else if (sub === 'load') {
          const skillName = args[0] || parts[2];
          if (!skillName) { console.log(chalk.yellow('  Usage: /skills load <name>\n')); break; }
          const skill = getSkill(skillName);
          if (!skill) { console.log(chalk.red(`  ✗ Skill "${skillName}" not found. Try /skills list\n`)); break; }
          if (!state.session.loadedSkills.includes(skill.name)) {
            state.session.loadedSkills.push(skill.name);
            saveSession(state.session);
            console.log(chalk.green(`  ✓ Skill loaded: ${chalk.bold(skill.name)}\n`));
          } else {
            console.log(chalk.dim(`  Already loaded: ${skillName}\n`));
          }
        } else if (sub === 'unload') {
          const skillName = args[0] || parts[2];
          state.session.loadedSkills = state.session.loadedSkills.filter((s) => s !== skillName);
          saveSession(state.session);
          console.log(chalk.green(`  ✓ Skill unloaded: ${skillName}\n`));
        } else if (sub === 'add') {
          const filePath = args[0] || parts[2];
          if (!filePath) { console.log(chalk.yellow('  Usage: /skills add <file-path>\n')); break; }
          const skill = loadSkillFromPath(filePath);
          if (!skill) { console.log(chalk.red(`  ✗ Cannot load skill from: ${filePath}\n`)); break; }
          if (!state.session.loadedSkills.includes(skill.name)) {
            state.session.loadedSkills.push(skill.name);
            saveSession(state.session);
          }
          console.log(chalk.green(`  ✓ Skill added and loaded: ${chalk.bold(skill.name)}\n`));
        } else if (sub === 'show') {
          const skillName = args[0] || parts[2];
          const skill = getSkill(skillName);
          if (!skill) { console.log(chalk.red(`  ✗ Skill "${skillName}" not found\n`)); break; }
          printSection(`Skill: ${skill.name}`);
          console.log(chalk.dim(`  ${skill.description}\n`));
          printDivider('Content');
          console.log(skill.content.split('\n').slice(0, 20).map((l) => chalk.dim('  ' + l)).join('\n'));
          console.log('');
        } else if (sub === 'clear') {
          state.session.loadedSkills = [];
          saveSession(state.session);
          console.log(chalk.green('  ✓ All skills cleared\n'));
        }
        break;
      }

      // ─── MCP ──────────────────────────────────────────────────
      case 'mcp': {
        const mcpConfig = getConfig().mcpServers;
        const liveConns = listMcpConnections();
        const AMBER = '#F5A623';

        // ── /mcp  (status overview) ────────────────────────────
        if (!sub) {
          printSection('MCP Connections');
          if (Object.keys(mcpConfig).length === 0) {
            console.log(chalk.dim('  No MCP servers configured.\n'));
            console.log(`  ${chalk.hex(AMBER)('/mcp store')}     ${chalk.dim('— browse the MCP server store')}`);
            console.log(`  ${chalk.hex(AMBER)('/mcp popular')}   ${chalk.dim('— see popular servers')}`);
            console.log('');
          } else {
            const rows = Object.entries(mcpConfig).map(([name, srv]) => {
              const conn = liveConns.find((c) => c.name === name);
              const autoC = (srv as { autoConnect?: boolean }).autoConnect;
              return {
                'Server':    chalk.bold(name),
                'Status':    conn ? chalk.green('● connected') : chalk.dim('○ offline'),
                'Tools':     conn ? chalk.hex(AMBER)(conn.toolCount.toString()) : chalk.dim('—'),
                'Resources': conn ? conn.resourceCount.toString() : chalk.dim('—'),
                'Calls':     conn ? conn.callCount.toString() : chalk.dim('—'),
                'Auto':      autoC ? chalk.green('✓') : chalk.dim('—'),
              };
            });
            console.log(table(rows, ['Server', 'Status', 'Tools', 'Resources', 'Calls', 'Auto']));
            const totalTools = liveConns.reduce((n, c) => n + c.toolCount, 0);
            if (totalTools > 0)
              console.log(chalk.dim(`  ${totalTools} tools active across ${liveConns.length} server(s)\n`));
          }

        // ── /mcp store [category] ──────────────────────────────
        } else if (sub === 'store') {
          const catFilter = args[0] as McpCategory | undefined;

          if (!catFilter) {
            printSection('⬡  MCP Server Store');
            console.log(chalk.dim('  Curated MCP servers for DevHive agents\n'));
            for (const [cat, info] of Object.entries(CATEGORY_INFO)) {
              const entries = MCP_STORE.filter((e) => e.category === cat);
              if (!entries.length) continue;
              console.log(`  ${info.icon}  ${chalk.bold.hex(AMBER)(info.label)}  ${chalk.dim(info.description)}`);
              entries.forEach((e) => {
                const badge = e.popular ? chalk.hex(AMBER)(' ★') : '';
                const installed = mcpConfig[e.id] ? chalk.green(' ✓') : '';
                console.log(`     ${chalk.bold(e.id.padEnd(22))}${badge}${installed}  ${chalk.dim(truncate(e.description, 55))}`);
              });
              console.log('');
            }
            console.log(chalk.dim(`  ${chalk.hex(AMBER)('/mcp install <id>')} to install   ${chalk.hex(AMBER)('/mcp search <q>')} to search\n`));

          } else {
            const info = CATEGORY_INFO[catFilter];
            if (!info) { console.log(chalk.red(`  Unknown category "${catFilter}". Categories: ${Object.keys(CATEGORY_INFO).join(', ')}\n`)); break; }
            printSection(`${info.icon} ${info.label}`);
            MCP_STORE.filter((e) => e.category === catFilter).forEach((e) => {
              const installed = mcpConfig[e.id] ? chalk.green(' [installed]') : '';
              console.log(`  ${chalk.bold.hex(AMBER)(e.id)}${installed}`);
              console.log(`    ${chalk.dim(e.description)}`);
              if (e.envRequired?.length) console.log(`    ${chalk.dim('Requires env:')} ${e.envRequired.join(', ')}`);
              if (e.agentRecommended?.length) console.log(`    ${chalk.dim('Best for:')} ${e.agentRecommended.join(', ')}`);
              if (e.homepage) console.log(`    ${chalk.dim(e.homepage)}`);
              console.log('');
            });
          }

        // ── /mcp search <query> ────────────────────────────────
        } else if (sub === 'search') {
          const query = args.join(' ');
          if (!query) { console.log(chalk.yellow('  Usage: /mcp search <query>\n')); break; }
          const results = searchStore(query);
          printSection(`Store Results: "${query}"`);
          if (!results.length) {
            console.log(chalk.dim(`  No results for "${query}"\n`));
          } else {
            results.forEach((e) => {
              const catInfo = CATEGORY_INFO[e.category];
              const installed = mcpConfig[e.id] ? chalk.green(' [installed]') : '';
              console.log(`  ${catInfo.icon} ${chalk.bold.hex(AMBER)(e.id)}${installed}  ${chalk.dim(catInfo.label)}`);
              console.log(`    ${chalk.dim(e.description)}`);
              if (e.envRequired?.length) console.log(`    ${chalk.dim('Requires: ')}${e.envRequired.join(', ')}`);
              console.log('');
            });
            console.log(chalk.dim(`  Run /mcp install <id> to install\n`));
          }

        // ── /mcp popular ──────────────────────────────────────
        } else if (sub === 'popular') {
          printSection('★  Popular MCP Servers');
          getPopular().forEach((e) => {
            const catInfo = CATEGORY_INFO[e.category];
            const installed = mcpConfig[e.id] ? chalk.green(' ✓ installed') : '';
            console.log(`  ${catInfo.icon} ${chalk.bold.hex(AMBER)(e.id)}${installed}`);
            console.log(`    ${chalk.dim(e.description)}`);
            if (e.envRequired?.length) console.log(`    ${chalk.dim('Requires: ')}${chalk.yellow(e.envRequired.join(', '))}`);
            console.log(`    ${chalk.dim('Recommended for:')} ${e.agentRecommended?.join(', ') || '—'}`);
            console.log('');
          });

        // ── /mcp install <id> [--auto] ────────────────────────
        } else if (sub === 'install') {
          const id = args[0];
          const autoFlag = args.includes('--auto');
          if (!id) { console.log(chalk.yellow('  Usage: /mcp install <store-id> [--auto]\n')); break; }

          const entry = getStoreEntry(id);
          if (!entry) {
            console.log(chalk.red(`  ✗ "${id}" not found in store. Use /mcp search <query> to find servers.\n`));
            break;
          }

          if (mcpConfig[id]) {
            console.log(chalk.dim(`  "${id}" is already installed. Use /mcp connect ${id} to connect.\n`));
            break;
          }

          if (entry.envRequired?.length) {
            const missing = entry.envRequired.filter((k) => !process.env[k]);
            if (missing.length) {
              console.log(chalk.yellow(`  ⚠ This server requires environment variables:\n`));
              missing.forEach((k) => console.log(`    ${chalk.red('✗')} ${k}  ${chalk.dim('(not set)')}`));
              console.log('');
              console.log(chalk.dim('  Set them first with: export VAR_NAME=value\n'));
            }
          }

          addMcpServer(id, entry.command, entry.args, entry.envRequired ? Object.fromEntries((entry.envRequired).map((k) => [k, process.env[k] || ''])) : undefined, autoFlag);

          console.log(chalk.green(`  ✓ Installed "${entry.name}"\n`));
          console.log(`    ${chalk.dim('Command:')} ${entry.command} ${entry.args.join(' ')}`);
          if (autoFlag) console.log(`    ${chalk.green('Auto-connect:')} enabled`);
          console.log('');
          console.log(chalk.dim(`  Run /mcp connect ${id} to connect now\n`));

        // ── /mcp recommend [agent] ────────────────────────────
        } else if (sub === 'recommend') {
          const agentName = args[0] || state.currentAgent?.name;
          if (!agentName) {
            console.log(chalk.dim('  No agent active. Usage: /mcp recommend <agent-name>\n'));
            break;
          }
          const recs = getRecommendedFor(agentName);
          printSection(`MCP Recommendations for: ${agentName}`);
          if (!recs.length) {
            console.log(chalk.dim(`  No specific recommendations for "${agentName}"\n`));
          } else {
            recs.forEach((e) => {
              const catInfo = CATEGORY_INFO[e.category];
              const status = mcpConfig[e.id]
                ? liveConns.find((c) => c.name === e.id)
                  ? chalk.green(' ● active')
                  : chalk.dim(' ○ installed')
                : chalk.dim(' — not installed');
              console.log(`  ${catInfo.icon} ${chalk.bold.hex(AMBER)(e.id)}${status}`);
              console.log(`    ${chalk.dim(e.description)}`);
              if (!mcpConfig[e.id]) console.log(`    ${chalk.dim('/mcp install ' + e.id)}`);
              console.log('');
            });
          }

        // ── /mcp connect <name> ───────────────────────────────
        } else if (sub === 'connect') {
          const name = args[0] || parts[2];
          if (!name) { console.log(chalk.yellow('  Usage: /mcp connect <name>\n')); break; }
          process.stdout.write(chalk.hex('#9A6614')(`  ⬡ Connecting to "${name}"...\r`));
          const result = await connectMcp(name);
          process.stdout.write(' '.repeat(50) + '\r');
          console.log('  ' + result + '\n');

        // ── /mcp disconnect <name> ────────────────────────────
        } else if (sub === 'disconnect') {
          const name = args[0] || parts[2];
          if (!name) { console.log(chalk.yellow('  Usage: /mcp disconnect <name>\n')); break; }
          console.log('  ' + disconnectMcp(name) + '\n');

        // ── /mcp tools [name] ─────────────────────────────────
        } else if (sub === 'tools') {
          const name = args[0] || parts[2];
          if (!name) {
            printSection('MCP Tools — All Connected Servers');
            const allDefs = getMcpToolDefinitions();
            if (allDefs.length === 0) {
              console.log(chalk.dim('  No MCP tools available. Connect a server first.\n'));
              break;
            }
            let lastServer = '';
            allDefs.forEach((t) => {
              const srv = t.function.name.split('__')[1];
              if (srv !== lastServer) {
                console.log(`\n  ${chalk.bold.hex(AMBER)(srv)}`);
                lastServer = srv;
              }
              const toolShort = t.function.name.split('__').slice(2).join('__');
              console.log(`    ${chalk.dim('▸')} ${chalk.bold(toolShort.padEnd(28))} ${chalk.dim(truncate(t.function.description.replace(/^\[MCP:[^\]]+\] /, ''), 50))}`);
            });
            console.log('');
          } else {
            const tools = getMcpToolsForServer(name);
            if (!tools.length) { console.log(chalk.red(`  ✗ Not connected to "${name}" or no tools\n`)); break; }
            printSection(`Tools: ${name} (${tools.length})`);
            tools.forEach((t) => {
              const required = t.inputSchema?.required?.length ? `  [required: ${t.inputSchema.required.join(', ')}]` : '';
              console.log(`  ${chalk.hex(AMBER)('▸')} ${chalk.bold(t.name)}`);
              console.log(`    ${chalk.dim(t.description)}${chalk.dim(required)}`);
              if (t.inputSchema?.properties && Object.keys(t.inputSchema.properties).length) {
                Object.entries(t.inputSchema.properties).forEach(([k, v]) => {
                  console.log(`      ${chalk.dim('·')} ${k.padEnd(16)} ${chalk.dim((v as { type?: string }).type || 'any')}`);
                });
              }
              console.log('');
            });
          }

        // ── /mcp status [name] ────────────────────────────────
        } else if (sub === 'status') {
          const name = args[0];
          if (name) {
            const conn = liveConns.find((c) => c.name === name);
            const cfg = mcpConfig[name];
            if (!cfg && !conn) { console.log(chalk.red(`  ✗ Server "${name}" not found\n`)); break; }
            printSection(`MCP Status: ${name}`);
            if (!conn) {
              console.log(`  ${chalk.dim('Status:')}     ${chalk.dim('○ offline')}`);
              if (cfg) console.log(`  ${chalk.dim('Command:')}    ${cfg.command} ${cfg.args.join(' ')}`);
            } else {
              console.log(`  ${chalk.dim('Status:')}     ${chalk.green('● connected')}`);
              console.log(`  ${chalk.dim('Server:')}     ${conn.serverInfo?.name || name}${conn.serverInfo?.version ? ' ' + conn.serverInfo.version : ''}`);
              console.log(`  ${chalk.dim('Tools:')}      ${chalk.hex(AMBER)(conn.toolCount.toString())}`);
              console.log(`  ${chalk.dim('Resources:')}  ${conn.resourceCount}`);
              console.log(`  ${chalk.dim('Calls:')}      ${conn.callCount}`);
              if (conn.connectedAt) console.log(`  ${chalk.dim('Connected:')}  ${conn.connectedAt.toLocaleTimeString()}`);
              if (conn.lastError) console.log(`  ${chalk.dim('Last error:')} ${chalk.red(conn.lastError)}`);
              console.log('');
              if (conn.tools.length) {
                console.log(`  ${chalk.dim('Tool list:')}`);
                conn.tools.forEach((t) => console.log(`    ${chalk.dim('·')} ${t}`));
              }
            }
            console.log('');
          } else {
            printSection('MCP Status — All Servers');
            if (liveConns.length === 0) {
              console.log(chalk.dim('  No active connections\n'));
            } else {
              liveConns.forEach((c) => {
                console.log(`  ${chalk.green('●')} ${chalk.bold.hex(AMBER)(c.name)}  ${chalk.dim(`${c.toolCount} tools · ${c.callCount} calls`)}`);
              });
              console.log('');
            }
          }

        // ── /mcp autoconnect <name> on|off ────────────────────
        } else if (sub === 'autoconnect') {
          const name = args[0];
          const toggle = args[1];
          if (!name || !toggle) { console.log(chalk.yellow('  Usage: /mcp autoconnect <name> on|off\n')); break; }
          if (!mcpConfig[name]) { console.log(chalk.red(`  ✗ Server "${name}" not configured\n`)); break; }
          const enabled = toggle === 'on';
          setAutoConnect(name, enabled);
          console.log(chalk.green(`  ✓ Auto-connect ${enabled ? 'enabled' : 'disabled'} for "${name}"\n`));

        // ── /mcp add <name> <cmd> [args] ──────────────────────
        } else if (sub === 'add' || sub === 'list') {
          if (sub === 'list') {
            printSection('Configured MCP Servers');
            if (Object.keys(mcpConfig).length === 0) {
              console.log(chalk.dim('  None configured. Try /mcp store to browse available servers.\n'));
            } else {
              for (const [name, srv] of Object.entries(mcpConfig)) {
                const conn = liveConns.find((c) => c.name === name);
                console.log(`  ${conn ? chalk.green('●') : chalk.dim('○')} ${chalk.bold(name)}`);
                console.log(`    ${chalk.dim('Command:')} ${srv.command} ${srv.args.join(' ')}`);
                if (conn) console.log(`    ${chalk.dim('Tools:')}   ${conn.toolCount}  ${chalk.dim('Calls:')} ${conn.callCount}`);
                console.log('');
              }
            }
          } else {
            const name = args[0];
            const mcpCmd = args[1];
            const mcpArgs = args.slice(2);
            if (!name || !mcpCmd) { console.log(chalk.yellow('  Usage: /mcp add <name> <command> [args...]\n')); break; }
            addMcpServer(name, mcpCmd, mcpArgs);
            console.log(chalk.green(`  ✓ Added "${name}". Run /mcp connect ${name} to start.\n`));
          }

        // ── /mcp remove <name> ────────────────────────────────
        } else if (sub === 'remove') {
          const name = args[0] || parts[2];
          if (!name) { console.log(chalk.yellow('  Usage: /mcp remove <name>\n')); break; }
          const removed = removeMcpServer(name);
          console.log(removed ? chalk.green(`  ✓ Removed "${name}"\n`) : chalk.red(`  ✗ Server "${name}" not found\n`));
        }

        break;
      }

      // ─── SESSION ──────────────────────────────────────────────
      case 'session': {
        if (!sub) {
          printSection(`Current Session: ${state.session.name}`);
          console.log(`  ${chalk.dim('ID:')}       ${chalk.dim(state.session.id)}`);
          console.log(`  ${chalk.dim('Messages:')} ${state.session.history.length}`);
          console.log(`  ${chalk.dim('Agent:')}    ${state.session.agentName || chalk.dim('auto')}`);
          console.log(`  ${chalk.dim('Model:')}    ${state.session.model}`);
          console.log(`  ${chalk.dim('Skills:')}   ${state.session.loadedSkills.join(', ') || chalk.dim('none')}`);
          console.log(`  ${chalk.dim('Created:')}  ${state.session.createdAt}`);
          console.log('');
        } else if (sub === 'list') {
          const sessions = listSessions();
          printSection('Sessions');
          if (sessions.length === 0) { console.log(chalk.dim('  No saved sessions.\n')); break; }
          const rows = sessions.map((s) => ({
            'Name': s.name === state.session.name ? chalk.cyan(s.name + ' ◀') : s.name,
            'Messages': s.messageCount.toString(),
            'Agent': s.agentName || chalk.dim('auto'),
            'Updated': s.updatedAt.split('T')[0],
          }));
          console.log(table(rows, ['Name', 'Messages', 'Agent', 'Updated']));
        } else if (sub === 'new') {
          const name = args[0] || parts[2] || `session-${Date.now()}`;
          saveSession(state.session);
          const newSess = createSession(name, state.currentModel, state.fixedAgent);
          state.session = newSess;
          state.session.history = [];
          console.log(chalk.green(`  ✓ New session: ${chalk.bold(name)}\n`));
        } else if (sub === 'switch') {
          const query = args[0] || parts[2];
          if (!query) { console.log(chalk.yellow('  Usage: /session switch <name-or-id>\n')); break; }
          const sessions = listSessions();
          const found = sessions.find((s) => s.name === query || s.id === query || s.id.startsWith(query));
          if (!found) { console.log(chalk.red(`  ✗ Session "${query}" not found. Try /session list\n`)); break; }
          saveSession(state.session);
          state.session = found;
          state.currentModel = found.model;
          state.currentAgent = found.agentName ? getAgent(found.agentName) || null : null;
          state.fixedAgent = found.agentName;
          console.log(chalk.green(`  ✓ Switched to session: ${chalk.bold(found.name)} (${found.history.length} messages)\n`));
        } else if (sub === 'save') {
          saveSession(state.session);
          console.log(chalk.green(`  ✓ Session saved: ${state.session.name}\n`));
        } else if (sub === 'delete') {
          const id = args[0] || parts[2];
          if (!id) { console.log(chalk.yellow('  Usage: /session delete <id>\n')); break; }
          const sessions = listSessions();
          const found = sessions.find((s) => s.name === id || s.id === id || s.id.startsWith(id));
          if (!found) { console.log(chalk.red(`  ✗ Session not found\n`)); break; }
          if (found.id === state.session.id) { console.log(chalk.yellow('  Cannot delete the current session\n')); break; }
          deleteSession(found.id);
          console.log(chalk.green(`  ✓ Deleted session: ${found.name}\n`));
        } else if (sub === 'export') {
          const filePath = args[0] || parts[2] || `./devhive-session-${state.session.name}.md`;
          exportSession(state.session, filePath);
          console.log(chalk.green(`  ✓ Exported to: ${filePath}\n`));
        }
        break;
      }

      // ─── CONTEXT ──────────────────────────────────────────────
      case 'context': {
        if (!sub) {
          const h = state.session.history;
          printSection('Context Summary');
          console.log(`  ${chalk.dim('Messages:')} ${h.length}`);
          const userMsgs = h.filter((m) => m.role === 'user');
          const assistantMsgs = h.filter((m) => m.role === 'assistant');
          console.log(`  ${chalk.dim('User:')}     ${userMsgs.length}`);
          console.log(`  ${chalk.dim('Assistant:')} ${assistantMsgs.length}`);
          const totalChars = h.reduce((s, m) => s + m.content.length, 0);
          console.log(`  ${chalk.dim('Total chars:')} ~${totalChars.toLocaleString()}`);
          console.log(`  ${chalk.dim('Skills:')}   ${state.session.loadedSkills.join(', ') || 'none'}`);
          if (userMsgs.length > 0) {
            console.log('');
            printDivider('Last 3 exchanges');
            const recent = state.session.history.slice(-6);
            for (const m of recent) {
              if (m.role === 'system' || m.role === 'tool') continue;
              const label = m.role === 'user' ? chalk.cyan('  You') : chalk.bold.hex('#F5A623')('  Hive');
              console.log(`${label}: ${chalk.dim(truncate(m.content, 80))}`);
            }
          }
          console.log('');
        } else if (sub === 'clear') {
          state.session.history = [];
          saveSession(state.session);
          console.log(chalk.green('  ✓ Context cleared\n'));
        } else if (sub === 'compact') {
          if (state.session.history.length < 10) {
            console.log(chalk.dim('  Context is already short, no need to compact.\n'));
            break;
          }
          process.stdout.write(chalk.dim('  Compacting context...\r'));
          const provider = getProvider();
          let summary = '';
          const histText = state.session.history
            .filter((m) => m.role !== 'system' && m.role !== 'tool')
            .map((m) => `${m.role}: ${m.content}`)
            .join('\n\n');
          await provider.chat(
            [{ role: 'user', content: `Summarize this conversation concisely:\n\n${histText}` }],
            [],
            state.currentModel,
            (chunk) => { if (chunk.content) summary += chunk.content; }
          );
          state.session.history = [{ role: 'assistant', content: `[Context summary]: ${summary}` }];
          saveSession(state.session);
          console.log(chalk.green(`  ✓ Context compacted to 1 summary message\n`));
        }
        break;
      }

      // ─── SUB-AGENT ────────────────────────────────────────────
      case 'sub':
      case 'subagent': {
        const task = parts.slice(1).join(' ');
        if (!task) {
          console.log(chalk.yellow('  Usage: /sub <task description>\n'));
          console.log(chalk.dim('  Example: /sub create a React todo app in ./todo-app\n'));
          break;
        }
        printSection(`Sub-Agent: ${truncate(task, 50)}`);
        console.log(chalk.dim('  Running autonomously with all tools...\n'));
        const result = await runSubAgent({
          task,
          model: state.currentModel,
          onProgress: (msg) => process.stdout.write(chalk.dim(`  ${msg}\n`)),
        });
        console.log('');
        printDivider('Result');
        console.log(chalk.dim(`  ● Rounds: ${result.rounds}  |  Tools used: ${result.toolsUsed.join(', ') || 'none'}`));
        console.log('');
        if (result.success) {
          console.log(chalk.dim(result.output.slice(-800).split('\n').map((l) => '  ' + l).join('\n')));
        } else {
          console.log(chalk.red('  ✗ ' + result.output));
        }
        console.log('');
        break;
      }

      // ─── CONFIG ───────────────────────────────────────────────
      case 'config': {
        const cfg = getConfig();
        if (!sub || sub === 'show') {
          printSection('Configuration');
          for (const [k, v] of Object.entries(cfg)) {
            if (typeof v === 'object') continue;
            console.log(`  ${chalk.cyan(k.padEnd(24))} ${chalk.dim(String(v))}`);
          }
          console.log(`  ${chalk.cyan('mcpServers'.padEnd(24))} ${chalk.dim(Object.keys(cfg.mcpServers).join(', ') || 'none')}`);
          console.log('');
        } else if (sub === 'path') {
          console.log(`\n  ${chalk.dim('Config file:')} ${getConfigDir()}\n`);
        } else if (sub === 'set') {
          const key = args[0] as keyof typeof cfg;
          const value = args[1];
          if (!key || !value) { console.log(chalk.yellow('  Usage: /config set <key> <value>\n')); break; }
          const parsed: Record<string, unknown> = {};
          if (value === 'true') parsed[key] = true;
          else if (value === 'false') parsed[key] = false;
          else if (!isNaN(Number(value))) parsed[key] = Number(value);
          else parsed[key] = value;
          saveConfig(parsed);
          console.log(chalk.green(`  ✓ ${key} = ${value}\n`));
        }
        break;
      }

      default:
        console.log(chalk.yellow(`  Unknown command: /${cmd}. Type /help for commands.\n`));
    }
  }

  async function handleMessage(line: string): Promise<void> {
    try {
      if (!state.currentAgent || !state.fixedAgent) {
        process.stdout.write(chalk.hex('#9A6614')('  ⬡ Routing...\r'));
        state.currentAgent = await pickAgent(line, state.fixedAgent || undefined);
        process.stdout.write(`  ${chalk.hex('#9A6614')('⬡')} ${agentBadge(state.currentAgent.name)}${' '.repeat(30)}\n`);
      }

      console.log('');
      process.stdout.write(`  ${chalk.bold.hex('#F5A623')('hive')} ${chalk.dim('›')} `);

      let hasOutput = false;
      let toolCount = 0;

      state.session.history = await runAgentTurn(
        state.currentAgent,
        state.session.history,
        line,
        state.session.loadedSkills,
        {
          onToken: (token) => {
            hasOutput = true;
            process.stdout.write(token);
          },
          onToolStart: (name, args) => {
            if (hasOutput) { console.log(''); hasOutput = false; }
            toolCount++;
            const preview = Object.entries(args).slice(0, 2)
              .map(([k, v]) => `${k}=${truncate(String(v), 35)}`).join(', ');
            const toolLabel = name.startsWith('mcp__') ? chalk.magenta(name) : chalk.yellow(name);
            console.log(`\n  ${chalk.dim(`[tool ${toolCount}]`)} ${toolLabel}${preview ? chalk.dim(`(${preview})`) : ''}`);
            process.stdout.write(`  ${chalk.bold.hex('#F5A623')('hive')} ${chalk.dim('›')} `);
          },
          onToolEnd: (name, result) => {
            const firstLine = result.split('\n')[0] || '';
            const isOk = firstLine.startsWith('✅');
            const isErr = firstLine.startsWith('❌');
            const icon = isOk ? chalk.green('✓') : isErr ? chalk.red('✗') : chalk.dim('→');
            console.log(`\n  ${icon} ${chalk.dim(truncate(firstLine.replace(/^[✅❌]\s*/, ''), 80))}`);
            if (!isOk && !isErr) {
              const preview = truncate(result, 300);
              if (preview.length > 10) console.log(chalk.dim(preview.split('\n').slice(0, 5).map((l) => '    ' + l).join('\n')));
            }
            console.log('');
            process.stdout.write(`  ${chalk.bold.hex('#F5A623')('hive')} ${chalk.dim('›')} `);
          },
          onError: (err) => {
            if (hasOutput) { console.log(''); hasOutput = false; }
            console.log(`\n  ${chalk.red('✗ Error:')} ${err}\n`);
          },
          onRound: (_round) => {},
        }
      );

      if (hasOutput) console.log('');
      saveSession(state.session);
    } catch (err: unknown) {
      const error = err as { message?: string };
      console.log(`\n  ${chalk.red('✗')} ${error.message || String(err)}\n`);
    }
  }

  rl.on('close', () => {
    saveSession(state.session);
    console.log(chalk.dim('\n  Session saved. Goodbye! 👋\n'));
    if (process.stdin.isTTY) process.stdin.setRawMode(false);
    process.exit(0);
  });

  rl.setPrompt(prompt());
  rl.prompt();

  rl.on('line', async (input) => {
    const line = input.trim();
    if (!line) {
      rl.setPrompt(prompt());
      rl.prompt();
      return;
    }
    
    // Close palette if it was left open somehow (though _ttyWrite should handle return)
    if (paletteOpen) {
      closePalette();
    }

    if (line.startsWith('/')) {
      await handleCommand(line);
    } else {
      await handleMessage(line);
    }
    rl.setPrompt(prompt());
    rl.prompt();
  });
}

async function interactiveCreateAgent(rl: readline.Interface, state: ChatState): Promise<void> {
  const ask = (q: string) => new Promise<string>((res) => rl.question(chalk.cyan(`  ${q}: `), (a) => res(a.trim())));

  printSection('Create New Agent');
  const name = await ask('Agent name (e.g. reviewer)');
  if (!name) { console.log(chalk.red('  ✗ Name is required\n')); return; }
  const description = await ask('Description (one line)');
  const modelInput = await ask(`Model (press Enter for ${state.currentModel})`);
  const model = modelInput || state.currentModel;
  const toolsInput = await ask('Tools (comma separated, or Enter for all): read_file,write_file,run_shell,...');
  const tools = toolsInput ? toolsInput.split(',').map((t) => t.trim()) : undefined;
  const promptInput = await ask('System prompt (or Enter for default)');
  const systemPrompt = promptInput || `You are ${name}, a specialized AI agent. ${description}`;

  const filePath = createAgentFile(name, description, tools || [], systemPrompt, model !== state.currentModel ? model : undefined);
  console.log(chalk.green(`\n  ✓ Agent created: ${filePath}\n`));
  loadAgents(true);
}
