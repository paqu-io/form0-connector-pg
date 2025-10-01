import test from 'node:test';
import assert from 'node:assert/strict';

import { Form0PostgreSQLConnector } from '../src/index.js';

class StubPostgreSQLDatabase {
  constructor() {
    this.insertCalls = [];
  }

  async insertRecord(record, options = {}) {
    this.insertCalls.push({ record, options });
    if (options.isChildRecord) {
      return { childRecordId: `child-${this.insertCalls.length}` };
    }
    return { recordId: record.record_id || `record-${this.insertCalls.length}` };
  }

  async connect() {
    return true;
  }
}

test('FormLinkField values are preserved when submitting to PostgreSQL connector', async () => {
  const connector = new Form0PostgreSQLConnector();
  connector.db = new StubPostgreSQLDatabase();
  connector.config = { debug: false };
  connector.isInitialized = true;

  const structuredRecord = {
    record_id: 'main-record-123',
    status: 'incomplete',
    version: 1,
    draft: false,
    created_at: '2025-01-01T00:00:00.000Z',
    updated_at: '2025-01-01T00:00:00.000Z',
    form_values: {
      test_form_link: [
        {
          record_id: 'linked-record-001',
        },
      ],
      first_import: 'Example value',
    },
  };

  const result = await connector.onFormSubmit(structuredRecord);

  assert.equal(result.success, true, 'Submission should succeed');
  assert.equal(connector.db.insertCalls.length, 1, 'Only main record should be inserted for FormLinkField');

  const storedRecord = connector.db.insertCalls[0].record;
  assert.ok(storedRecord.form_values, 'Stored record should include form_values');
  assert.deepEqual(
    storedRecord.form_values.test_form_link,
    structuredRecord.form_values.test_form_link,
    'FormLinkField values should be preserved as array of record references'
  );
});
