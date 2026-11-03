#!/usr/bin/env python3
"""Create a deployable static artifact without npm or a build framework."""
from pathlib import Path
import shutil
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'dist'
if OUT.exists():shutil.rmtree(OUT)
OUT.mkdir();shutil.copy2(ROOT/'index.html',OUT/'index.html')
shutil.copytree(ROOT/'src',OUT/'src')
shutil.copytree(ROOT/'public'/'data',OUT/'data')
print('Static site ready in dist/; serve with python3 -m http.server 4173 --directory dist')
