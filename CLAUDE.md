# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- **Test**: `npm test` (uses Node.js built-in test runner)
- **Format code**: `npm run format` (Prettier)
- **Check formatting**: `npm run format:check`

Tests include both unit tests and integration tests. Integration tests require database configuration via environment variables and will be skipped if not available.

## form0 Ecosystem

This project, `form0-connector-pg`, is a PostgreSQL connector extension for the form0 ecosystem. It provides persistent storage capabilities for form submissions by integrating with PostgreSQL databases.

`form0-connector-pg` serves as a data persistence layer for:

- **form0-cli**: Can be installed and configured through the CLI to enable PostgreSQL storage for form submissions
- **form0-core**: Implements the standard connector interface to receive and store form engine output
- **form0-react**: React applications can use this connector to persist form data to PostgreSQL
- **form0-react-native**: Mobile applications can leverage this connector for server-side data storage

### Installation via form0-cli
This connector is designed to be installed and managed through `form0-cli`:
- Install via CLI package management commands
- Configure database connections through CLI configuration
- Integrate seamlessly with form0 development workflows
- Enable form submission storage during development and production

## Architecture Overview

This is a PostgreSQL connector for the form0 ecosystem that stores form submissions in a hybrid approach:
- **Hybrid Storage**: Common fields in dedicated columns + complete record as JSONB
- **Dual Table Architecture**: 
  - `form0_submissions` (main records)
  - `form0_submissions_children` (child records from RepeatableSections)

### Core Components

**src/index.js** - Main connector class implementing the form0 connector interface:
- `Form0PostgreSQLConnector` class with standard lifecycle methods
- Handles both main records and nested child records from RepeatableSections
- Processes records recursively to support multiple nesting levels
- Sets server timestamps and validates record structure

**src/database.js** - Database operations layer:
- `PostgreSQLDatabase` class managing connections via pg Pool
- Separate insert logic for main vs child records with proper relationships
- Connection pooling, health checks, and error handling

**src/schema.js** - Database schema management:
- Creates both main and child tables with proper foreign key relationships
- Comprehensive indexing strategy for performance
- Automatic trigger functions for updated_at_db timestamps

### Key Features

- **RepeatableSection Support**: Automatically processes nested child records from form RepeatableSections, maintaining proper parent-child relationships
- **Relationship Tracking**: Child records reference both main record ID and immediate parent record ID for flexible querying
- **Environment-based Configuration**: All database credentials and settings via FORM0_PG_* environment variables
- **Timestamp Management**: Preserves client timestamps while adding server timestamps for audit trail

### Dependencies

- **form0-core**: Local dependency (`file:../form0-core`) for record validation and version checking
- **pg**: PostgreSQL client with connection pooling
- **dotenv**: Environment variable management

### Testing Strategy

Uses Node.js built-in test runner (requires Node 18+). Tests are split into:
- Unit tests: Basic functionality without database
- Integration tests: Full database workflow (conditionally skipped)

The `examples/basic-usage.js` file demonstrates complete usage including complex nested RepeatableSections.

### Database Configuration

Required environment variables for database connection:
- `FORM0_PG_DATABASE`, `FORM0_PG_USERNAME`, `FORM0_PG_PASSWORD`

Optional configuration includes connection pooling, SSL, schema settings, and debug mode. See README.md for complete list.