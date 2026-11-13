#!/usr/bin/env python3
"""Place the static export under its public prefix, preserving real 404s."""
from pathlib import Path
import shutil
from validate_daily import ROOT
out = ROOT / 'site/out'
if not (out / 'index.html').is_file() or not (out / '404.html').is_file():
    raise SystemExit('Build and verify the static export before staging')
stage = ROOT / '.codex-work/deploy/horizon-site'
if stage.exists():
    shutil.rmtree(stage)
shutil.copytree(out, stage / 'horizon')
print(stage)
