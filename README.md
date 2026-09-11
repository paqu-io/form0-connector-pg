# form0-connector-pg

[![NPM Version](https://img.shields.io/npm/v/form0-connector-pg)](https://www.npmjs.com/package/form0-connector-pg)
[![NPM Downloads](https://img.shields.io/npm/dm/form0-connector-pg)](https://www.npmjs.com/package/form0-connector-pg)
[![CI](https://github.com/paqu-io/form0-connector-pg/actions/workflows/ci.yml/badge.svg)](https://github.com/paqu-io/form0-connector-pg/actions/workflows/ci.yml)
![NPM License](https://img.shields.io/npm/l/form0-connector-pg)
[![Docs](https://img.shields.io/badge/docs-docs.form0.dev-2563eb)](https://docs.form0.dev)
[![Website](https://img.shields.io/badge/site-form0.dev-0f172a)](https://form0.dev)
![NPM Last Update](https://img.shields.io/npm/last-update/form0-connector-pg)
[![Socket](https://socket.dev/api/badge/npm/package/form0-connector-pg)](https://socket.dev/npm/package/form0-connector-pg)

> [!NOTE]
> form0 is in active development and is available to use today. Its schema format and core
> concepts are stable in practice, but releases before 1.0 may include breaking changes. Pin your
> versions and review the release notes when upgrading. A formally stable release is coming.

`form0-connector-pg` stores form0 structured records in a PostgreSQL database that you control. It
keeps the complete form payload as JSONB while projecting common metadata into dedicated columns
and preserving parent-child relationships for repeatable sections.

## 🚀 Start with the CLI

The recommended integration path is [`form0-cli`](https://github.com/paqu-io/form0-cli). From the
interactive CLI, install and configure the connector:

```text
form0> connector install form0-connector-pg
form0> connector configure form0-connector-pg
form0> connector test form0-connector-pg
```

Follow the [form0 quickstart](https://docs.form0.dev/getting-started/quickstart) first if you do not
already have a project.

## 📦 Direct installation

```bash
npm install form0-connector-pg
```

Copy the variables you need from `.env.example` into a local `.env.local` file. At minimum,
configure the database name, username, and password. Do not commit `.env.local` or database
credentials.

```dotenv
FORM0_CONNECTOR_PG_HOST=localhost
FORM0_CONNECTOR_PG_PORT=5432
FORM0_CONNECTOR_PG_DATABASE=form0
FORM0_CONNECTOR_PG_USERNAME=form0
FORM0_CONNECTOR_PG_PASSWORD=replace-me
```

The connector can also be initialized directly:

```javascript
import { Form0PostgreSQLConnector } from 'form0-connector-pg';

const connector = new Form0PostgreSQLConnector();

await connector.initialize();
console.log(await connector.healthCheck());

// Pass canonical structured records to connector.onFormSubmit(record).

await connector.destroy();
```

`initialize(config, envVars)` accepts explicit configuration overrides when environment variables
are not appropriate for the host application.

## Storage behavior

- The configured schema and tables are created when the connector initializes.
- Main submissions and nested repeatable-section records retain their relationships.
- Canonical structured records are accepted through `onFormSubmit()`.
- Server timestamps are added when records are stored.
- `healthCheck()` reports connection health, and `destroy()` closes the pool.

Review schema changes and database permissions before using the connector with production data.
Use a dedicated database role with only the privileges the connector needs, require TLS for remote
connections, and keep credentials outside source control.

## ✅ Requirements

- Node.js 22 or newer
- PostgreSQL reachable from the process running the connector
- Permission to create and write the configured schema and tables

## 📚 Documentation

- [Quickstart](https://docs.form0.dev/getting-started/quickstart)
- [Full documentation](https://docs.form0.dev)
- [Direct usage example](./examples/basic-usage.js)

## 🔒 Security

Report vulnerabilities according to [SECURITY.md](./SECURITY.md). For database deployments, the
application remains responsible for network access, credentials, PostgreSQL authorization,
backups, retention, and regulatory requirements.

## 🤝 Support and contributing

See [SUPPORT.md](https://github.com/paqu-io/form0-connector-pg/blob/main/SUPPORT.md) for help and
[CONTRIBUTING.md](https://github.com/paqu-io/form0-connector-pg/blob/main/CONTRIBUTING.md) to contribute.

## 📄 License

[MIT](./LICENSE)
