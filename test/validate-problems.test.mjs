import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { validateProblemsDir, validateProblemFile, listDatasetSlugs, checkDenyList } from '../scripts/validate-problems.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

test('all problems in problems/ directory pass validation', () => {
  const result = validateProblemsDir(path.join(ROOT_DIR, 'problems'));
  assert.equal(result.valid, true, `Validation failed:\n${result.errors.join('\n')}`);
  assert.ok(result.fileCount > 0, 'At least one problem file should be validated');
});

test('invalid fixture under scripts/fixtures/ fails validation', () => {
  const fixturePath = path.join(ROOT_DIR, 'scripts', 'fixtures', 'invalid-problem.yaml');
  const result = validateProblemFile(fixturePath);
  assert.equal(result.valid, false, 'Invalid fixture should fail validation');
  assert.ok(result.errors.length > 0, 'Invalid fixture should produce validation errors');
});

test('detects category and parent directory mismatch', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'prob-test-cat-'));
  const catDir = path.join(tmpDir, 'joins');
  fs.mkdirSync(catDir, { recursive: true });
  const testFile = path.join(catDir, 'prob.yaml');
  
  const yamlContent = `id: "0192f0a1-2b3c-7d8e-9f0a-1b2c3d4e5f6a"
slug: "test-slug"
title: "Test"
description: "Test description"
difficulty: easy
mode: read
category: wrong-category
datasets: []
sampleInput: ["t(a)"]
sampleOutput: "a\\n1"
initSql: "CREATE TABLE t (a INT);"
solutionSql: "SELECT a FROM t;"
validationSql: "SELECT 1;"
orderMatters: false
origin: first-party
author: "test"
license: "CC-BY-4.0"
schema_version: 1
`;
  fs.writeFileSync(testFile, yamlContent);

  const result = validateProblemFile(testFile);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some(e => e.includes("Category 'wrong-category' does not match directory name 'joins'")));

  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test('detects forbidden LeetCode fields', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'prob-test-lc-'));
  const catDir = path.join(tmpDir, 'joins');
  fs.mkdirSync(catDir, { recursive: true });
  const testFile = path.join(catDir, 'prob.yaml');
  
  const yamlContent = `id: "0192f0a1-2b3c-7d8e-9f0a-1b2c3d4e5f6a"
slug: "test-slug"
title: "Test"
description: "Test description"
difficulty: easy
mode: read
category: joins
datasets: []
sampleInput: ["t(a)"]
sampleOutput: "a\\n1"
initSql: "CREATE TABLE t (a INT);"
solutionSql: "SELECT a FROM t;"
validationSql: "SELECT 1;"
orderMatters: false
origin: first-party
author: "test"
license: "CC-BY-4.0"
schema_version: 1
hints:
  - "hint 1"
`;
  fs.writeFileSync(testFile, yamlContent);

  const result = validateProblemFile(testFile);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some(e => e.includes("Contains forbidden LeetCode field: 'hints'")));

  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test('detects missing dataset reference', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'prob-test-ds-'));
  const catDir = path.join(tmpDir, 'joins');
  fs.mkdirSync(catDir, { recursive: true });
  const testFile = path.join(catDir, 'prob.yaml');
  
  const yamlContent = `id: "0192f0a1-2b3c-7d8e-9f0a-1b2c3d4e5f6a"
slug: "test-slug"
title: "Test"
description: "Test description"
difficulty: easy
mode: read
category: joins
datasets:
  - nonexistent-dataset
sampleInput: ["t(a)"]
sampleOutput: "a\\n1"
initSql: "CREATE TABLE t (a INT);"
solutionSql: "SELECT a FROM t;"
validationSql: "SELECT 1;"
orderMatters: false
origin: first-party
author: "test"
license: "CC-BY-4.0"
schema_version: 1
`;
  fs.writeFileSync(testFile, yamlContent);

  const result = validateProblemFile(testFile);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some(e => e.includes("Dataset 'nonexistent-dataset' referenced but does not exist under datasets/")));

  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test('listDatasetSlugs returns valid dataset slugs', () => {
  const datasetsDir = path.join(ROOT_DIR, 'datasets');
  const slugs = listDatasetSlugs(datasetsDir);
  assert.ok(slugs.includes('hr'), 'hr dataset should exist');
});

test('checkDenyList detects COPY', () => {
  const violations = checkDenyList('COPY employees TO PROGRAM;', 'test');
  assert.ok(violations.some(v => v.includes("Deny-list hit: 'COPY'")));
});

test('checkDenyList detects GRANT', () => {
  const violations = checkDenyList('GRANT ALL ON employees TO public;', 'test');
  assert.ok(violations.some(v => v.includes("Deny-list hit: 'GRANT'")));
});

test('checkDenyList passes safe SQL', () => {
  const violations = checkDenyList('SELECT * FROM employees;', 'test');
  assert.equal(violations.length, 0);
});

