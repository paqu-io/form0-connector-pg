/**
 * PostgreSQL database operations for form0 connector
 * Supports both main records and child records with proper relationships
 */

import pkg from 'pg';
const { Pool } = pkg;

export class PostgreSQLDatabase {
  constructor(config) {
    this.config = config;
    this.pool = null;
  }

  /**
   * Connect to PostgreSQL database
   */
  async connect() {
    try {
      this.pool = new Pool({
        host: this.config.host,
        port: this.config.port,
        database: this.config.database,
        user: this.config.username,
        password: this.config.password,
        ssl: this.config.ssl ? {
          rejectUnauthorized: this.config.sslRejectUnauthorized
        } : false,
        max: this.config.maxConnections,
        idleTimeoutMillis: this.config.idleTimeout,
        connectionTimeoutMillis: this.config.connectionTimeout
      });

      // Test the connection
      const client = await this.pool.connect();
      client.release();

      if (this.config.debug) {
        console.log('[form0-connector-pg] Database connected successfully');
      }
    } catch (error) {
      throw new Error(`Failed to connect to PostgreSQL: ${error.message}`);
    }
  }

  /**
   * Disconnect from PostgreSQL database
   */
  async disconnect() {
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
      
      if (this.config.debug) {
        console.log('[form0-connector-pg] Database disconnected');
      }
    }
  }

  /**
   * Check if database connection is healthy
   */
  async healthCheck() {
    try {
      if (!this.pool) return false;
      
      const client = await this.pool.connect();
      const result = await client.query('SELECT 1 as health');
      client.release();
      
      return result.rows.length > 0 && result.rows[0].health === 1;
    } catch (error) {
      console.error('[form0-connector-pg] Health check failed:', error.message);
      return false;
    }
  }

  /**
   * Insert a structured record into the database
   * Handles both main records and child records with proper relationships
   * @param {Object} record - Structured record from record-transformer.js
   * @param {Object} options - Additional options for relationship handling
   * @returns {Promise<Object>} Insert result with ID
   */
  async insertRecord(record, options = {}) {
    const client = await this.pool.connect();
    
    try {
      const mainTableName = `${this.config.schema}.form0_submissions`;
      const childTableName = `${this.config.schema}.form0_submissions_children`;
      
      // Determine if this is a main record or child record
      const isChildRecord = options.isChildRecord || false;
      const parentRecordId = options.parentRecordId || null;
      const mainRecordId = options.mainRecordId || record.id;
      
      if (isChildRecord) {
        // Insert child record
        const {
          id: childRecordId,
          status,
          version,
          draft,
          created_at,
          updated_at,
          created_at_client,
          updated_at_client,
          created_at_server,
          updated_at_server,
          created_by_id,
          updated_by_id,
          main_org_id,
          sub_org_id,
          project_id,
          form_id,
          changeset_id,
          created_location,
          updated_location,
          latitude,
          longitude,
          altitude,
          horizontal_accuracy,
          vertical_accuracy,
          created_duration,
          updated_duration,
          updated_duration_cumulative,
          geometry,
          ...otherFields
        } = record;

        // Store the complete record as JSONB
        const recordData = { ...record };

        const query = `
          INSERT INTO ${childTableName} (
            _child_record_id,
            _record_id,
            _parent_record_id,
            _status,
            _version,
            _draft,
            _created_at,
            _updated_at,
            _created_at_client,
            _updated_at_client,
            _created_at_server,
            _updated_at_server,
            _created_by_id,
            _updated_by_id,
            _main_org_id,
            _sub_org_id,
            _project_id,
            _form_id,
            _changeset_id,
            _created_location,
            _updated_location,
            _latitude,
            _longitude,
            _altitude,
            _horizontal_accuracy,
            _vertical_accuracy,
            _created_duration,
            _updated_duration,
            _updated_duration_cumulative,
            _geometry,
            form_values
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31
          )
          RETURNING _child_record_id, _created_at, _updated_at
        `;

        const values = [
          childRecordId,
          mainRecordId,
          parentRecordId,
          status,
          version,
          draft,
          created_at,
          updated_at,
          created_at_client,
          updated_at_client,
          created_at_server,
          updated_at_server,
          created_by_id,
          updated_by_id,
          main_org_id,
          sub_org_id,
          project_id,
          form_id,
          changeset_id,
          created_location,
          updated_location,
          latitude,
          longitude,
          altitude,
          horizontal_accuracy,
          vertical_accuracy,
          created_duration,
          updated_duration,
          updated_duration_cumulative,
          geometry,
          JSON.stringify(recordData)
        ];

        const result = await client.query(query, values);
        
        if (this.config.debug) {
          console.log('[form0-connector-pg] Child record inserted:', result.rows[0]);
        }

        return {
          ...result.rows[0],
          recordType: 'child',
          childRecordId: result.rows[0]._child_record_id
        };
      } else {
        // Insert main record
        const {
          id: recordId,
          status,
          version,
          draft,
          created_at,
          updated_at,
          created_at_client,
          updated_at_client,
          created_at_server,
          updated_at_server,
          created_by_id,
          updated_by_id,
          main_org_id,
          sub_org_id,
          project_id,
          form_id,
          changeset_id,
          created_location,
          updated_location,
          latitude,
          longitude,
          altitude,
          horizontal_accuracy,
          vertical_accuracy,
          created_duration,
          updated_duration,
          updated_duration_cumulative,
          ...otherFields
        } = record;

        // Store the complete record as JSONB
        const recordData = { ...record };

        const query = `
          INSERT INTO ${mainTableName} (
            _record_id,
            _status,
            _version,
            _draft,
            _created_at,
            _updated_at,
            _created_at_client,
            _updated_at_client,
            _created_at_server,
            _updated_at_server,
            _created_by_id,
            _updated_by_id,
            _main_org_id,
            _sub_org_id,
            _project_id,
            _form_id,
            _changeset_id,
            _created_location,
            _updated_location,
            _latitude,
            _longitude,
            _altitude,
            _horizontal_accuracy,
            _vertical_accuracy,
            _created_duration,
            _updated_duration,
            _updated_duration_cumulative,
            form_values
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28
          )
          RETURNING _record_id, _created_at, _updated_at
        `;

        const values = [
          recordId,
          status,
          version,
          draft,
          created_at,
          updated_at,
          created_at_client,
          updated_at_client,
          created_at_server,
          updated_at_server,
          created_by_id,
          updated_by_id,
          main_org_id,
          sub_org_id,
          project_id,
          form_id,
          changeset_id,
          created_location,
          updated_location,
          latitude,
          longitude,
          altitude,
          horizontal_accuracy,
          vertical_accuracy,
          created_duration,
          updated_duration,
          updated_duration_cumulative,
          JSON.stringify(recordData)
        ];

        const result = await client.query(query, values);
        
        if (this.config.debug) {
          console.log('[form0-connector-pg] Main record inserted:', result.rows[0]);
        }

        return {
          ...result.rows[0],
          recordType: 'main',
          recordId: result.rows[0]._record_id
        };
      }
    } catch (error) {
      throw new Error(`Failed to insert record: ${error.message}`);
    } finally {
      client.release();
    }
  }

  /**
   * Insert multiple child records for a RepeatableSection
   * @param {Array} childRecords - Array of child records
   * @param {string} mainRecordId - ID of the main record
   * @param {string} parentRecordId - ID of the parent record (main or child)
   * @returns {Promise<Array>} Array of inserted child record IDs
   */
  async insertChildRecords(childRecords, mainRecordId, parentRecordId = null) {
    const results = [];
    
    for (const childRecord of childRecords) {
      const result = await this.insertRecord(childRecord, {
        isChildRecord: true,
        mainRecordId,
        parentRecordId: parentRecordId || mainRecordId
      });
      results.push(result);
    }
    
    return results;
  }

  /**
   * Execute a raw SQL query (for schema creation and maintenance)
   * @param {string} query - SQL query to execute
   * @param {Array} values - Query parameters
   * @returns {Promise<Object>} Query result
   */
  async query(query, values = []) {
    const client = await this.pool.connect();
    
    try {
      const result = await client.query(query, values);
      return result;
    } catch (error) {
      throw new Error(`Query failed: ${error.message}`);
    } finally {
      client.release();
    }
  }

  /**
   * Check if a table exists
   * @param {string} tableName - Name of the table to check
   * @returns {Promise<boolean>} True if table exists
   */
  async tableExists(tableName) {
    try {
      const query = `
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = $1 
          AND table_name = $2
        )
      `;
      
      const result = await this.query(query, [this.config.schema, tableName]);
      return result.rows[0].exists;
    } catch (error) {
      console.error('[form0-connector-pg] Error checking table existence:', error.message);
      return false;
    }
  }
}