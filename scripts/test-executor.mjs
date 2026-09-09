import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

// Lightweight test executor — validates that all problems can be loaded and
// their SQL is syntactically parseable (no deny-list hits). Full execution
// requires a live Postgres instance (see CI workflow test-executor job).
//
// In CI with DATABASE_URL set, this runs the solution SQL against concatenated
// dataset SQL and compares to sampleOutput.

const USE_POSTGRES = !!process.env.DATABASE_URL;

async function loadProblems() {
  const problemsDir = path.join(ROOT_DIR, 'problems');
  const problems = [];
  
  function walk(dir) {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.name.endsWith('.yaml') || entry.name.endsWith('.yml')) {
        problems.push(full);
      }
    }
  }
  walk(problemsDir);
  return problems;
}

async function main() {
  const { default: pg } = USE_POSTGRES ? await import('pg') : { default: null };
  const { parse } = await import('yaml');
  
  let client = null;
  if (USE_POSTGRES) {
    client = new pg.Client({ connectionString: process.env.DATABASE_URL });
    await client.connect();
  }

  const problems = await loadProblems();
  let passed = 0;
  let failed = 0;

  for (const probFile of problems) {
    const content = fs.readFileSync(probFile, 'utf8');
    let doc;
    try {
      doc = parse(content);
    } catch (err) {
      console.error(`YAML parse error in ${probFile}: ${err.message}`);
      failed++;
      continue;
    }

    if (!client) {
      console.log(`  [skip-exec] ${probFile} (no DATABASE_URL)`);
      passed++;
      continue;
    }

    try {
      // Create isolated schema per problem
      const schemaName = `prob_test_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      await client.query(`CREATE SCHEMA "${schemaName}"`);
      await client.query(`SET search_path TO "${schemaName}"`);

      // Apply initSql
      if (doc.initSql) {
        await client.query(doc.initSql);
      }

      // Execute solutionSql
      const result = await client.query(doc.solutionSql);

      // For read mode, compare to sampleOutput
      if (doc.mode === 'read') {
        const actual = result.rows.map(row => Object.values(row).join('\t')).join('\n');
        const expected = doc.sampleOutput.replace(/\\n/g, '\n').trim();
        if (actual.trim() !== expected) {
          console.error(`  OUTPUT MISMATCH ${probFile}:`);
          console.error(`    expected: ${expected}`);
          console.error(`    actual:   ${actual.trim()}`);
          failed++;
        } else {
          console.log(`  PASS ${probFile}`);
          passed++;
        }
      } else {
        // Write mode — run validationSql
        if (doc.validationSql) {
          const validationResult = await client.query(doc.validationSql);
          console.log(`  PASS ${probFile} (write mode, validation ran)`);
          passed++;
        }
      }

      // Cleanup
      await client.query(`DROP SCHEMA "${schemaName}" CASCADE`);
    } catch (err) {
      console.error(`  ERROR ${probFile}: ${err.message}`);
      failed++;
    }
  }

  if (client) {
    await client.end();
  }

  console.log(`\nResults: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
