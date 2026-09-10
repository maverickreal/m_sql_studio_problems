#!/usr/bin/env python3
import yaml
with open('problems/advanced-joins/employees-longest-hire-streak.yaml') as f:
    doc = yaml.safe_load(f)
print('initSql length:', len(doc.get('initSql', '')))
print('First 100 chars:', repr(doc.get('initSql', '')[:100]))
