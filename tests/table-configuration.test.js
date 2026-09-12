import test from 'node:test';
import assert from 'node:assert/strict';

import { PostgreSQLDatabase } from '../src/database.js';
import { createSchema } from '../src/schema.js';

test('schema creation uses the configured main and child table names', async () => {
  const checkedTables = [];
  const queries = [];
  const db = {
    async tableExists(tableName) {
      checkedTables.push(tableName);
      return false;
    },
    async query(query) {
      queries.push(query);
      return { rows: [] };
    },
  };

  await createSchema(db, {
    schema: 'tenant_forms',
    tableName: 'submissions',
    childTableName: 'submission_children',
    debug: false,
  });

  assert.deepEqual(checkedTables, ['submissions', 'submission_children']);
  assert.ok(queries.some((query) => query.includes('CREATE TABLE tenant_forms.submissions')));
  assert.ok(
    queries.some((query) => query.includes('CREATE TABLE tenant_forms.submission_children'))
  );
  assert.ok(
    queries.some((query) =>
      query.includes('FOREIGN KEY (_record_id) REFERENCES tenant_forms.submissions(_record_id)')
    )
  );
  assert.ok(
    queries.some((query) =>
      query.includes('CREATE TRIGGER trigger_submission_children_updated_at_db')
    )
  );
});

test('schema initialization reuses configured tables without running DDL', async () => {
  const checkedTables = [];
  const db = {
    async tableExists(tableName) {
      checkedTables.push(tableName);
      return true;
    },
    async query() {
      throw new Error('No schema query should run when both tables already exist');
    },
  };

  await createSchema(db, {
    schema: 'tenant_forms',
    tableName: 'submissions',
    childTableName: 'submission_children',
    debug: false,
  });

  assert.deepEqual(checkedTables, ['submissions', 'submission_children']);
});

test('record insertion targets the configured schema and table', async () => {
  const queries = [];
  const client = {
    async query(query) {
      queries.push(query);
      return { rows: [{ _record_id: 'record-1' }] };
    },
    release() {},
  };
  const db = new PostgreSQLDatabase({
    schema: 'tenant_forms',
    tableName: 'submissions',
    childTableName: 'submission_children',
    debug: false,
  });
  db.pool = { connect: async () => client };

  const result = await db.insertRecord({
    id: 'record-1',
    version: 1,
    draft: false,
    form_values: { name: 'Ada' },
  });

  assert.match(queries[0], /INSERT INTO tenant_forms\.submissions/);
  assert.equal(result.recordId, 'record-1');
});

test('child record insertion targets the configured schema and child table', async () => {
  const queries = [];
  const client = {
    async query(query) {
      queries.push(query);
      return { rows: [{ _child_record_id: 'child-1' }] };
    },
    release() {},
  };
  const db = new PostgreSQLDatabase({
    schema: 'tenant_forms',
    tableName: 'submissions',
    childTableName: 'submission_children',
    debug: false,
  });
  db.pool = { connect: async () => client };

  const result = await db.insertRecord(
    {
      id: 'child-1',
      version: 1,
      draft: false,
      form_values: { name: 'Grace' },
    },
    {
      isChildRecord: true,
      mainRecordId: 'record-1',
      parentRecordId: 'record-1',
    }
  );

  assert.match(queries[0], /INSERT INTO tenant_forms\.submission_children/);
  assert.equal(result.childRecordId, 'child-1');
});
