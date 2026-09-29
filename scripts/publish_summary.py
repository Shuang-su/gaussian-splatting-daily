#!/usr/bin/env python3
"""Create content-first GitHub Issue and PR text for one Daily."""

from __future__ import annotations

import argparse
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def plain(value: str) -> str:
    return re.sub(r"\s+", " ", re.sub(r"[*`]", "", value.replace(r"\|", "|"))).strip()


def summary(text: str) -> tuple[str, str, list[str]]:
    body = text.split("---\n", 2)[-1]
    rows = []
    top_event = ""
    for line in body.splitlines():
        if line.startswith("|") and re.search(r"\*\*P[012]", line):
            cells = [plain(cell) for cell in re.split(r"(?<!\\)\|", line.strip("|"))]
            if len(cells) >= 4:
                if not top_event:
                    top_event = cells[1]
                rows.append(f"- **{cells[0]}** {cells[1]} — {cells[2]}；{cells[3]}")
        if len(rows) == 5:
            break

    papers = re.findall(r"^### \[([^]]+)\]\((https?://[^)]+)\)", body, re.M)
    if not rows:
        rows = [f"- [{title}]({url})" for title, url in papers[:5]]

    lead = top_event or (papers[0][0] if papers else "无新增研究条目")
    lead = lead[:72]

    if "# 今日概览" in body:
        intro = body.split("# 今日概览", 1)[1].split("## 论文与研究", 1)[0]
    else:
        match = re.search(r"^# 3DGS / 4DGS / Gaussian Splatting 深度情报日报[^\n]*\n\n([^#]+)", body, re.M)
        intro = match.group(1).split("\n\n", 1)[0] if match else ""
    intro = intro.strip()[:1100]
    return lead, intro, rows


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--date", required=True)
    parser.add_argument("--output-dir", required=True)
    parser.add_argument("--issue-number", type=int, default=0)
    args = parser.parse_args()
    path = ROOT / "docs" / "daily" / args.date[:4] / args.date[5:7] / f"{args.date}.md"
    lead, intro, rows = summary(path.read_text("utf-8"))
    output = Path(args.output_dir)
    output.mkdir(parents=True, exist_ok=True)
    title = f"[Daily] {args.date}｜{lead}"
    pr_title = f"docs(daily): {args.date} — {lead}"
    link = f"https://github.com/Shuang-su/gaussian-splatting-daily/blob/main/{path.relative_to(ROOT)}"
    body = (
        f"<!-- daily-key:{args.date} -->\n\n"
        f"## 今日判断\n\n{intro or '本轮已完成来源核查，详见完整日报。'}\n\n"
        f"## 今日重点\n\n" + ("\n".join(rows) if rows else "- 本轮没有新的可归档条目。")
        + f"\n\n[阅读完整日报]({link})。\n"
    )
    (output / "issue-title.txt").write_text(title + "\n", "utf-8")
    (output / "pr-title.txt").write_text(pr_title + "\n", "utf-8")
    (output / "issue-body.md").write_text(body, "utf-8")
    (output / "pr-body.md").write_text(
        body + (f"\nCloses #{args.issue_number}\n" if args.issue_number else ""), "utf-8"
    )


if __name__ == "__main__":
    main()
