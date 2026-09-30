#!/usr/bin/env python3
"""Keep metadata-only arXiv ingests from being auto-merged as full dailies."""

from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

from validate_daily import DAILY_ROOT, ARXIV_RE, parse_frontmatter

HEADINGS = re.compile(r"^## (\d{1,2})\. .+$", re.MULTILINE)
SUMMARY = re.compile(r"\*\*编辑摘要：\*\*\s*(.+)")
PLACEHOLDERS = (
    "未启用或未成功完成 AI 编辑增强",
    "请以原始 arXiv 记录为准",
)


def check(text: str) -> list[str]:
    errors: list[str] = []
    meta = parse_frontmatter(text)
    if meta.get("status") not in {"published", "corrected"}:
        errors.append("report has not been marked published/corrected")

    headings = [int(value) for value in HEADINGS.findall(text)]
    if headings != list(range(1, 14)):
        errors.append("report needs substantive, ordered sections 1–13")
    sections = HEADINGS.split(text)
    for i in range(1, len(sections), 2):
        number = int(sections[i])
        # This deliberately measures content, not just a section title.
        content = re.sub(r"\s+", "", sections[i + 1])
        if len(content) < 60:
            errors.append(f"section {number} is incomplete")

    for phrase in PLACEHOLDERS:
        if phrase in text:
            errors.append(f"editorial placeholder remains: {phrase}")

    for match in ARXIV_RE.finditer(text):
        until = HEADINGS.search(text, match.end())
        next_paper = ARXIV_RE.search(text, match.end(), until.start() if until else len(text))
        block_end = min(
            [position for position in (until.start() if until else None,
                                       next_paper.start() if next_paper else None)
             if position is not None],
            default=len(text),
        )
        summary = SUMMARY.search(text, match.end(), block_end)
        if not summary or len(summary.group(1).strip()) < 30:
            errors.append(f"arXiv {match.group(1)} needs a specific editorial summary")
    return errors


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--date", required=True)
    args = parser.parse_args()
    path: Path = DAILY_ROOT / args.date[:4] / args.date[5:7] / f"{args.date}.md"
    errors = check(path.read_text("utf-8")) if path.exists() else [f"missing {path}"]
    if errors:
        for error in errors:
            print(f"EDITORIAL INCOMPLETE: {error}", file=sys.stderr)
        raise SystemExit(1)
    print(f"13-section editorial gate passed: {args.date}")


if __name__ == "__main__":
    main()
