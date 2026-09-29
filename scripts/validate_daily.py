#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DAILY_ROOT = ROOT / "docs" / "daily"
ARXIV_RE = re.compile(r"<!--\s*arxiv:([^\s>]+)\s*-->")
FIELD_RE = re.compile(r"^([a-z_]+):\s*(.*)$")
REQUIRED = {
    "schema_version",
    "id",
    "date",
    "timezone",
    "generated_at",
    "status",
    "title",
    "source_count",
    "ai_enrichment",
    "ai_model",
}


def unquote(value: str) -> str:
    value = value.strip()
    if value.startswith('"') and value.endswith('"'):
        try:
            return json.loads(value)
        except json.JSONDecodeError:
            return value[1:-1]
    return value


def parse_frontmatter(text: str) -> dict[str, str]:
    if not text.startswith("---\n"):
        return {}
    parts = text.split("---\n", 2)
    if len(parts) < 3:
        return {}
    result: dict[str, str] = {}
    for line in parts[1].splitlines():
        match = FIELD_RE.match(line)
        if match:
            result[match.group(1)] = unquote(match.group(2))
    return result


def validate_file(path: Path) -> list[str]:
    errors: list[str] = []
    text = path.read_text("utf-8")
    meta = parse_frontmatter(text)

    missing = sorted(REQUIRED - set(meta))
    if missing:
        errors.append(f"{path}: missing frontmatter fields: {', '.join(missing)}")
        return errors

    logical_date = meta["date"]
    expected_suffix = f"/{logical_date[:4]}/{logical_date[5:7]}/{logical_date}.md"
    normalized = "/" + str(path.relative_to(DAILY_ROOT)).replace("\\", "/")
    if not normalized.endswith(expected_suffix):
        errors.append(f"{path}: path does not match frontmatter date {logical_date}")

    if meta["id"] != f"gsd-{logical_date}":
        errors.append(f"{path}: id must be gsd-{logical_date}")
    if meta["timezone"] != "Asia/Tokyo":
        errors.append(f"{path}: timezone must be Asia/Tokyo")
    if meta["schema_version"] != "1":
        errors.append(f"{path}: schema_version must be 1")

    markers = ARXIV_RE.findall(text)
    if len(markers) != len(set(markers)):
        errors.append(f"{path}: duplicate arXiv markers inside file")

    try:
        source_count = int(meta["source_count"])
    except ValueError:
        errors.append(f"{path}: source_count must be an integer")
    else:
        if source_count != len(markers):
            errors.append(
                f"{path}: source_count={source_count}, but found {len(markers)} arXiv marker(s)"
            )

    for heading in ("# 今日概览", "## 论文与研究", "## 自动化说明"):
        if heading not in text:
            errors.append(f"{path}: missing section {heading}")

    return errors


def daily_files() -> list[Path]:
    return sorted(DAILY_ROOT.glob("[0-9][0-9][0-9][0-9]/*/*.md"))


def validate_global_duplicates(paths: list[Path]) -> list[str]:
    owners: dict[str, Path] = {}
    errors: list[str] = []
    for path in paths:
        for arxiv_id in ARXIV_RE.findall(path.read_text("utf-8")):
            previous = owners.get(arxiv_id)
            if previous and previous != path:
                errors.append(
                    f"arXiv {arxiv_id} appears in both {previous.relative_to(ROOT)} and {path.relative_to(ROOT)}"
                )
            owners[arxiv_id] = path
    return errors


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--date")
    parser.add_argument("--all", action="store_true")
    args = parser.parse_args()

    if args.all:
        paths = daily_files()
    elif args.date:
        target = (
            DAILY_ROOT
            / args.date[:4]
            / args.date[5:7]
            / f"{args.date}.md"
        )
        paths = [target]
    else:
        parser.error("provide --date YYYY-MM-DD or --all")

    errors: list[str] = []
    for path in paths:
        if not path.exists():
            errors.append(f"missing Daily file: {path.relative_to(ROOT)}")
            continue
        errors.extend(validate_file(path))

    errors.extend(validate_global_duplicates(daily_files()))

    if errors:
        for error in errors:
            print(f"ERROR: {error}", file=sys.stderr)
        raise SystemExit(1)

    print(f"validated {len(paths)} Daily file(s)")


if __name__ == "__main__":
    main()
