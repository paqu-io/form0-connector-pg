/**
 * Basic usage example for form0-connector-pg
 * This shows how to use the connector independently for testing
 * Demonstrates both main records and child records from RepeatableSections
 */

import { Form0PostgreSQLConnector } from '../src/index.js';
import { randomUUID } from 'crypto';

// Example structured record with RepeatableSections (as would come from record-transformer.js)
const exampleRecord = {
  id: randomUUID(), // Generate a proper UUID for main record
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
    // Regular form fields
    name: 'John Doe',
    email: 'john.doe@example.com',
    message: 'Hello, this is a test form submission!',
    subscribe_newsletter: true,
    contact_preferences: ['email', 'phone'],
    
    // RepeatableSection with child records
    attendees: [
      {
        id: randomUUID(), // Child record ID
        status: 'completed',
        version: 1,
        draft: false,
        created_at: '2024-01-15T10:30:00.000Z',
        updated_at: null,
        created_at_client: '2024-01-15T10:30:00.000Z',
        updated_at_client: new Date().toISOString(),
        created_at_server: null,
        updated_at_server: null,
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
        geometry: null,
        form_values: {
          attendee_name: 'Alice Johnson',
          attendee_email: 'alice@example.com',
          dietary_restrictions: 'vegetarian',
          // RepeatableSection with child records
          relatives: [
            {
              id: randomUUID(), // Child record ID
              status: 'completed',
              version: 1,
              draft: false,
              created_at: '2024-01-15T10:30:00.000Z',
              updated_at: null,
              created_at_client: '2024-01-15T10:30:00.000Z',
              updated_at_client: new Date().toISOString(),
              created_at_server: null,
              updated_at_server: null,
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
              geometry: null,
              form_values: {
                relative_name: 'Bob Smith',
                relative_email: 'bob@example.com',
                relative_relationship: 'brother'
              }
            },
            {
              id: randomUUID(), // Child record ID
              status: 'completed',
              version: 1,
              draft: false,
              created_at: '2024-01-15T10:30:00.000Z',
              updated_at: null,
              created_at_client: '2024-01-15T10:30:00.000Z',
              updated_at_client: new Date().toISOString(),
              created_at_server: null,
              updated_at_server: null,
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
              geometry: null,
              form_values: {
                relative_name: 'Charlie Brown',
                relative_email: 'charlie@example.com',
                relative_relationship: 'sister'
              }
            }            
          ]
        }
      },
      {
        id: randomUUID(), // Child record ID
        status: 'completed',
        version: 1,
        draft: false,
        created_at: '2024-01-15T10:30:00.000Z',
        updated_at: null,
        created_at_client: '2024-01-15T10:30:00.000Z',
        updated_at_client: new Date().toISOString(),
        created_at_server: null,
        updated_at_server: null,
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
        geometry: null,
        form_values: {
          attendee_name: 'Bob Smith',
          attendee_email: 'bob@example.com',
          dietary_restrictions: 'none'
        }
      }
    ],
    
    // Another RepeatableSection
    activities: [
      {
        id: randomUUID(), // Child record ID
        status: 'completed',
        version: 1,
        draft: false,
        created_at: '2024-01-15T10:30:00.000Z',
        updated_at: null,
        created_at_client: '2024-01-15T10:30:00.000Z',
        updated_at_client: new Date().toISOString(),
        created_at_server: null,
        updated_at_server: null,
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
        geometry: null,
        form_values: {
          activity_name: 'Workshop A',
          activity_duration: 120,
          activity_description: 'Introduction to form0',
          // NESTED RepeatableSection - this won't be processed correctly!
          participants: [
            {
              id: randomUUID(), // Nested child record ID
              status: 'completed',
              version: 1,
              draft: false,
              created_at: '2024-01-15T10:30:00.000Z',
              updated_at: null,
              created_at_client: '2024-01-15T10:30:00.000Z',
              updated_at_client: new Date().toISOString(),
              created_at_server: null,
              updated_at_server: null,
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
              geometry: null,
              form_values: {
                participant_name: 'Alice Johnson',
                participant_role: 'attendee',
                participant_notes: 'First time user'
              }
            },
            {
              id: randomUUID(), // Nested child record ID
              status: 'completed',
              version: 1,
              draft: false,
              created_at: '2024-01-15T10:30:00.000Z',
              updated_at: null,
              created_at_client: '2024-01-15T10:30:00.000Z',
              updated_at_client: new Date().toISOString(),
              created_at_server: null,
              updated_at_server: null,
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
              geometry: null,
              form_values: {
                participant_name: 'Bob Smith',
                participant_role: 'instructor',
                participant_notes: 'Experienced user'
              }
            }
          ]
        }
      }
    ]
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
    
    // Submit the example record with RepeatableSections
    console.log('💾 Submitting example record with RepeatableSections...');
    const result = await connector.onFormSubmit(exampleRecord);
    
    if (result.success) {
      console.log('✅ Record submitted successfully:', result);
      console.log(`📊 Summary: Main record + ${result.childRecords.length} child records`);
      
      // Show child record details
      if (result.childRecords.length > 0) {
        console.log('👥 Child records processed:');
        result.childRecords.forEach((child, index) => {
          console.log(`  ${index + 1}. ${child.sectionKey} (index ${child.childIndex}): ${child.childRecordId}`);
        });
      }
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