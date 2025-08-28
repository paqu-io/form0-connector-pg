# Release Testing Log

Use this document to record testing notes, procedures, and any issues encountered during the release process.

## How to Use

- For each release, create a new section with the release version and date.
- List the testing steps performed, observations, and results.
- Note any bugs, regressions, or unexpected behaviors.
- Mark each test as "Passed" or "Failed" and include any relevant screenshots or logs if needed.

---

## Example

### Release v1.2.3 (2024-06-10)

**Testing Steps:**
- [x] Verified database migrations apply cleanly
- [x] Ran integration tests (`npm run test:integration`)
- [x] Checked connection to staging PostgreSQL instance
- [ ] Manually tested rollback on migration failure

**Observations:**
- All automated tests passed.
- Manual rollback test failed due to missing permissions (see issue #45).

**Results:**
- Release is blocked until rollback permissions are fixed.

---

Add your release testing notes below.
