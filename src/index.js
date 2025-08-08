/**
 * PostgreSQL Connector for form0
 * Implements the standard form0 connector interface
 * Supports both main records and child records with proper relationships
 */

import { PostgreSQLDatabase } from './database.js';
import { createSchema } from './schema.js';
import { recordVersion } from 'form0-core';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export class Form0PostgreSQLConnector {
  constructor() {
    this.db = null;
    this.config = {};
    this.isInitialized = false;
  }

  /**
   * Initialize the connector with configuration
   * @param {Object} config - Connector configuration from form0-cli
   * @param {Object} envVars - Environment variables (optional override)
   */
  async initialize(config = {}, envVars = {}) {
    try {
      // Merge environment variables with any overrides
      const env = { ...process.env, ...envVars };
      
      this.config = {
        host: env.FORM0_PG_HOST || 'localhost',
        port: parseInt(env.FORM0_PG_PORT) || 5432,
        database: env.FORM0_PG_DATABASE,
        username: env.FORM0_PG_USERNAME,
        password: env.FORM0_PG_PASSWORD,
        ssl: env.FORM0_PG_SSL === 'true',
        sslRejectUnauthorized: env.FORM0_PG_SSL_REJECT_UNAUTHORIZED !== 'false',
        maxConnections: parseInt(env.FORM0_PG_MAX_CONNECTIONS) || 10,
        idleTimeout: parseInt(env.FORM0_PG_IDLE_TIMEOUT) || 30000,
        connectionTimeout: parseInt(env.FORM0_PG_CONNECTION_TIMEOUT) || 5000,
        tableName: env.FORM0_PG_TABLE_NAME || 'form0_submissions',
        schema: env.FORM0_PG_SCHEMA || 'public',
        debug: env.FORM0_PG_DEBUG === 'true',
        ...config // Allow config to override environment variables
      };

      // Validate required configuration
      if (!this.config.database) {
        throw new Error('FORM0_PG_DATABASE environment variable is required');
      }
      if (!this.config.username) {
        throw new Error('FORM0_PG_USERNAME environment variable is required');
      }
      if (!this.config.password) {
        throw new Error('FORM0_PG_PASSWORD environment variable is required');
      }

      // Initialize database connection
      this.db = new PostgreSQLDatabase(this.config);
      await this.db.connect();

      // Ensure tables exist with proper schema
      await createSchema(this.db, this.config);

      this.isInitialized = true;
      
      if (this.config.debug) {
        console.log('[form0-connector-pg] Initialized successfully');
      }
    } catch (error) {
      throw new Error(`Failed to initialize PostgreSQL connector: ${error.message}`);
    }
  }

  /**
   * Handle form submission - called by form0-cli when a form is submitted
   * Supports both main records and nested child records from RepeatableSections
   * @param {Object} structuredRecord - The structured record from record-transformer.js
   * @returns {Promise<Object>} Result object with success/error information
   */
  async onFormSubmit(structuredRecord) {
    if (!this.isInitialized) {
      throw new Error('Connector not initialized. Call initialize() first.');
    }

    try {
      // Validate record version (optional safety check)
      if (structuredRecord.version && !recordVersion.isValid(structuredRecord.version)) {
        console.warn(`[form0-connector-pg] Invalid record version: ${structuredRecord.version}`);
      }

      // Set server timestamps (as the database is the "server" in this context)
      const serverTimestamp = new Date().toISOString();
      const recordWithServerTimestamps = {
        ...structuredRecord,
        updated_at: serverTimestamp, // Server update time is canonical
        updated_at_server: serverTimestamp,
        // Only set server created_at if it's not already set (for new records)
        created_at_server: structuredRecord.created_at_server || serverTimestamp
      };

      // Insert main record first
      const mainResult = await this.db.insertRecord(recordWithServerTimestamps);
      
      if (this.config.debug) {
        console.log('[form0-connector-pg] Main record inserted successfully:', mainResult.recordId);
      }

      // Process child records from RepeatableSections
      const childResults = [];
      const processedChildRecords = [];

      // Recursive function to process RepeatableSections at any nesting level
      const processRepeatableSections = async (formValues, mainRecordId, parentRecordId, sectionPath = '') => {
        const results = [];
        
        for (const [key, value] of Object.entries(formValues)) {
          if (Array.isArray(value) && value.length > 0 && value[0].id) {
            // This is a RepeatableSection with child records
            const childRecords = value;
            const currentSectionPath = sectionPath ? `${sectionPath}.${key}` : key;
            
            if (this.config.debug) {
              console.log(`[form0-connector-pg] Processing RepeatableSection "${currentSectionPath}" with ${childRecords.length} child records`);
            }

            // Process each child record in this RepeatableSection
            for (let i = 0; i < childRecords.length; i++) {
              const childRecord = childRecords[i];
              
              // Set server timestamps for child record
              const childWithServerTimestamps = {
                ...childRecord,
                updated_at: serverTimestamp,
                updated_at_server: serverTimestamp,
                created_at_server: childRecord.created_at_server || serverTimestamp
              };

              // Insert child record with proper relationships
              const childResult = await this.db.insertRecord(childWithServerTimestamps, {
                isChildRecord: true,
                mainRecordId: mainRecordId,
                parentRecordId: parentRecordId
              });

              results.push({
                sectionKey: currentSectionPath,
                childIndex: i,
                childRecordId: childResult.childRecordId,
                parentRecordId: parentRecordId
              });

              if (this.config.debug) {
                console.log(`[form0-connector-pg] Child record ${i + 1} inserted:`, childResult.childRecordId);
              }

              // Recursively process nested RepeatableSections within this child record
              if (childWithServerTimestamps.form_values) {
                const nestedResults = await processRepeatableSections(
                  childWithServerTimestamps.form_values,
                  mainRecordId,
                  childResult.childRecordId, // This child becomes the parent for nested records
                  currentSectionPath
                );
                results.push(...nestedResults);
              }
            }
          }
        }
        
        return results;
      };

      // Process all RepeatableSections starting from the main record
      const allChildResults = await processRepeatableSections(
        recordWithServerTimestamps.form_values,
        mainResult.recordId,
        mainResult.recordId // For top-level RepeatableSections, parent is main record
      );

      childResults.push(...allChildResults);
      processedChildRecords.push(...allChildResults);

      return {
        success: true,
        recordId: mainResult.recordId,
        childRecords: processedChildRecords,
        message: `Record stored successfully in PostgreSQL (main + ${childResults.length} child records)`,
        timestamp: serverTimestamp,
        serverTimestamps: {
          created_at_server: recordWithServerTimestamps.created_at_server,
          updated_at_server: serverTimestamp
        }
      };
    } catch (error) {
      console.error('[form0-connector-pg] Failed to store record:', error.message);
      
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Check if the connector is healthy and can connect to the database
   * @returns {Promise<Object>} Health check result
   */
  async healthCheck() {
    try {
      if (!this.isInitialized) {
        return {
          healthy: false,
          message: 'Connector not initialized'
        };
      }

      const isConnected = await this.db.healthCheck();
      
      return {
        healthy: isConnected,
        message: isConnected ? 'PostgreSQL connection healthy' : 'PostgreSQL connection failed',
        database: this.config.database,
        host: this.config.host,
        port: this.config.port
      };
    } catch (error) {
      return {
        healthy: false,
        message: `Health check failed: ${error.message}`
      };
    }
  }

  /**
   * Get connector metadata and information
   * @returns {Object} Connector metadata
   */
  getMetadata() {
    return {
      name: 'form0-connector-pg',
      version: '0.0.1-alpha.1',
      description: 'PostgreSQL connector for form0',
      type: 'database',
      database: 'postgresql',
      initialized: this.isInitialized,
      config: {
        host: this.config.host,
        port: this.config.port,
        database: this.config.database,
        schema: this.config.schema,
        tableName: this.config.tableName,
        // Don't expose sensitive information
        username: this.config.username ? '***' : null
      }
    };
  }

  /**
   * Clean up resources and close connections
   */
  async destroy() {
    if (this.db) {
      await this.db.disconnect();
      this.db = null;
    }
    this.isInitialized = false;
    
    if (this.config.debug) {
      console.log('[form0-connector-pg] Connector destroyed');
    }
  }
}

// Export default instance for easy importing
export default Form0PostgreSQLConnector;