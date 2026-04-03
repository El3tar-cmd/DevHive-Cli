import { program } from './cli/index';

process.on('uncaughtException', (err) => {
  process.stderr.write(`\n❌ Fatal: ${err.message}\n`);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  process.stderr.write(`\n❌ Rejection: ${String(reason)}\n`);
  process.exit(1);
});

program.parseAsync(process.argv).catch((err: Error) => {
  process.stderr.write(`\n❌ ${err.message}\n`);
  process.exit(1);
});
