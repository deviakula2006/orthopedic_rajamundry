import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globalSetup: ['./tests/globalSetup.js'],
    setupFiles: ['./tests/setup.js'],
    testTimeout: 20000,
    hookTimeout: 30000,
    // All test files share one Postgres test database, so they must run
    // sequentially in a single process rather than racing in parallel workers.
    pool: 'forks',
    poolOptions: { forks: { singleFork: true } }
  }
});
