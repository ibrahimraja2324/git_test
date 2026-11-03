#!/usr/bin/env python3
"""Fail CI if frontend/build code includes an obvious billable cloud inference endpoint.

This is a guardrail, not a substitute for reviewing network use, new dependencies or proxy changes.
"""
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
SUSPECT=('api.openai.com','generativelanguage.googleapis.com','api.anthropic.com','api.mistral.ai','openrouter.ai/api','GEMINI_API_KEY','OPENAI_API_KEY','ANTHROPIC_API_KEY')
FILES=[*ROOT.glob('src/*.js'),*ROOT.glob('scripts/*.py')]
violations=[]
for f in FILES:
    if f.name=='check_no_paid_ai.py':
        continue
    for token in SUSPECT:
        if token.lower() in f.read_text(encoding='utf-8').lower():
            violations.append(f'{f.relative_to(ROOT)}: {token}')
if violations:
    raise SystemExit('Unapproved cloud AI entrypoint:\n'+'\n'.join(violations))
print(f'No embedded billable AI endpoint or cloud keys in {len(FILES)-1} code files.')
