import { env } from './config/env.js';
import { createApp } from './app.js';
import { pool } from './config/db.js';
import { logger } from './utils/logger.js';

const app = createApp();

const server = app.listen(env.PORT, async () => {
  try {
    const dbInfo = await pool.query('SELECT current_database(), current_user');
    const { current_database, current_user } = dbInfo.rows[0];
    logger.info({
      nodeEnv: env.NODE_ENV,
      port: env.PORT,
      database: current_database,
      dbUser: current_user
    }, `Server listening on port ${env.PORT} (${env.NODE_ENV}) connected to ${current_database}`);
  } catch (err) {
    logger.error({ err }, 'Failed to connect to database on startup');
  }
});

async function shutdown(signal) {
  logger.info(`${signal} received, shutting down gracefully`);
  server.close(async (err) => {
    if (err) {
      logger.error({ err }, 'Error while closing HTTP server');
      process.exitCode = 1;
    }
    await pool.end();
    logger.info('Postgres pool closed. Exiting.');
    process.exit();
  });

  // Force-exit if graceful shutdown hangs.
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000).unref();
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

process.on('unhandledRejection', (reason) => {
  logger.error({ reason }, 'Unhandled promise rejection');
});

process.on('uncaughtException', (err) => {
  logger.error({ err }, 'Uncaught exception');
  process.exit(1);
});
