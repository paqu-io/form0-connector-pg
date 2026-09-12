import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

import { Form0PostgreSQLConnector } from '../src/index.js';

const require = createRequire(import.meta.url);
const { version: packageVersion } = require('../package.json');

test('creates a connector instance', () => {
  const connector = new Form0PostgreSQLConnector();
  assert.ok(connector instanceof Form0PostgreSQLConnector);
  assert.equal(connector.isInitialized, false);
});

test('getMetadata reflects initialization state', () => {
  const connector = new Form0PostgreSQLConnector();
  const metadata = connector.getMetadata();
  assert.equal(metadata.name, 'form0-connector-pg');
  assert.equal(metadata.database, 'postgresql');
  assert.equal(metadata.version, packageVersion);
  assert.equal(metadata.initialized, false);
});

test('rejects unsafe PostgreSQL identifiers before connecting', async () => {
  const connector = new Form0PostgreSQLConnector();

  await assert.rejects(
    connector.initialize({
      database: 'form0',
      username: 'form0',
      password: 'secret',
      schema: 'public; DROP SCHEMA public',
    }),
    /schema must be a lowercase unquoted PostgreSQL identifier/
  );
});

test('rejects mixed-case PostgreSQL identifiers before connecting', async () => {
  const connector = new Form0PostgreSQLConnector();

  await assert.rejects(
    connector.initialize({
      database: 'form0',
      username: 'form0',
      password: 'secret',
      tableName: 'FormSubmissions',
    }),
    /tableName must be a lowercase unquoted PostgreSQL identifier/
  );
});

test('rejects table names that cannot produce safe generated identifiers', async () => {
  const connector = new Form0PostgreSQLConnector();

  await assert.rejects(
    connector.initialize({
      database: 'form0',
      username: 'form0',
      password: 'secret',
      childTableName: 'a'.repeat(42),
    }),
    /childTableName must not exceed 41 characters/
  );
});

test('rejects identical main and child table names', async () => {
  const connector = new Form0PostgreSQLConnector();

  await assert.rejects(
    connector.initialize({
      database: 'form0',
      username: 'form0',
      password: 'secret',
      tableName: 'submissions',
      childTableName: 'submissions',
    }),
    /tableName and childTableName must be different/
  );
});

test('healthCheck reports not initialized when connector is idle', async () => {
  const connector = new Form0PostgreSQLConnector();
  const result = await connector.healthCheck();
  assert.equal(result.healthy, false);
  assert.equal(result.message, 'Connector not initialized');
});

test('destroy without initialization is a no-op', async () => {
  const connector = new Form0PostgreSQLConnector();
  await connector.destroy();
  assert.equal(connector.isInitialized, false);
});

// Integration-oriented test runs only when a live PostgreSQL instance is configured.
test('initializes with a live PostgreSQL database', async (t) => {
  if (
    !process.env.FORM0_CONNECTOR_PG_DATABASE ||
    !process.env.FORM0_CONNECTOR_PG_USERNAME ||
    !process.env.FORM0_CONNECTOR_PG_PASSWORD
  ) {
    t.skip('Database configuration not available');
    return;
  }

  const connector = new Form0PostgreSQLConnector();

  try {
    await connector.initialize();
    const health = await connector.healthCheck();
    assert.equal(health.healthy, true);
  } finally {
    await connector.destroy();
  }
});
