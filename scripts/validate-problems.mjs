import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import parseYaml from 'yaml';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import crypto from 'node:crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const schemaPath = path.join(ROOT_DIR, 'schemas', 'problem-v1.json');
const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));

const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);
const validateSchema = ajv.compile(schema);

const FORBIDDEN_LEETCODE_FIELDS = ['test_cases', 'hints', 'statement'];

// SQL deny-list: dangerous statements that must never appear in contributions
const SQL_DENY_PATTERNS = [
  { pattern: /\bCOPY\b/i, name: 'COPY' },
  { pattern: /\bGRANT\b/i, name: 'GRANT' },
  { pattern: /\bREVOKE\b/i, name: 'REVOKE' },
  { pattern: /\bALTER\s+SYSTEM\b/i, name: 'ALTER SYSTEM' },
  { pattern: /\bSET\s+ROLE\b/i, name: 'SET ROLE' },
  { pattern: /\bSET\s+SESSION\s+AUTHORIZATION\b/i, name: 'SET SESSION AUTHORIZATION' },
  { pattern: /\bCREATE\s+EXTENSION\b/i, name: 'CREATE EXTENSION' },
  { pattern: /\bdblink\b/i, name: 'dblink' },
  { pattern: /\bfile_fdw\b/i, name: 'file_fdw' },
  { pattern: /\bpg_read_file\b/i, name: 'pg_read_file' },
  { pattern: /\bpg_ls_dir\b/i, name: 'pg_ls_dir' },
  { pattern: /\blo_import\b/i, name: 'lo_import' },
  { pattern: /\blo_export\b/i, name: 'lo_export' },
  { pattern: /\bCOPY\s+.*TO\s+PROGRAM\b/i, name: 'COPY TO PROGRAM' },
  { pattern: /\bDROP\s+(TABLE|DATABASE|SCHEMA)\b/i, name: 'DROP TABLE/DATABASE/SCHEMA' },
  { pattern: /\bALTER\s+TABLE\b/i, name: 'ALTER TABLE' },
];

export function findProblemFiles(dir) {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  const list = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of list) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results = results.concat(findProblemFiles(fullPath));
    } else if (entry.isFile() && (entry.name.endsWith('.yaml') || entry.name.endsWith('.yml'))) {
      results.push(fullPath);
    }
  }
  return results;
}

export function listDatasetSlugs(datasetsDir = path.join(ROOT_DIR, 'datasets')) {
  if (!fs.existsSync(datasetsDir)) return [];
  return fs.readdirSync(datasetsDir, { withFileTypes: true })
    .filter(e => e.isDirectory())
    .map(e => e.name);
}

export function checkDenyList(sqlContent, filePath) {
  const violations = [];
  if (!sqlContent) return violations;
  for (const { pattern, name } of SQL_DENY_PATTERNS) {
    if (pattern.test(sqlContent)) {
      violations.push(`Deny-list hit: '${name}' found in ${filePath}`);
    }
  }
  return violations;
}

export function checkTierRules(doc, filePath) {
  const errors = [];
  const tier = computeTier(doc);

  if (tier >= 2 && doc.overlaySql) {
    // Tier 2: overlaySql must not DROP/ALTER published dataset tables
    if (/\b(DROP|ALTER)\s+TABLE\b/i.test(doc.overlaySql)) {
      errors.push(`Tier ${tier} violation: overlaySql contains DROP/ALTER TABLE`);
    }
  }

  if (tier === 3 && doc.datasets) {
    // Tier 3: new dataset must exist under datasets/
    const existingDatasets = listDatasetSlugs();
    for (const slug of doc.datasets) {
      if (!existingDatasets.includes(slug)) {
        errors.push(`Tier 3 violation: new dataset '${slug}' must be added under datasets/`);
      }
    }
  }

  return { tier, errors };
}

export function computeTier(doc) {
  if (doc.datasets && doc.datasets.some(d => {
    const dsDir = path.join(ROOT_DIR, 'datasets', d);
    return !fs.existsSync(dsDir);
  })) {
    return 3; // New dataset slug referenced
  }
  if (doc.overlaySql && doc.overlaySql.trim()) {
    return 2; // Has overlay SQL
  }
  return 1; // Default: references only existing datasets
}

function normalizeForCloneCheck(doc) {
  // Normalize datasets slugs + solutionSql for exact-clone detection
  const datasets = (doc.datasets || []).slice().sort().join(',');
  const solution = (doc.solutionSql || '').replace(/\s+/g, ' ').trim();
  return `${datasets}|${solution}`;
}

