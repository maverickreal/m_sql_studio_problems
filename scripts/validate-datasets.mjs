import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const DATASETS_DIR = path.join(ROOT_DIR, 'datasets');

export function validateDatasets() {
  const errors = [];
  const warnings = [];

  if (!fs.existsSync(DATASETS_DIR)) {
    return { valid: true, errors, warnings, datasets: [] };
  }

  const datasets = fs.readdirSync(DATASETS_DIR, { withFileTypes: true })
    .filter(e => e.isDirectory())
    .map(e => e.name);

  for (const slug of datasets) {
    const dsDir = path.join(DATASETS_DIR, slug);

    // Check schema.sql exists
    const schemaPath = path.join(dsDir, 'schema.sql');
    if (!fs.existsSync(schemaPath)) {
      errors.push(`Dataset '${slug}': missing schema.sql`);
    } else {
      const schemaContent = fs.readFileSync(schemaPath, 'utf8');
      if (!schemaContent.trim()) {
        errors.push(`Dataset '${slug}': schema.sql is empty`);
      }
      // Deny-list check on schema SQL
      const denyPatterns = [
        { pattern: /\bCOPY\b/i, name: 'COPY' },
        { pattern: /\bGRANT\b/i, name: 'GRANT' },
        { pattern: /\bREVOKE\b/i, name: 'REVOKE' },
        { pattern: /\bALTER\s+SYSTEM\b/i, name: 'ALTER SYSTEM' },
        { pattern: /\bCREATE\s+EXTENSION\b/i, name: 'CREATE EXTENSION' },
        { pattern: /\bdblink\b/i, name: 'dblink' },
        { pattern: /\bfile_fdw\b/i, name: 'file_fdw' },
        { pattern: /\bpg_read_file\b/i, name: 'pg_read_file' },
        { pattern: /\bpg_ls_dir\b/i, name: 'pg_ls_dir' },
        { pattern: /\blo_import\b/i, name: 'lo_import' },
        { pattern: /\blo_export\b/i, name: 'lo_export' },
      ];
      for (const { pattern, name } of denyPatterns) {
        if (pattern.test(schemaContent)) {
          errors.push(`Dataset '${slug}': schema.sql contains denied statement '${name}'`);
        }
      }
    }

    // Check seed.sql exists
    const seedPath = path.join(dsDir, 'seed.sql');
    if (!fs.existsSync(seedPath)) {
      errors.push(`Dataset '${slug}': missing seed.sql`);
    } else {
      const seedContent = fs.readFileSync(seedPath, 'utf8');
      if (!seedContent.trim()) {
        warnings.push(`Dataset '${slug}': seed.sql is empty`);
      }
      // Deny-list check on seed SQL
      const denyPatterns = [
        { pattern: /\bCOPY\b/i, name: 'COPY' },
        { pattern: /\bGRANT\b/i, name: 'GRANT' },
        { pattern: /\bREVOKE\b/i, name: 'REVOKE' },
        { pattern: /\bALTER\s+SYSTEM\b/i, name: 'ALTER SYSTEM' },
        { pattern: /\bCREATE\s+EXTENSION\b/i, name: 'CREATE EXTENSION' },
        { pattern: /\bdblink\b/i, name: 'dblink' },
        { pattern: /\bfile_fdw\b/i, name: 'file_fdw' },
        { pattern: /\bpg_read_file\b/i, name: 'pg_read_file' },
        { pattern: /\bpg_ls_dir\b/i, name: 'pg_ls_dir' },
        { pattern: /\blo_import\b/i, name: 'lo_import' },
        { pattern: /\blo_export\b/i, name: 'lo_export' },
      ];
      for (const { pattern, name } of denyPatterns) {
        if (pattern.test(seedContent)) {
          errors.push(`Dataset '${slug}': seed.sql contains denied statement '${name}'`);
        }
      }
    }

    // Check README.md exists (optional but recommended)
    const readmePath = path.join(dsDir, 'README.md');
    if (!fs.existsSync(readmePath)) {
      warnings.push(`Dataset '${slug}': missing README.md (recommended)`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    datasets
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(__filename)) {
  const result = validateDatasets();
  if (result.warnings.length > 0) {
    console.log('\u26a0\ufe0f  Warnings:');
    for (const w of result.warnings) {
      console.log('  ', w);
    }
  }
  if (!result.valid) {
    console.error('\u274c Dataset validation failed:');
    for (const err of result.errors) {
      console.error(' ', err);
    }
    process.exit(1);
  }
  console.log(`\u2705 Successfully validated ${result.datasets.length} dataset(s).`);
}
