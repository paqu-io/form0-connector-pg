/**
 * PostgreSQL database operations for form0 connector
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
   * @param {Object} record - Structured record from record-transformer.js
   * @returns {Promise<Object>} Insert result with ID
   */
  async insertRecord(record) {
    const client = await this.pool.connect();
    
    try {
      const tableName = `${this.config.schema}.${this.config.tableName}`;
      
      // Extract common fields for dedicated columns
      const {
        id,
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
        form_id,
        changeset_id,
        main_org_id,
        sub_org_id,
        project_id,
        ...otherFields
      } = record;

      // Store the complete record as JSONB
      const recordData = { ...record };

      const query = `
        INSERT INTO ${tableName} (
          id,
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
          form_id,
          changeset_id,
          main_org_id,
          sub_org_id,
          project_id,
          record_data
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18
        )
        RETURNING id, created_at, updated_at
      `;

      const values = [
        id,
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
        form_id,
        changeset_id,
        main_org_id,
        sub_org_id,
        project_id,
        JSON.stringify(recordData)
      ];

      const result = await client.query(query, values);
      
      if (this.config.debug) {
        console.log('[form0-connector-pg] Record inserted:', result.rows[0]);
      }

      return result.rows[0];
    } catch (error) {
      throw new Error(`Failed to insert record: ${error.message}`);
    } finally {
      client.release();
    }
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