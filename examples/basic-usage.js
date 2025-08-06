/**
 * Basic usage example for form0-connector-pg
 * This shows how to use the connector independently for testing
 */

import { Form0PostgreSQLConnector } from '../src/index.js';
import { randomUUID } from 'crypto';

// Example structured record (as would come from record-transformer.js)
const exampleRecord = {
  id: randomUUID(), // Generate a proper UUID
  status: 'completed',
  version: 1,
  draft: false,
  created_at: '2024-01-15T10:30:00.000Z', // Client creation time (canonical)
  updated_at: null, // Will be set by connector (server update time is canonical)
  created_at_client: '2024-01-15T10:30:00.000Z',
  updated_at_client: new Date().toISOString(),
  created_at_server: null, // Will be set by connector
  updated_at_server: null, // Will be set by connector
  created_by_id: null,
  updated_by_id: null,
  main_org_id: null,
  sub_org_id: null,
  project_id: null,
  form_id: 'contact_form_v1',
  changeset_id: null,
  created_location: null,
  updated_location: null,
  latitude: null,
  longitude: null,
  altitude: null,
  horizontal_accuracy: null,
  vertical_accuracy: null,
  created_duration: null,
  updated_duration: null,
  updated_duration_cumulative: null,
  form_values: {
    name: 'John Doe',
    email: 'john.doe@example.com',
    message: 'Hello, this is a test form submission!',
    subscribe_newsletter: true,
    contact_preferences: ['email', 'phone']
  }
};

async function runExample() {
  const connector = new Form0PostgreSQLConnector();
  
  try {
    console.log('🔌 Initializing PostgreSQL connector...');
    
    // Initialize with environment variables
    await connector.initialize();
    
    console.log('✅ Connector initialized successfully');
    
    // Check health
    console.log('🏥 Checking database health...');
    const health = await connector.healthCheck();
    console.log('Health check result:', health);
    
    if (!health.healthy) {
      throw new Error('Database is not healthy');
    }
    
    // Get connector metadata
    console.log('📋 Connector metadata:');
    console.log(JSON.stringify(connector.getMetadata(), null, 2));
    
    // Submit the example record
    console.log('💾 Submitting example record...');
    const result = await connector.onFormSubmit(exampleRecord);
    
    if (result.success) {
      console.log('✅ Record submitted successfully:', result);
    } else {
      console.error('❌ Failed to submit record:', result);
    }
    
  } catch (error) {
    console.error('❌ Example failed:', error.message);
  } finally {
    // Clean up
    console.log('🧹 Cleaning up...');
    await connector.destroy();
    console.log('✅ Example completed');
  }
}

// Run the example if this file is executed directly
// Simplified check that works across platforms
if (process.argv[1] && process.argv[1].includes('basic-usage.js')) {
  runExample().catch(console.error);
}

export { runExample, exampleRecord };