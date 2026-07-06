import { loadConfig } from './config.js';
import { buildApp } from './app.js';
import { startPassiveRecoveryJob } from './reputation/service.js';

const env = loadConfig();
const app = await buildApp(env);

try {
  await app.matchService.recoverOnBoot();
  await app.tournamentService.recoverOnBoot();
  startPassiveRecoveryJob(app.db);
  await app.listen({ port: env.PORT, host: env.HOST });
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
