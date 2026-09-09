import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import parseYaml from 'yaml';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const schemaPath = path.join(ROOT_DIR, 'schemas', 'problem-v1.json');
const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));

const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);
const validateSchema = ajv.compile(schema);

const FORBIDDEN_LEETCODE_FIELDS = ['test_cases', 'hints', 'statement'];

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

  return {
    valid: errors.length === 0,
    errors,
    doc
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
    console.error('❌ Problem validation failed:');
    for (const err of result.errors) {
      console.error(' ', err);
    }
    process.exit(1);
  }
  console.log(`✅ Successfully validated ${result.fileCount} problem file(s).`);
}
