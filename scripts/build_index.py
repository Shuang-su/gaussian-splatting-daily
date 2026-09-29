#!/usr/bin/env python3
from __future__ import annotations

import json
import re
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DAILY_ROOT = ROOT / "docs" / "daily"
OUTPUT = ROOT / "data" / "daily-index.json"
FIELD_RE = re.compile(r"^([a-z_]+):\\s*(.*)$")


def unquote(value: str) -> str:
    value = value.strip()
    if value.startswith('"') and value.endswith('"'):
        try:
            return json.loads(value)
        except json.JSONDecodeError:
            return value[1:-1]
    return value


def frontmatter(path: Path) -> dict[str, str]:
    text = path.read_text("utf-8")
    if not text.startswith("---\\n"):
        return {}
    parts = text.split("---\\n", 2)
    if len(parts) < 3:
        return {}
    result: dict[str, str] = {}
    for line in parts[1].splitlines():
        match = FIELD_RE.match(line)
        if match:
            result[match.group(1)] = unquote(match.group(2))
    return result


def main() -> None:
    items = []
    for path in DAILY_ROOT.glob("[0-9][0-9][0-9][0-9]/*/*.md"):
        meta = frontmatter(path)
        if not meta.get("date"):
            continue
        try:
            source_count = int(meta.get("source_count", "0"))
        except ValueError:
            source_count = 0
        items.append(
            {
                "date": meta["date"],
                "title": meta.get("title", f"Gaussian Splatting Daily — {meta['date']}"),
                "status": meta.get("status", "unknown"),
                "source_count": source_count,
                "path": str(path.relative_to(ROOT)).replace("\\\\", "/"),
            }
        )

    items.sort(key=lambda item: item["date"], reverse=True)
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(
        json.dumps(
            {
                "schema_version": 1,
                "generated_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
                "items": items,
            },
            ensure_ascii=False,
            indent=2,
        )
        + "\\n",
        "utf-8",
    )
    print(f"indexed {len(items)} Daily file(s)")


if __name__ == "__main__":
    main()
