/**
 * Basic tests for form0-connector-pg
 * Using Node.js built-in test runner (Node 18+)
 */

import { test, describe } from 'node:test';
import assert from 'node:assert';
import { randomUUID } from 'crypto';
import { Form0PostgreSQLConnector } from '../src/index.js';

describe('Form0PostgreSQLConnector', () => {
  
  test('should create connector instance', () => {
    const connector = new Form0PostgreSQLConnector();
    assert.ok(connector instanceof Form0PostgreSQLConnector);
    assert.strictEqual(connector.isInitialized, false);
  });

  test('should return correct metadata', () => {
    const connector = new Form0PostgreSQLConnector();
    const metadata = connector.getMetadata();
    
    assert.strictEqual(metadata.name, 'form0-connector-pg');
    assert.strictEqual(metadata.type, 'database');
    assert.strictEqual(metadata.database, 'postgresql');
    assert.strictEqual(metadata.initialized, false);
    assert.ok(metadata.version);
  });

  test('should fail initialization without required env vars', async () => {
    const connector = new Form0PostgreSQLConnector();
    
    // Clear environment variables for this test
    const originalEnv = process.env;
    process.env = { ...originalEnv };
    delete process.env.FORM0_PG_DATABASE;
    delete process.env.FORM0_PG_USERNAME;
    delete process.env.FORM0_PG_PASSWORD;
    
    try {
      await assert.rejects(
        connector.initialize(),
        /FORM0_PG_DATABASE environment variable is required/
      );
    } finally {
      // Restore environment
      process.env = originalEnv;
    }
  });

  test('should fail onFormSubmit when not initialized', async () => {
    const connector = new Form0PostgreSQLConnector();
    
    await assert.rejects(
      connector.onFormSubmit({}),
      /Connector not initialized/
    );
  });

  test('should return unhealthy status when not initialized', async () => {
    const connector = new Form0PostgreSQLConnector();
    const health = await connector.healthCheck();
    
    assert.strictEqual(health.healthy, false);
    assert.strictEqual(health.message, 'Connector not initialized');
  });

  test('should handle destroy gracefully when not initialized', async () => {
    const connector = new Form0PostgreSQLConnector();
    
    // Should not throw
    await connector.destroy();
    assert.strictEqual(connector.isInitialized, false);
  });

});

// Integration tests (require actual database connection)
describe('Form0PostgreSQLConnector Integration', () => {
  
  test('should initialize with valid database connection', async (t) => {
    // Skip if no database configuration
    if (!process.env.FORM0_PG_DATABASE || !process.env.FORM0_PG_USERNAME || !process.env.FORM0_PG_PASSWORD) {
      t.skip('Database configuration not available');
      return;
    }
    
    const connector = new Form0PostgreSQLConnector();
    
    try {
      await connector.initialize();
      assert.strictEqual(connector.isInitialized, true);
      
      const health = await connector.healthCheck();
      assert.strictEqual(health.healthy, true);
      
    } finally {
      await connector.destroy();
    }
  });

  test('should submit a record successfully', async (t) => {
    // Skip if no database configuration
    if (!process.env.FORM0_PG_DATABASE || !process.env.FORM0_PG_USERNAME || !process.env.FORM0_PG_PASSWORD) {
      t.skip('Database configuration not available');
      return;
    }
    
    const connector = new Form0PostgreSQLConnector();
    
    const testRecord = {
      id: randomUUID(),
      status: 'test',
      version: 1,
      draft: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_at_client: new Date().toISOString(),
      updated_at_client: new Date().toISOString(),
      created_at_server: null,
      updated_at_server: null,
      form_id: 'test_form',
      form_values: {
        test_field: 'test_value',
        test_number: 42
      }
    };
    
    try {
      await connector.initialize();
      
      const result = await connector.onFormSubmit(testRecord);
      assert.strictEqual(result.success, true);
      assert.ok(result.id);
      assert.ok(result.timestamp);
      
    } finally {
      await connector.destroy();
    }
  });

});