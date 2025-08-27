/**
 * Database schema creation and migration for form0 PostgreSQL connector
 * Supports both main records and child records with proper relationships
 */

/**
 * Create the form submissions tables with hybrid approach (extracted columns + JSONB)
 * Supports both main records and child records with proper relationships
 * @param {PostgreSQLDatabase} db - Database instance
 * @param {Object} config - Connector configuration
 */
export async function createSchema(db, config) {
  const mainTableName = 'form0_submissions';
  const childTableName = 'form0_submissions_children';
  const schemaName = config.schema;
  
  try {
    // Check if main table already exists
    const mainExists = await db.tableExists(mainTableName);
    
    if (!mainExists) {
      // Create main records table
      const createMainTableQuery = `
        CREATE TABLE ${schemaName}.${mainTableName} (
          -- Primary identifier
          _record_id UUID PRIMARY KEY,
          
          -- System fields with underscore prefix
          _status VARCHAR(50),
          _version INTEGER NOT NULL DEFAULT 1,
          _draft BOOLEAN NOT NULL DEFAULT false,
          
          -- Timestamp fields
          _created_at TIMESTAMPTZ,
          _updated_at TIMESTAMPTZ,
          _created_at_client TIMESTAMPTZ,
          _updated_at_client TIMESTAMPTZ,
          _created_at_server TIMESTAMPTZ,
          _updated_at_server TIMESTAMPTZ,
          
          -- User/organization fields
          _created_by_id UUID,
          _updated_by_id UUID,
          _main_org_id UUID,
          _sub_org_id UUID,
          _project_id UUID,
          
          -- Form identification
          _form_id VARCHAR(100),
          
          -- Changeset for grouping related changes
          _changeset_id UUID,
          
          -- Location metadata
          _created_location VARCHAR(255),
          _updated_location VARCHAR(255),
          _latitude DECIMAL(10, 8),
          _longitude DECIMAL(11, 8),
          _altitude DECIMAL(10, 3),
          _horizontal_accuracy DECIMAL(10, 3),
          _vertical_accuracy DECIMAL(10, 3),
          
          -- Duration metadata
          _created_duration INTEGER,
          _updated_duration INTEGER,
          _updated_duration_cumulative INTEGER,
          
          -- Complete structured record as JSONB
          form_values JSONB NOT NULL,
          
          -- Metadata
          created_at_db TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
          updated_at_db TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
        )
      `;

      await db.query(createMainTableQuery);

      // Create indexes for main table
      const mainIndexes = [
        `CREATE INDEX idx_${mainTableName}_status ON ${schemaName}.${mainTableName} (_status)`,
        `CREATE INDEX idx_${mainTableName}_form_id ON ${schemaName}.${mainTableName} (_form_id)`,
        `CREATE INDEX idx_${mainTableName}_created_at ON ${schemaName}.${mainTableName} (_created_at)`,
        `CREATE INDEX idx_${mainTableName}_updated_at ON ${schemaName}.${mainTableName} (_updated_at)`,
        `CREATE INDEX idx_${mainTableName}_draft ON ${schemaName}.${mainTableName} (_draft)`,
        `CREATE INDEX idx_${mainTableName}_version ON ${schemaName}.${mainTableName} (_version)`,
        `CREATE INDEX idx_${mainTableName}_changeset_id ON ${schemaName}.${mainTableName} (_changeset_id)`,
        `CREATE INDEX idx_${mainTableName}_created_by_id ON ${schemaName}.${mainTableName} (_created_by_id)`,
        
        // JSONB indexes for form_values queries
        `CREATE INDEX idx_${mainTableName}_form_values ON ${schemaName}.${mainTableName} USING GIN (form_values)`
      ];

      for (const indexQuery of mainIndexes) {
        await db.query(indexQuery);
      }

      // Create updated_at trigger for main table
      const mainTriggerFunction = `
        CREATE OR REPLACE FUNCTION update_${mainTableName}_updated_at_db()
        RETURNS TRIGGER AS $$
        BEGIN
          NEW.updated_at_db = CURRENT_TIMESTAMP;
          RETURN NEW;
        END;
        $$ language 'plpgsql'
      `;

      const mainTrigger = `
        CREATE TRIGGER trigger_${mainTableName}_updated_at_db
          BEFORE UPDATE ON ${schemaName}.${mainTableName}
          FOR EACH ROW
          EXECUTE FUNCTION update_${mainTableName}_updated_at_db()
      `;

      await db.query(mainTriggerFunction);
      await db.query(mainTrigger);

      console.log(`[form0-connector-pg] Created main table ${schemaName}.${mainTableName} with indexes and triggers`);
    } else {
      if (config.debug) {
        console.log(`[form0-connector-pg] Main table ${schemaName}.${mainTableName} already exists`);
      }
    }

    // Check if child table already exists
    const childExists = await db.tableExists(childTableName);
    
    if (!childExists) {
      // Create child records table
      const createChildTableQuery = `
        CREATE TABLE ${schemaName}.${childTableName} (
          -- Primary identifier
          _child_record_id UUID PRIMARY KEY,
          
          -- Relationship fields
          _record_id UUID NOT NULL,
          _parent_record_id UUID,
          
          -- System fields with underscore prefix (same as main + child-specific)
          _status VARCHAR(50),
          _version INTEGER NOT NULL DEFAULT 1,
          _draft BOOLEAN NOT NULL DEFAULT false,
          
          -- Timestamp fields
          _created_at TIMESTAMPTZ,
          _updated_at TIMESTAMPTZ,
          _created_at_client TIMESTAMPTZ,
          _updated_at_client TIMESTAMPTZ,
          _created_at_server TIMESTAMPTZ,
          _updated_at_server TIMESTAMPTZ,
          
          -- User/organization fields
          _created_by_id UUID,
          _updated_by_id UUID,
          _main_org_id UUID,
          _sub_org_id UUID,
          _project_id UUID,
          
          -- Form identification
          _form_id VARCHAR(100),
          
          -- Changeset for grouping related changes
          _changeset_id UUID,
          
          -- Location metadata
          _created_location VARCHAR(255),
          _updated_location VARCHAR(255),
          _latitude DECIMAL(10, 8),
          _longitude DECIMAL(11, 8),
          _altitude DECIMAL(10, 3),
          _horizontal_accuracy DECIMAL(10, 3),
          _vertical_accuracy DECIMAL(10, 3),
          
          -- Duration metadata (child-specific)
          _created_duration INTEGER,
          _updated_duration INTEGER,
          _updated_duration_cumulative INTEGER,
          
          -- Geometry (child-specific) - stored as JSONB for compatibility
          _geometry JSONB,
          
          -- Complete structured record as JSONB
          form_values JSONB NOT NULL,
          
          -- Metadata
          created_at_db TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
          updated_at_db TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
          
          -- Foreign key to main record
          FOREIGN KEY (_record_id) REFERENCES ${schemaName}.${mainTableName}(_record_id)
        )
      `;

      await db.query(createChildTableQuery);

      // Create indexes for child table
      const childIndexes = [
        `CREATE INDEX idx_${childTableName}_record_id ON ${schemaName}.${childTableName} (_record_id)`,
        `CREATE INDEX idx_${childTableName}_parent_record_id ON ${schemaName}.${childTableName} (_parent_record_id)`,
        `CREATE INDEX idx_${childTableName}_status ON ${schemaName}.${childTableName} (_status)`,
        `CREATE INDEX idx_${childTableName}_form_id ON ${schemaName}.${childTableName} (_form_id)`,
        `CREATE INDEX idx_${childTableName}_created_at ON ${schemaName}.${childTableName} (_created_at)`,
        `CREATE INDEX idx_${childTableName}_updated_at ON ${schemaName}.${childTableName} (_updated_at)`,
        `CREATE INDEX idx_${childTableName}_draft ON ${schemaName}.${childTableName} (_draft)`,
        `CREATE INDEX idx_${childTableName}_version ON ${schemaName}.${childTableName} (_version)`,
        `CREATE INDEX idx_${childTableName}_changeset_id ON ${schemaName}.${childTableName} (_changeset_id)`,
        `CREATE INDEX idx_${childTableName}_created_by_id ON ${schemaName}.${childTableName} (_created_by_id)`,
        
        // JSONB indexes for form_values queries
        `CREATE INDEX idx_${childTableName}_form_values ON ${schemaName}.${childTableName} USING GIN (form_values)`
      ];

      for (const indexQuery of childIndexes) {
        await db.query(indexQuery);
      }

      // Create updated_at trigger for child table
      const childTriggerFunction = `
        CREATE OR REPLACE FUNCTION update_${childTableName}_updated_at_db()
        RETURNS TRIGGER AS $$
        BEGIN
          NEW.updated_at_db = CURRENT_TIMESTAMP;
          RETURN NEW;
        END;
        $$ language 'plpgsql'
      `;

      const childTrigger = `
        CREATE TRIGGER trigger_${childTableName}_updated_at_db
          BEFORE UPDATE ON ${schemaName}.${childTableName}
          FOR EACH ROW
          EXECUTE FUNCTION update_${childTableName}_updated_at_db()
      `;

      await db.query(childTriggerFunction);
      await db.query(childTrigger);

      console.log(`[form0-connector-pg] Created child table ${schemaName}.${childTableName} with indexes and triggers`);
    } else {
      if (config.debug) {
        console.log(`[form0-connector-pg] Child table ${schemaName}.${childTableName} already exists`);
      }
    }

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
  const mainTableName = 'form0_submissions';
  const childTableName = 'form0_submissions_children';
  const schemaName = config.schema;
  
  try {
    // Get main table info
    const mainTableInfoQuery = `
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
    
    const mainTableInfo = await db.query(mainTableInfoQuery, [schemaName, mainTableName]);
    const childTableInfo = await db.query(mainTableInfoQuery, [schemaName, childTableName]);
    
    const result = {
      mainTable: { exists: mainTableInfo.rows.length > 0 },
      childTable: { exists: childTableInfo.rows.length > 0 }
    };
    
    if (mainTableInfo.rows.length > 0) {
      // Get main table row count
      const mainCountQuery = `SELECT COUNT(*) as row_count FROM ${schemaName}.${mainTableName}`;
      const mainCountResult = await db.query(mainCountQuery);
      result.mainTable.rowCount = parseInt(mainCountResult.rows[0].row_count);
    }
    
    if (childTableInfo.rows.length > 0) {
      // Get child table row count
      const childCountQuery = `SELECT COUNT(*) as row_count FROM ${schemaName}.${childTableName}`;
      const childCountResult = await db.query(childCountQuery);
      result.childTable.rowCount = parseInt(childCountResult.rows[0].row_count);
    }
    
    return result;
  } catch (error) {
    throw new Error(`Failed to get table info: ${error.message}`);
  }
}