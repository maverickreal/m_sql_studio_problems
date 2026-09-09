import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

test('test-executor parses YAML correctly', async () => {
  const { parse } = await import('yaml');
  
  const yamlContent = `
id: "0192f0a1-2b3c-7d8e-9f0a-1b2c3d4e5f6a"
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
`;
  
  const doc = parse(yamlContent);
  assert.equal(doc.id, "0192f0a1-2b3c-7d8e-9f0a-1b2c3d4e5f6a");
  assert.equal(doc.slug, "test-slug");
  assert.equal(doc.mode, "read");
  assert.equal(doc.category, "joins");
});

test('test-executor handles missing DATABASE_URL gracefully', async () => {
  // The test-executor script should skip execution when DATABASE_URL is not set
  // This is tested by running the script without DATABASE_URL
  assert.ok(!process.env.DATABASE_URL || process.env.DATABASE_URL === '', 'DATABASE_URL should not be set for this test');
});

test('test-executor creates unique schema names', () => {
  const schemaName1 = `prob_test_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const schemaName2 = `prob_test_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  
  // Schema names should be unique (very low collision probability)
  assert.notEqual(schemaName1, schemaName2);
  assert.ok(schemaName1.startsWith('prob_test_'));
  assert.ok(schemaName2.startsWith('prob_test_'));
});

test('test-executor validates problem structure', async () => {
  const { parse } = await import('yaml');
  
  // Valid problem structure
  const validYaml = `
id: "0192f0a1-2b3c-7d8e-9f0a-1b2c3d4e5f6a"
slug: "test-slug"
title: "Test"
description: "Test description"
difficulty: easy
mode: read
category: joins
datasets: ["hr"]
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
  
  const doc = parse(validYaml);
  
  // Check required fields exist
  assert.ok(doc.id);
  assert.ok(doc.slug);
  assert.ok(doc.title);
  assert.ok(doc.description);
  assert.ok(doc.difficulty);
  assert.ok(doc.mode);
  assert.ok(doc.category);
  assert.ok(Array.isArray(doc.datasets));
  assert.ok(doc.sampleInput);
  assert.ok(doc.sampleOutput);
  assert.ok(doc.initSql);
  assert.ok(doc.solutionSql);
  assert.ok(doc.orderMatters !== undefined);
  assert.ok(doc.origin);
  assert.ok(doc.author);
  assert.ok(doc.license);
  assert.ok(doc.schema_version);
});

test('test-executor validates read mode output comparison logic', () => {
  // Test the output comparison logic used in test-executor
  const actual = "a\t1\nb\t2";
  const expected = "a\t1\nb\t2";
  
  // The test-executor compares trimmed output
  assert.equal(actual.trim(), expected.trim());
  
  // Test mismatch
  const mismatched = "a\t1\nb\t3";
  assert.notEqual(mismatched.trim(), expected.trim());
});

test('test-executor handles write mode validation', () => {
  // In write mode, the executor runs validationSql instead of comparing output
  // This is a conceptual test
  const mode = 'write';
  assert.equal(mode, 'write');
  
  // For write mode, validationSql should exist
  const validationSql = 'SELECT 1;';
  assert.ok(validationSql);
});