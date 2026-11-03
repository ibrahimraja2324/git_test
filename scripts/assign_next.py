#!/usr/bin/env python3
"""Generate a real next-task brief from the repository backlog; don't claim completion."""
import json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
tasks=json.loads((ROOT/'ops/backlog.json').read_text())
done={t['id'] for t in tasks if t['status']=='done'}
ready=[t for t in tasks if t['status']=='todo' and all(d in done for d in t['dependencies'])]
ready.sort(key=lambda t:(t['priority'],t['id']))
out=ROOT/'ops/next-task.md'
if ready:
 t=ready[0]
 out.write_text(f"# Next actionable task: {t['id']} — {t['title']}\n\nPriority: P{t['priority']} · Owner: {t['owner']} · Phase: {t['phase']}\n\nAcceptance: {t['acceptance']}\n\nEvidence: {t['evidence']}\n\nDo not mark done until tests and release evidence actually exist.\n",encoding='utf-8')
 print(t['id'],t['title'])
else:
 out.write_text('No unblocked todo tasks. Check dependencies and research a new substantial slice.\n',encoding='utf-8')
