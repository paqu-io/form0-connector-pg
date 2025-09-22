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

---

<!-- END UPDATABLE SECTIONS - /check-docs command updates sections above this line -->

## MCP Memory

**TL;DR**: Log engineering decisions as one-line facts. Search before proposing changes, write after making decisions.

Use the MCP Memory server as an ENGINEERING KNOWLEDGE LOG (not source code).

### When to read (and show your work)
- Before proposing or changing implementation in the current scope:
  1) search memory for that scope,
  2) print a one-line banner:
     🔎 Memory[<scope>] hits=<n>, last=<YYYY-MM-DD>, note: partial store
  3) if hits exist, show a 3–6 bullet "Prior decisions & constraints" digest (one-liners).

### When to write
- After we converge on a choice, finish a spike/fix, capture a trade-off, or log a blocking TODO/open question.
- De-dupe first (search by scope + similar text). If superseded, add a new DECISION and mark the older via OUTCOME [deprecated] with a ref.

### What to store (one-line facts, examples)
- **DECISION**: [DECISION] [scope:form0-connector-pg] [date:2025-01-22] Use dual table architecture for main and child records [refs:src/schema.js]
- **CONSTRAINT**: [CONSTRAINT] [scope:form0-connector-pg] [date:2025-01-22] Requires Node.js 18+ for built-in test runner support [refs:package.json]
- **APPROACH**: [APPROACH] [scope:form0-connector-pg] [date:2025-01-22] Hybrid storage with dedicated columns plus complete JSONB record [refs:src/database.js]
- **RATIONALE**: [RATIONALE] [scope:form0-connector-pg] [date:2025-01-22] Connection pooling improves performance for concurrent form submissions
- **OUTCOME**: [OUTCOME] [scope:form0-connector-pg] [date:2025-01-22] RepeatableSection child records properly maintain parent-child relationships
- **TODO**: [TODO] [scope:form0-connector-pg] [date:2025-01-22] Add migration scripts for schema updates
- **OPEN_QUESTION**: [OPEN_QUESTION] [scope:form0-connector-pg] [date:2025-01-22] Should JSONB indexes be configurable based on form schema?

### Format
```
[TAG] [scope:<repo|package|feature>] [date:YYYY-MM-DD] <concise statement> [refs:<issue|PR|commit|doc>] [prov:<session|author>]
```
Keep atomic and short (<200 chars). No secrets; no large code/logs (link via refs).

### Common Pitfalls
- Don't log implementation details (log decisions instead)
- Don't duplicate information already in ADRs/README
- Search first to avoid duplicates
- Focus on "why" not "what" for decisions

### Incompletness and backfill
- memory.json may be incomplete. Treat it as a working set, not the source of truth.
- If you infer a stable fact (e.g., from ADRs/README/code) that's missing, propose adding a matching one-line note (DECISION/CONSTRAINT/APPROACH).
- When a suggestion might conflict with unstored history, say: "Memory may be incomplete; verify with ADR/docs" and offer to backfill.

### Scoping and entities
- Default scope = current repo or top-level folder; narrow to package/feature if obvious (e.g., form0-core, form0-react).
- Attach observations to Entities like Project, Package/Service, Feature, DecisionTopic. Use active relations when useful.

### Provenance (optional)
- If available, add lightweight provenance in the note's bracket, e.g. [prov:session=<id>] or [prov:author=claude-code].
- Do NOT rely on provenance for retrieval/ranking; it's for traceability only and can be omitted.

### Hygiene
- ISO dates; single-line bullets; avoid duplicates.
- Prefer updating facts over adding near-duplicates.
