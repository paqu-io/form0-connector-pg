import test from 'node:test';
import assert from 'node:assert/strict';

import { Form0PostgreSQLConnector } from '../src/index.js';

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
  assert.equal(metadata.initialized, false);
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

// Integration-oriented tests require a live PostgreSQL instance. Skip by default.
test.skip('initializes and stores a record with a live PostgreSQL database', async (t) => {
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