export function validateProblemFile(filePath) {
  const errors = [];
  let content;
  try {
    content = fs.readFileSync(filePath, 'utf8');
  } catch (err) {
    return { valid: false, errors: [`Failed to read file ${filePath}: ${err.message}`] };
  }

  let doc;
  try {
    doc = parseYaml.parse(content);
  } catch (err) {
    return { valid: false, errors: [`YAML parse error in ${filePath}: ${err.message}`] };
  }

  if (!doc || typeof doc !== 'object') {
    return { valid: false, errors: [`${filePath} does not contain a valid YAML object`] };
  }

  // 1. JSON Schema validation
  const isValidSchema = validateSchema(doc);
  if (!isValidSchema) {
    for (const err of validateSchema.errors) {
      errors.push(`Schema error at ${err.instancePath || 'root'}: ${err.message}`);
    }
  }

  // 2. Category equals parent directory name
  const parentDir = path.basename(path.dirname(filePath));
  if (doc.category && doc.category !== parentDir) {
    errors.push(`Category '${doc.category}' does not match directory name '${parentDir}'`);
  }

  // 3. Forbidden LeetCode fields
  for (const field of FORBIDDEN_LEETCODE_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(doc, field)) {
      errors.push(`Contains forbidden LeetCode field: '${field}'`);
    }
  }

  // 4. License and schema_version checks
  if (doc.license !== 'CC-BY-4.0') {
    errors.push(`Invalid license '${doc.license}' (must be 'CC-BY-4.0')`);
  }
  if (doc.schema_version !== 1) {
    errors.push(`Invalid schema_version '${doc.schema_version}' (must be 1)`);
  }

  // 5. Datasets must exist under datasets/
  if (doc.datasets) {
    const existingDatasets = listDatasetSlugs();
    for (const slug of doc.datasets) {
      if (!existingDatasets.includes(slug)) {
        errors.push(`Dataset '${slug}' referenced but does not exist under datasets/`);
      }
    }
  }

  // 6. Tier rules
  const tierResult = checkTierRules(doc, filePath);
  errors.push(...tierResult.errors);

  // 7. Deny-list enforcement on all SQL fields
  const sqlFields = ['initSql', 'solutionSql', 'validationSql', 'overlaySql'];
  for (const field of sqlFields) {
    if (doc[field]) {
      const violations = checkDenyList(doc[field], field);
      errors.push(...violations);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    doc,
    tier: tierResult.tier
  };
}

export function validateProblemsDir(problemsDir = path.join(ROOT_DIR, 'problems')) {
  const files = findProblemFiles(problemsDir);
  if (files.length === 0) {
    return { valid: false, errors: ['No problem files found in ' + problemsDir] };
  }

  const allErrors = [];
  const slugs = new Map();
  const ids = new Map();
  const cloneFingerprints = new Map();

  for (const filePath of files) {
    const result = validateProblemFile(filePath);
    if (!result.valid) {
      allErrors.push(`Errors in ${filePath}:\n  - ` + result.errors.join('\n  - '));
    } else {
      const { doc } = result;
      // Slug uniqueness
      if (slugs.has(doc.slug)) {
        allErrors.push(`Duplicate slug '${doc.slug}' found in ${filePath} and ${slugs.get(doc.slug)}`);
      } else {
        slugs.set(doc.slug, filePath);
      }
      // ID uniqueness
      if (ids.has(doc.id)) {
        allErrors.push(`Duplicate id '${doc.id}' found in ${filePath} and ${ids.get(doc.id)}`);
      } else {
        ids.set(doc.id, filePath);
      }
      // Exact-clone gate: normalized (datasets + solutionSql) must be unique
      if (doc.datasets || doc.solutionSql) {
        const fp = normalizeForCloneCheck(doc);
        if (cloneFingerprints.has(fp)) {
          allErrors.push(`Exact-clone detected: ${filePath} is identical to ${cloneFingerprints.get(fp)} (same datasets + solutionSql)`);
        } else {
          cloneFingerprints.set(fp, filePath);
        }
      }
    }
  }

  return {
    valid: allErrors.length === 0,
    errors: allErrors,
    fileCount: files.length
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(__filename)) {
  const result = validateProblemsDir();
  if (!result.valid) {
    console.error('\u274c Problem validation failed:');
    for (const err of result.errors) {
      console.error(' ', err);
    }
    process.exit(1);
  }
  console.log(`\u2705 Successfully validated ${result.fileCount} problem file(s).`);
}
