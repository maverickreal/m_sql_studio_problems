#!/usr/bin/env python3
"""Gold-diff via docker exec postgres (peer/trust), no host password."""
from __future__ import annotations

import json
import subprocess
from pathlib import Path

import yaml

ROOT = Path("/Users/maverick/.hermes/profiles/swe/workspace/msql-studio/m_sql_studio_problems")
PROBLEMS = ROOT / "problems"
DATASETS = ROOT / "datasets"
GOLD = ROOT / "gold"
CONTAINER = "msql-studio-postgres-1"


def dataset_sql(slug: str) -> str:
    d = DATASETS / slug
    parts = []
    for name in ("schema.sql", "seed.sql"):
        p = d / name
        if p.exists():
            parts.append(p.read_text())
    return "\n".join(parts)


def problem_files() -> list[Path]:
    return sorted(PROBLEMS.rglob("*.yaml"))


def psql(sql: str) -> tuple[int, str]:
    r = subprocess.run(
        [
            "docker",
            "exec",
            "-i",
            CONTAINER,
            "psql",
            "-U",
            "postgres",
            "-d",
            "msql",
            "-v",
            "ON_ERROR_STOP=1",
            "-t",
            "-A",
            "-F",
            "\t",
        ],
        input=sql,
        text=True,
        capture_output=True,
    )
    out = (r.stdout or "") + (r.stderr or "")
    return r.returncode, out


def main() -> None:
    GOLD.mkdir(exist_ok=True)
    passed = failed = skipped = 0
    results = []
    files = problem_files()
    for i, path in enumerate(files, 1):
        rel = path.relative_to(PROBLEMS)
        doc = yaml.safe_load(path.read_text())
        if not doc or not str(doc.get("solutionSql") or "").strip():
            skipped += 1
            print(f"SKIP {rel}")
            continue
        ds = ""
        for slug in doc.get("datasets") or []:
            ds += dataset_sql(slug) + "\n"
        schema = f"gold_{i}"
        sql = f"""
SET client_min_messages TO WARNING;
DROP SCHEMA IF EXISTS "{schema}" CASCADE;
CREATE SCHEMA "{schema}";
SET search_path TO "{schema}";
{ds}
{doc.get("initSql") or ""}
{doc["solutionSql"]};
"""
        code, out = psql(sql)
        lines = [
            ln
            for ln in out.splitlines()
            if ln.strip()
            and not ln.startswith("NOTICE:")
            and not ln.startswith("DROP SCHEMA")
            and not ln.startswith("CREATE SCHEMA")
            and not ln.startswith("SET")
            and not ln.startswith("CREATE TABLE")
            and not ln.startswith("INSERT ")
        ]
        if code != 0:
            failed += 1
            err = "; ".join(lines)[:300]
            print(f"FAIL {rel}: {err}")
            results.append({"slug": path.stem, "error": err})
            continue
        gold_name = f"{rel.parent}__{path.stem}.gold"
        (GOLD / gold_name).write_text("\n".join(lines) + ("\n" if lines else ""))
        passed += 1
        print(f"PASS {rel} ({len(lines)} lines)")
        results.append({"slug": path.stem, "lines": len(lines)})
    manifest = {
        "total": len(files),
        "passed": passed,
        "failed": failed,
        "skipped": skipped,
        "results": results,
    }
    (GOLD / "manifest.json").write_text(json.dumps(manifest, indent=2))
    print(f"total={len(files)} passed={passed} failed={failed} skipped={skipped}")
    raise SystemExit(1 if failed else 0)


if __name__ == "__main__":
    main()
