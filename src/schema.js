/**
 * Database schema creation and migration for form0 PostgreSQL connector
 */

/**
 * Create the form submissions table with hybrid approach (extracted columns + JSONB)
 * @param {PostgreSQLDatabase} db - Database instance
 * @param {Object} config - Connector configuration
 */
export async function createSchema(db, config) {
  const tableName = config.tableName;
  const schemaName = config.schema;
  
  try {
    // Check if table already exists
    const exists = await db.tableExists(tableName);
    
    if (exists) {
      if (config.debug) {
        console.log(`[form0-connector-pg] Table ${schemaName}.${tableName} already exists`);
      }
      return;
    }

    // Create the table with hybrid approach
    const createTableQuery = `
      CREATE TABLE ${schemaName}.${tableName} (
        -- Primary identifier
        id UUID PRIMARY KEY,
        
        -- Common extracted fields for fast querying
        status VARCHAR(50),
        version INTEGER NOT NULL DEFAULT 1,
        draft BOOLEAN NOT NULL DEFAULT false,
        
        -- Timestamp fields
        created_at TIMESTAMPTZ,
        updated_at TIMESTAMPTZ,
        created_at_client TIMESTAMPTZ,
        updated_at_client TIMESTAMPTZ,
        created_at_server TIMESTAMPTZ,
        updated_at_server TIMESTAMPTZ,
        
        -- User/organization fields
        created_by_id UUID,
        updated_by_id UUID,
        main_org_id UUID,
        sub_org_id UUID,
        project_id UUID,
        
        -- Form identification
        form_id VARCHAR(100),
        
        -- Changeset for grouping related changes
        changeset_id UUID,
        
        -- Complete structured record as JSONB
        record_data JSONB NOT NULL,
        
        -- Metadata
        created_at_db TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        updated_at_db TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      )
    `;

    await db.query(createTableQuery);

    // Create indexes for common query patterns
    const indexes = [
      `CREATE INDEX idx_${tableName}_status ON ${schemaName}.${tableName} (status)`,
      `CREATE INDEX idx_${tableName}_form_id ON ${schemaName}.${tableName} (form_id)`,
      `CREATE INDEX idx_${tableName}_created_at ON ${schemaName}.${tableName} (created_at)`,
      `CREATE INDEX idx_${tableName}_updated_at ON ${schemaName}.${tableName} (updated_at)`,
      `CREATE INDEX idx_${tableName}_draft ON ${schemaName}.${tableName} (draft)`,
      `CREATE INDEX idx_${tableName}_version ON ${schemaName}.${tableName} (version)`,
      `CREATE INDEX idx_${tableName}_changeset_id ON ${schemaName}.${tableName} (changeset_id)`,
      `CREATE INDEX idx_${tableName}_created_by_id ON ${schemaName}.${tableName} (created_by_id)`,
      
      // JSONB indexes for form_values queries
      `CREATE INDEX idx_${tableName}_form_values ON ${schemaName}.${tableName} USING GIN ((record_data->'form_values'))`,
      `CREATE INDEX idx_${tableName}_record_data ON ${schemaName}.${tableName} USING GIN (record_data)`
    ];

    for (const indexQuery of indexes) {
      await db.query(indexQuery);
    }

    // Create updated_at trigger to automatically update updated_at_db
    const triggerFunction = `
      CREATE OR REPLACE FUNCTION update_${tableName}_updated_at_db()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at_db = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ language 'plpgsql'
    `;

    const trigger = `
      CREATE TRIGGER trigger_${tableName}_updated_at_db
        BEFORE UPDATE ON ${schemaName}.${tableName}
        FOR EACH ROW
        EXECUTE FUNCTION update_${tableName}_updated_at_db()
    `;

    await db.query(triggerFunction);
    await db.query(trigger);

    console.log(`[form0-connector-pg] Created table ${schemaName}.${tableName} with indexes and triggers`);
  } catch (error) {
    throw new Error(`Failed to create schema: ${error.message}`);
  }
}

/**
 * Get table information and statistics
 * @param {PostgreSQLDatabase} db - Database instance
 * @param {Object} config - Connector configuration
 * @returns {Promise<Object>} Table information
 */
export async function getTableInfo(db, config) {
  const tableName = config.tableName;
  const schemaName = config.schema;
  
  try {
    // Get basic table info
    const tableInfoQuery = `
      SELECT 
        schemaname,
        tablename,
        tableowner,
        tablespace,
        hasindexes,
        hasrules,
        hastriggers
      FROM pg_tables 
      WHERE schemaname = $1 AND tablename = $2
    `;
    
    const tableInfo = await db.query(tableInfoQuery, [schemaName, tableName]);
    
    if (tableInfo.rows.length === 0) {
      return { exists: false };
    }
    
    // Get row count
    const countQuery = `SELECT COUNT(*) as row_count FROM ${schemaName}.${tableName}`;
    const countResult = await db.query(countQuery);
    
    // Get column information
    const columnsQuery = `
      SELECT 
        column_name,
        data_type,
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_schema = $1 AND table_name = $2
      ORDER BY ordinal_position
    `;
    
    const columnsResult = await db.query(columnsQuery, [schemaName, tableName]);
    
    // Get index information
    const indexesQuery = `
      SELECT 
        indexname,
        indexdef
      FROM pg_indexes
      WHERE schemaname = $1 AND tablename = $2
    `;
    
    const indexesResult = await db.query(indexesQuery, [schemaName, tableName]);
    
    return {
      exists: true,
      table: tableInfo.rows[0],
      rowCount: parseInt(countResult.rows[0].row_count),
      columns: columnsResult.rows,
      indexes: indexesResult.rows
    };
  } catch (error) {
    throw new Error(`Failed to get table info: ${error.message}`);
  }
}