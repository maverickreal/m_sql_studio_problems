# Contributing to m_sql_studio_problems

Thank you for contributing SQL problems to MSqlStudio!

## License

All contributions are licensed under [CC-BY-4.0](LICENSE). By contributing, you agree that your contributions will be licensed under CC-BY-4.0.

## Developer Certificate of Origin (DCO)

We require all contributors to sign off on their commits using the **Developer Certificate of Origin (DCO)**. This is a simple statement that you have the right to submit the contribution under the project's license.

**No Contributor License Agreement (CLA) is required.** The DCO is sufficient.

### How to sign off

Add a `Signed-off-by` line to your commit message:

```
git commit -s -m "Add problem: employees above average salary"
```

This adds a line like:

```
Signed-off-by: Your Name <your.email@example.com>
```

The name and email must match your Git commit author identity.

### What the DCO means

By adding the `Signed-off-by` line, you certify that:

> (a) The contribution was created in whole or in part by me and I have the right to submit it under the license indicated in the file; or
> 
> (b) The contribution is based upon previous work that, to the best of my knowledge, is covered under an appropriate license and I have the right under that license to submit that work with modifications, whether created in whole or in part by me, under the same license (unless I am permitted to submit under a different license), as indicated in the file; or
> 
> (c) The contribution was provided directly to me by some other person who certified (a), (b) or (c) and I have not modified it.
> 
> (d) I understand and agree that this project and the contribution are public and that a record of the contribution (including all personal information I submit with it, including my sign-off) is maintained indefinitely and may be redistributed consistent with this project or the license(s) involved.

See [developercertificate.org](https://developercertificate.org/) for the full text.

## Problem format

Problems are YAML files in `problems/<category>/<id>.yaml` following the schema in `schemas/problem-v1.json`.

Key requirements:
- **SQL assignments only** — not LeetCode-style algorithmic problems
- UUID v7 `id` field (immutable)
- Unique `slug` (URL-safe)
- `category` must match the directory name
- `datasets` — non-empty array of dataset slugs that must exist under `datasets/`
- `origin` — either `community` (contributor PR) or `first-party` (maintainer)
- Author = GitHub handle only (no PII)
- License = CC-BY-4.0
- `schema_version: 1`

See `schemas/problem-v1.json` for the full schema and `problems/joins/` for examples.

## Datasets

Datasets are reusable SQL catalogs under `datasets/<slug>/` with `schema.sql` (CREATE TABLE) and `seed.sql` (deterministic INSERT).

- Problems reference datasets by slug in the `datasets` field
- Tier 1 contributions use existing datasets only
- Tier 2 adds `overlaySql` (extra CREATE/INSERT on top)
- Tier 3 adds new datasets — must include `datasets/<slug>/` files in the PR

## Contribution tiers

| Tier | What | Allowed SQL | Merge bar |
|------|------|-------------|-----------|
| 1 (default) | Problem YAML | Read/write against named dataset tables | Tests + CI + intelligence approval |
| 2 (overlay) | YAML + `overlaySql` | Extra tables/rows; must not DROP/ALTER published datasets | Same + higher scrutiny |
| 3 (new dataset) | New `datasets/<slug>/` | New schema + finite deterministic seed | Maintainer merge + tests of all problems that will use it |

## Issue templates

Use the issue templates for:
- **Propose a problem** — new problem submission
- **Report data error** — incorrect sample data, init SQL, or validation SQL

## Code of Conduct

Be respectful. No harassment. This project follows the [Contributor Covenant](https://www.contributor-covenant.org/version/2/1/code_of_conduct/).

## Questions?

Open an issue or ping @maverickreal.