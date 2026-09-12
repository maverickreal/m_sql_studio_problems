# MSqlStudio Problems

Canonical problem bank for the MSqlStudio SQL learning platform. Contains 200+ SQL assignments in YAML format with reusable datasets.

## Overview

This repository is the **single canonical source** of all SQL assignments for MSqlStudio. Problems are synchronized into the platform's database via the `problems-sync` BullMQ job (triggered by GitHub push webhook or manual API call).

## Structure

```
m_sql_studio_problems/
├── problems/              # Assignment YAML files (organized by category)
│   ├── joins/
│   ├── aggregation/
│   ├── cte/
│   ├── window-functions/
│   └── ... (20+ categories)
├── datasets/              # Reusable SQL datasets
│   ├── hr/
│   │   ├── schema.sql     # CREATE TABLE statements
│   │   └── seed.sql       # Deterministic INSERT statements
│   ├── commerce/
│   └── ...
├── schemas/
│   └── problem-v1.json    # JSON Schema for problem validation
├── scripts/
│   ├── validate-problems.mjs    # Validates all problem YAMLs against schema
│   └── validate-datasets.mjs    # Validates dataset SQL syntax
└── gold/                  # Golden master reference files (internal)
```

## Problem Format

Problems are YAML files in `problems/<category>/<id>.yaml` following the schema in `schemas/problem-v1.json`.

### Key Requirements

- **SQL assignments only** — not LeetCode-style algorithmic problems
- UUID v7 `id` field (immutable)
- Unique `slug` (URL-safe)
- `category` must match the directory name
- `datasets` — non-empty array of dataset slugs that must exist under `datasets/`
- `origin` — either `community` (contributor PR) or `first-party` (maintainer)
- Author = GitHub handle only (no PII)
- License = CC-BY-4.0
- `schema_version: 1`

### Example Problem

```yaml
id: "0192f0a1-2b3c-7d8e-9f0a-1b2c3d4e5f90"
slug: "employees-sharing-manager"
title: "Employees Who Share a Manager"
description: |
  List pairs of distinct employees who report to the same manager.
  Return names ordered by manager then employee.
difficulty: medium
mode: read
category: joins
datasets:
  - hr
sampleInput:
  - "employees(id, name, dept_id, salary, hire_date, manager_id)"
sampleOutput: "emp_a | emp_b | manager_id"
initSql: |
  -- Dataset: hr
solutionSql: |
  SELECT a.name AS emp_a, b.name AS emp_b, a.manager_id
  FROM employees a
  JOIN employees b ON a.manager_id = b.manager_id AND a.id < b.id
  WHERE a.manager_id IS NOT NULL
  ORDER BY a.manager_id, emp_a, emp_b;
validationSql: |
  SELECT CASE WHEN NOT EXISTS (
    SELECT 1 FROM (
      SELECT a.name AS emp_a, b.name AS emp_b, a.manager_id
      FROM employees a
      JOIN employees b ON a.manager_id = b.manager_id AND a.id < b.id
      WHERE a.manager_id IS NOT NULL
      ORDER BY a.manager_id, emp_a, emp_b
    ) user_result
    EXCEPT
    SELECT 1 FROM (
      VALUES 
        ('Bob Smith', 'Carol Davis', 1),
        ('Eva Martinez', 'Frank Brown', 4)
    ) expected(emp_a, emp_b, manager_id)
  ) THEN 1 ELSE 0 END AS correct;
orderMatters: true
origin: first-party
author: sat-c2
license: CC-BY-4.0
schema_version: 1
```

## Datasets

Datasets are reusable SQL catalogs under `datasets/<slug>/` with:
- `schema.sql` — CREATE TABLE statements
- `seed.sql` — Deterministic INSERT statements

Problems reference datasets by slug in the `datasets` field.

### Contribution Tiers

| Tier | What | Allowed SQL | Merge Bar |
|------|------|-------------|-----------|
| 1 (default) | Problem YAML | Read/write against named dataset tables | Tests + CI + intelligence approval |
| 2 (overlay) | YAML + `overlaySql` | Extra tables/rows; must not DROP/ALTER published datasets | Same + higher scrutiny |
| 3 (new dataset) | New `datasets/<slug>/` | New schema + finite deterministic seed | Maintainer merge + tests of all problems that will use it |

## Validation

```bash
# Validate all problems against schema
bun run validate

# Validate dataset SQL syntax
bun run validate:datasets

# Run all tests
bun test
```

## Sync to Platform

Problems are materialized into MongoDB (`problems`, `sync_state` collections) via:

1. **GitHub Push Webhook** — `POST /api/webhooks/github` on API Gateway
   - Verifies `X-Hub-Signature-256` (HMAC-SHA256 with `GITHUB_WEBHOOK_SECRET`)
   - Enqueues BullMQ job `client_sql_studio_problems_sync`
   - Redis dedup via `X-GitHub-Delivery` (24h TTL)

2. **Manual Sync** — `POST /internal/problems-sync` (requires `x-internal-api-key`)
   - Optional `{forced: true}` for full resync

3. **DEV Fixtures** — Read from `GITHUB_PROBLEMS_LOCAL_DIR` env var

## License

All contributions are licensed under [CC-BY-4.0](LICENSE). By contributing, you agree that your contributions will be licensed under CC-BY-4.0.

## Developer Certificate of Origin (DCO)

We require all contributors to sign off on their commits using the **Developer Certificate of Origin (DCO)**.

```bash
git commit -s -m "Add problem: employees above average salary"
```

This adds a line like:
```
Signed-off-by: Your Name <your.email@example.com>
```

No Contributor License Agreement (CLA) is required. The DCO is sufficient.

See [CONTRIBUTING.md](CONTRIBUTING.md) for full details.

## Related Repositories

- [m_sql_studio](../m_sql_studio) — Orchestrator with Docker Compose
- [m_sql_studio_api_gateway](../m_sql_studio_api_gateway) — REST API (handles webhook + sync)
- [m_sql_studio_sandbox](../m_sql_studio_sandbox) — Executes user SQL against problem schemas
- [m_sql_studio_client](../m_sql_studio_client) — Web UI for solving problems