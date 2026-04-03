import { Command } from 'commander';
import chalk from 'chalk';
import { getConfig, saveConfig } from '../config';
import { startChat } from '../ui/chat';

export const program = new Command();

program
  .name('hive')
  .description('DevHive — Multi-Agent AI Engineering Platform')
  .version('1.0.0')
  .option('-a, --agent <name>', 'Start with a specific agent')
  .option('-s, --session <name>', 'Resume or create a named session')
  .option('-m, --model <name>', 'Override the model to use')
  .action(async (opts: { agent?: string; session?: string; model?: string }) => {
    if (opts.model) saveConfig({ model: opts.model });
    await startChat({ agent: opts.agent, session: opts.session });
  });

program
  .command('run <task>')
  .description('Run a one-shot task with a sub-agent (non-interactive)')
  .option('-a, --agent <name>', 'Use a specific agent')
  .option('-m, --model <name>', 'Model to use')
  .option('--tools <tools>', 'Comma-separated tool list')
  .action(async (task: string, opts: { agent?: string; model?: string; tools?: string }) => {
    const config = getConfig();
    const model = opts.model || config.model;
    const tools = opts.tools ? opts.tools.split(',').map((t) => t.trim()) : undefined;

    console.log(chalk.bold.cyan('\n  Devy Sub-Agent\n'));
    console.log(chalk.dim(`  Task: ${task}`));
    console.log(chalk.dim(`  Model: ${model}\n`));

    const { runSubAgent } = await import('../subagent');
    const result = await runSubAgent({
      task,
      model,
      tools,
      onProgress: (msg: string) => process.stdout.write(chalk.dim(`  ${msg}\n`)),
    });

    console.log('\n' + chalk.bold('  Result:'));
    console.log(result.output);
    console.log(chalk.dim(`\n  ● Rounds: ${result.rounds}  Tools: ${result.toolsUsed.join(', ')}\n`));
    process.exit(result.success ? 0 : 1);
  });

program
  .command('config')
  .description('View or set configuration')
  .argument('[key]', 'Config key to get/set')
  .argument('[value]', 'Value to set')
  .action((key?: string, value?: string) => {
    const config = getConfig();
    if (!key) {
      console.log('\n  Devy Configuration\n');
      for (const [k, v] of Object.entries(config)) {
        if (typeof v !== 'object') console.log(`  ${k.padEnd(24)} ${v}`);
      }
      console.log(`  ${'mcpServers'.padEnd(24)} ${Object.keys(config.mcpServers).join(', ') || '(none)'}`);
      console.log('');
    } else if (key && value) {
      const parsed: Record<string, unknown> = {};
      if (value === 'true') parsed[key] = true;
      else if (value === 'false') parsed[key] = false;
      else if (!isNaN(Number(value))) parsed[key] = Number(value);
      else parsed[key] = value;
      saveConfig(parsed);
      console.log(chalk.green(`  ✓ ${key} = ${value}`));
    } else {
      const val = config[key as keyof typeof config];
      console.log(`  ${key} = ${JSON.stringify(val)}`);
    }
  });

program
  .command('agents')
  .description('List all available agents')
  .action(async () => {
    const { loadAgents } = await import('../agents/loader');
    const agents = loadAgents();
    console.log('\n  Available Agents:\n');
    for (const a of agents) {
      console.log(`  ${chalk.bold.cyan(a.name.padEnd(16))} ${a.description}`);
      console.log(`  ${chalk.dim(' '.repeat(16))} Tools: ${a.tools.join(', ')}`);
      console.log('');
    }
  });

program
  .command('sessions')
  .description('List all saved sessions')
  .action(async () => {
    const { listSessions } = await import('../sessions');
    const sessions = listSessions();
    if (sessions.length === 0) { console.log('\n  No saved sessions.\n'); return; }
    console.log('\n  Saved Sessions:\n');
    for (const s of sessions) {
      console.log(`  ${chalk.cyan(s.name.padEnd(20))} ${s.messageCount} msgs  agent:${s.agentName || 'auto'}  ${s.updatedAt.split('T')[0]}`);
    }
    console.log('');
  });