test('accepts valid community problem with origin and contributor', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'prob-test-valid-'));
  const catDir = path.join(tmpDir, 'joins');
  fs.mkdirSync(catDir, { recursive: true });
  const testFile = path.join(catDir, 'prob.yaml');
  
  const yamlContent = `id: "0192f0a1-2b3c-7d8e-9f0a-1b2c3d4e5f6a"
slug: "test-slug"
title: "Test"
description: "Test description"
difficulty: easy
mode: read
category: joins
datasets: []
sampleInput: ["t(a)"]
sampleOutput: "a\\n1"
initSql: "CREATE TABLE t (a INT);"
solutionSql: "SELECT a FROM t;"
validationSql: "SELECT 1;"
orderMatters: false
origin: community
contributor: "contributorhandle"
author: "test"
license: "CC-BY-4.0"
schema_version: 1
`;
  fs.writeFileSync(testFile, yamlContent);

  const result = validateProblemFile(testFile);
  assert.equal(result.valid, true, `Validation failed:\n${result.errors.join('\n')}`);

  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test('detects deny-list hit in initSql', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'prob-test-deny-'));
  const catDir = path.join(tmpDir, 'joins');
  fs.mkdirSync(catDir, { recursive: true });
  const testFile = path.join(catDir, 'prob.yaml');
  
  const yamlContent = `id: "0192f0a1-2b3c-7d8e-9f0a-1b2c3d4e5f6a"
slug: "test-slug"
title: "Test"
description: "Test description"
difficulty: easy
mode: read
category: joins
datasets: []
sampleInput: ["t(a)"]
sampleOutput: "a\\n1"
initSql: "COPY employees TO PROGRAM;"
solutionSql: "SELECT a FROM t;"
validationSql: "SELECT 1;"
orderMatters: false
origin: first-party
author: "test"
license: "CC-BY-4.0"
schema_version: 1
`;
  fs.writeFileSync(testFile, yamlContent);

  const result = validateProblemFile(testFile);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some(e => e.includes("Deny-list hit")));

  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test('detects duplicate slug and id across problem files', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'prob-test-dup-'));
  const catDir = path.join(tmpDir, 'joins');
  fs.mkdirSync(catDir, { recursive: true });
  
  const yamlContent1 = `id: "0192f0a1-2b3c-7d8e-9f0a-1b2c3d4e5f6a"
slug: "same-slug"
title: "Test 1"
description: "Test description 1"
difficulty: easy
mode: read
category: joins
datasets: []
sampleInput: ["t(a)"]
sampleOutput: "a\\n1"
initSql: "CREATE TABLE t (a INT);"
solutionSql: "SELECT a FROM t;"
validationSql: "SELECT 1;"
orderMatters: false
origin: first-party
author: "test"
license: "CC-BY-4.0"
schema_version: 1
`;
  const yamlContent2 = `id: "0192f0a1-2b3c-7d8e-9f0a-1b2c3d4e5f6a"
slug: "same-slug"
title: "Test 2"
description: "Test description 2"
difficulty: easy
mode: read
category: joins
datasets: []
sampleInput: ["t(a)"]
sampleOutput: "a\\n1"
initSql: "CREATE TABLE t (a INT);"
solutionSql: "SELECT a FROM t;"
validationSql: "SELECT 1;"
orderMatters: false
origin: first-party
author: "test"
license: "CC-BY-4.0"
schema_version: 1
`;
  fs.writeFileSync(path.join(catDir, 'prob1.yaml'), yamlContent1);
  fs.writeFileSync(path.join(catDir, 'prob2.yaml'), yamlContent2);

  const result = validateProblemsDir(tmpDir);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some(e => e.includes("Duplicate slug 'same-slug'")));
  assert.ok(result.errors.some(e => e.includes("Duplicate id '0192f0a1-2b3c-7d8e-9f0a-1b2c3d4e5f6a'")));

  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test('detects exact-clone problems (same datasets + solutionSql)', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'prob-test-clone-'));
  const catDir = path.join(tmpDir, 'joins');
  fs.mkdirSync(catDir, { recursive: true });
  
  const yamlContent1 = `id: "0192f0a1-2b3c-7d8e-9f0a-1b2c3d4e5f6a"
slug: "clone-slug-1"
title: "Clone 1"
description: "Clone test 1"
difficulty: easy
mode: read
category: joins
datasets:
  - hr
sampleInput: ["t(a)"]
sampleOutput: "a\\n1"
initSql: "CREATE TABLE t (a INT);"
solutionSql: "SELECT a FROM t;"
validationSql: "SELECT 1;"
orderMatters: false
origin: first-party
author: "test"
license: "CC-BY-4.0"
schema_version: 1
`;
  const yamlContent2 = `id: "0192f0a1-2b3c-7d8e-9f0a-1b2c3d4e5f6b"
slug: "clone-slug-2"
title: "Clone 2"
description: "Clone test 2"
difficulty: easy
mode: read
category: joins
datasets:
  - hr
sampleInput: ["t(a)"]
sampleOutput: "a\\n1"
initSql: "CREATE TABLE t (a INT);"
solutionSql: "SELECT a FROM t;"
validationSql: "SELECT 1;"
orderMatters: false
origin: first-party
author: "test"
license: "CC-BY-4.0"
schema_version: 1
`;
  fs.writeFileSync(path.join(catDir, 'clone1.yaml'), yamlContent1);
  fs.writeFileSync(path.join(catDir, 'clone2.yaml'), yamlContent2);

  const result = validateProblemsDir(tmpDir);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some(e => e.includes("Exact-clone detected")));

  fs.rmSync(tmpDir, { recursive: true, force: true });
});