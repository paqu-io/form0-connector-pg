# Release Testing Log

This document is for tracking testing notes, procedures, and any issues found during the release process.

## Usage Instructions

- For each release, add a new section with the release version and date.
- List the testing steps performed, observations, and results.
- Note any bugs, regressions, or unexpected behaviors.
- Mark each test as "Passed" or "Failed". Attach screenshots or logs if helpful.

---

## Example

### Release v1.2.3 (2024-06-10)

**Testing Steps:**
- [x] Database migrations apply cleanly
- [x] Integration tests run (`npm run test:integration`)
- [x] Connection to staging PostgreSQL instance verified
- [ ] Manual rollback on migration failure

**Observations:**
- Automated tests: Passed
- Manual rollback: Failed due to missing permissions (see issue #45)

**Results:**
- Release blocked until rollback permissions are fixed

---

Add your release testing notes below.
