#!/usr/bin/env node
/**
 * generate-sandbox-gold-diff.mjs
 * Generates gold diffs for all problems in m_sql_studio_problems.
 * Handles dataset references by loading schema.sql + seed.sql from datasets/<slug>/
 * Suppresses psql notices for clean output.
 *
 * Usage: DATABASE_URL=postgresql://user:pass@host:5432/db node scripts/generate-sandbox-gold-diff.mjs [problems_dir] [output_dir]
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';
import os from 'node:os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const PROBLEMS_DIR = process.argv[2] || path.join(ROOT_DIR, 'problems');
const OUTPUT_DIR = process.argv[3] || path.join(ROOT_DIR, 'gold');
const DATASETS_DIR = path.join(ROOT_DIR, 'datasets');
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('ERROR: DATABASE_URL env var required');
  process.exit(1);
}

function buildPsqlArgs() {
  const url = new URL(DATABASE_URL);
  return {
    host: url.hostname,
    port: url.port || '5432',
    user: url.username,
    password: decodeURIComponent(url.password || ''),
    db: url.pathname.slice(1)
  };
}

function findProblemFiles(dir) {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results = results.concat(findProblemFiles(full));
    } else if (entry.name.endsWith('.yaml') || entry.name.endsWith('.yml')) {
      results.push(full);
    }
  }
  return results;
}

function loadDatasetSql(slug) {
  const dsDir = path.join(DATASETS_DIR, slug);
  if (!fs.existsSync(dsDir)) return '';
  
  let sql = '';
  const schemaPath = path.join(dsDir, 'schema.sql');
  const seedPath = path.join(dsDir, 'seed.sql');
  
  if (fs.existsSync(schemaPath)) {
    sql += fs.readFileSync(schemaPath, 'utf8') + '\n';
  }
  if (fs.existsSync(seedPath)) {
    sql += fs.readFileSync(seedPath, 'utf8') + '\n';
  }
  return sql;
}

async function main() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const args = buildPsqlArgs();
  const env = { ...process.env, PGPASSWORD: args.password };

  // Test connection
  try {
    execSync(`psql -h ${args.host} -p ${args.port} -U ${args.user} -d ${args.db} -c "SELECT 1"`, { env, stdio: 'pipe' });
    console.log(`Connected to ${args.host}:${args.port}/${args.db}`);
  } catch (err) {
    console.error('Connection failed:', err.message);
    process.exit(1);
  }

  const problems = findProblemFiles(PROBLEMS_DIR);
  let passed = 0;
  let failed = 0;
  let skipped = 0;

  const results = [];

  for (const probFile of problems) {
    const relPath = path.relative(PROBLEMS_DIR, probFile);
    const category = path.dirname(relPath);
    const slug = path.basename(probFile, '.yaml');
    const goldFile = path.join(OUTPUT_DIR, `${category}__${slug}.gold`);

    let content;
    try {
      content = fs.readFileSync(probFile, 'utf8');
    } catch (err) {
      console.error(`  READ ERROR ${relPath}: ${err.message}`);
      failed++;
      continue;
    }

    let doc;
    try {
      const { parse } = await import('yaml');
      doc = parse(content);
    } catch (err) {
      console.error(`  YAML ERROR ${relPath}: ${err.message}`);
      failed++;
      continue;
    }

    if (!doc.solutionSql || !doc.solutionSql.trim()) {
      console.log(`  SKIP ${relPath} (no solutionSql)`);
      skipped++;
      continue;
    }

    const schemaName = `gold_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    try {
      // Build full SQL: datasets + initSql + solutionSql
      let fullInitSql = '';
      if (doc.datasets && Array.isArray(doc.datasets) && doc.datasets.length > 0) {
        for (const dsSlug of doc.datasets) {
          fullInitSql += loadDatasetSql(dsSlug) + '\n';
        }
        if (doc.overlaySql) fullInitSql += doc.overlaySql + '\n';
      } else if (doc.initSql) {
        fullInitSql = doc.initSql + '\n';
      }
      
      const sqlContent = `
SET client_min_messages TO WARNING;
DROP SCHEMA IF EXISTS "${schemaName}" CASCADE;
CREATE SCHEMA "${schemaName}";
SET search_path TO "${schemaName}";
${fullInitSql}
${doc.solutionSql};
`;
      const tmpFile = path.join(os.tmpdir(), `gold_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.sql`);
      fs.writeFileSync(tmpFile, sqlContent);

      const output = execSync(
        `psql -h ${args.host} -p ${args.port} -U ${args.user} -d ${args.db} -v ON_ERROR_STOP=1 -f ${tmpFile} -t -A -F "\t" 2>&1`,
        { env, encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 }
      );

      fs.unlinkSync(tmpFile);

      // Filter out NOTICE and empty lines
      const lines = output.trim().split('\n').filter(l => 
        l.trim() && 
        !l.startsWith('NOTICE:') && 
        !l.startsWith('DROP SCHEMA') &&
        !l.startsWith('CREATE SCHEMA') &&
        !l.startsWith('SET') &&
        !l.startsWith('CREATE TABLE') &&
        !l.match(/^INSERT \d+ \d+$/)
      );
      
      const cleanOutput = lines.join('\n') + (lines.length > 0 ? '\n' : '');

      fs.writeFileSync(goldFile, cleanOutput);

      console.log(`  PASS ${relPath} (${lines.length} lines)`);
      passed++;
      results.push({ slug, category, lines: lines.length, file: goldFile });

    } catch (err) {
      const errorMsg = err.message.split('\n').filter(l => l.trim() && !l.startsWith('NOTICE:')).join('; ');
      console.error(`  FAIL ${relPath}: ${errorMsg}`);
      failed++;
      results.push({ slug, category, error: errorMsg });
    }
  }

  // Write manifest
  const manifest = {
    generatedAt: new Date().toISOString(),
    total: problems.length,
    passed,
    failed,
    skipped,
    results
  };
  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'manifest.json'),
    JSON.stringify(manifest, null, 2)
  );

  console.log('\n========================================');
  console.log(`Gold generation complete`);
  console.log(`Total: ${problems.length}  Passed: ${passed}  Failed: ${failed}  Skipped: ${skipped}`);
  console.log(`Output: ${OUTPUT_DIR}/`);

  if (failed > 0) {
    process.exit(1);
  }
}

main().catch(err => {
  console.error('FATAL:', err);
  process.exit(1);
});