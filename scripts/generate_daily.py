#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import os
import re
import time
import urllib.error
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from datetime import date, datetime, timedelta
from pathlib import Path
from zoneinfo import ZoneInfo

ROOT = Path(__file__).resolve().parents[1]
ATOM = {"a": "http://www.w3.org/2005/Atom"}
ARXIV_API = "https://export.arxiv.org/api/query"
QUERY = 'all:"gaussian splatting"'
USER_AGENT = "gaussian-splatting-daily/0.1 (https://github.com/Shuang-su/gaussian-splatting-daily)"
ARXIV_MARKER_RE = re.compile(r"<!--\\s*arxiv:([^\\s>]+)\\s*-->")
VERSION_RE = re.compile(r"v\\d+$")


def collapse(text: str | None) -> str:
    return " ".join((text or "").split())


def bare_arxiv_id(value: str) -> str:
    return VERSION_RE.sub("", value.rsplit("/", 1)[-1])


def http_get(url: str, attempts: int = 3) -> bytes:
    delay = 4
    last_error: Exception | None = None
    for attempt in range(attempts):
        req = urllib.request.Request(
            url,
            headers={
                "User-Agent": USER_AGENT,
                "Accept": "application/atom+xml, application/xml;q=0.9",
            },
        )
        try:
            with urllib.request.urlopen(req, timeout=45) as response:
                return response.read()
        except urllib.error.HTTPError as exc:
            last_error = exc
            if exc.code not in {429, 500, 502, 503, 504} or attempt == attempts - 1:
                raise
        except urllib.error.URLError as exc:
            last_error = exc
            if attempt == attempts - 1:
                raise
        time.sleep(delay)
        delay *= 2
    raise RuntimeError(f"request failed: {last_error}")


def fetch_arxiv(max_results: int = 100) -> list[dict]:
    params = urllib.parse.urlencode(
        {
            "search_query": QUERY,
            "start": 0,
            "max_results": max_results,
            "sortBy": "submittedDate",
            "sortOrder": "descending",
        }
    )
    payload = http_get(f"{ARXIV_API}?{params}")
    root = ET.fromstring(payload)
    items: list[dict] = []

    for entry in root.findall("a:entry", ATOM):
        raw_id = collapse(entry.findtext("a:id", default="", namespaces=ATOM))
        arxiv_id = bare_arxiv_id(raw_id)
        if not arxiv_id:
            continue

        authors = [
            collapse(author.findtext("a:name", default="", namespaces=ATOM))
            for author in entry.findall("a:author", ATOM)
        ]
        categories = [
            category.attrib.get("term", "")
            for category in entry.findall("a:category", ATOM)
            if category.attrib.get("term")
        ]
        items.append(
            {
                "arxiv_id": arxiv_id,
                "title": collapse(entry.findtext("a:title", default="", namespaces=ATOM)),
                "authors": [a for a in authors if a],
                "categories": categories,
                "published": collapse(entry.findtext("a:published", default="", namespaces=ATOM)),
                "updated": collapse(entry.findtext("a:updated", default="", namespaces=ATOM)),
                "abstract": collapse(entry.findtext("a:summary", default="", namespaces=ATOM)),
                "url": f"https://arxiv.org/abs/{arxiv_id}",
            }
        )
    return items


def seen_arxiv_ids(exclude: Path) -> set[str]:
    seen: set[str] = set()
    daily_root = ROOT / "docs" / "daily"
    if not daily_root.exists():
        return seen
    for path in daily_root.glob("[0-9][0-9][0-9][0-9]/*/*.md"):
        if path.resolve() == exclude.resolve():
            continue
        seen.update(ARXIV_MARKER_RE.findall(path.read_text("utf-8")))
    return seen


def select_items(items: list[dict], logical_date: date, seen: set[str], lookback_days: int, limit: int) -> list[dict]:
    earliest = logical_date - timedelta(days=lookback_days)
    selected: list[dict] = []
    for item in items:
        try:
            published_date = datetime.fromisoformat(item["published"].replace("Z", "+00:00")).date()
        except (TypeError, ValueError):
            continue
        if published_date > logical_date or published_date < earliest:
            continue
        if item["arxiv_id"] in seen:
            continue
        selected.append(item)
        if len(selected) >= limit:
            break
    return selected


def extract_output_text(response: dict) -> str:
    parts: list[str] = []
    for item in response.get("output", []):
        if item.get("type") != "message":
            continue
        for content in item.get("content", []):
            if content.get("type") == "output_text" and content.get("text"):
                parts.append(content["text"])
    return "\\n".join(parts).strip()


def ai_editorial(items: list[dict]) -> tuple[str, dict[str, str], str] | None:
    api_key = os.environ.get("OPENAI_API_KEY", "").strip()
    if not api_key or not items:
        return None

    model = os.environ.get("OPENAI_MODEL", "").strip() or "gpt-5.6-luna"
    compact_items = [
        {
            "arxiv_id": item["arxiv_id"],
            "title": item["title"],
            "authors": item["authors"],
            "categories": item["categories"],
            "published": item["published"],
            "abstract": item["abstract"],
        }
        for item in items
    ]
    prompt = (
        "你是 Gaussian Splatting Daily 的研究编辑。"
        "只允许使用下面提供的 arXiv 元数据和摘要，不要补充外部事实，不要猜 benchmark 数字、"
        "代码仓库、项目主页、会议录用情况或作者动机。"
        "返回 JSON，格式为 {overview: string, summaries: {arxiv_id: string}}。"
        "overview 不超过 180 个中文字符；每条 summary 不超过 220 个中文字符。"
        "summaries 只能使用给出的 arXiv ID 作为 key；区分作者声明与已验证事实；不要输出 Markdown。\\n\\n"
        + json.dumps(compact_items, ensure_ascii=False)
    )
    body = json.dumps(
        {
            "model": model,
            "input": prompt,
            "store": False,
            "reasoning": {"effort": "none"},
            "text": {"format": {"type": "json_object"}, "verbosity": "low"},
            "max_output_tokens": 3000,
        },
        ensure_ascii=False,
    ).encode("utf-8")
    req = urllib.request.Request(
        "https://api.openai.com/v1/responses",
        data=body,
        method="POST",
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "User-Agent": USER_AGENT,
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=120) as response:
            payload = json.loads(response.read().decode("utf-8"))
        parsed = json.loads(extract_output_text(payload))
        overview = str(parsed.get("overview", "")).strip()
        raw = parsed.get("summaries", {})
        allowed = {item["arxiv_id"] for item in items}
        summaries = {
            str(key): str(value).strip()
            for key, value in raw.items()
            if isinstance(key, str) and isinstance(value, str) and key in allowed
        }
        return overview, summaries, model
    except Exception as exc:
        print(f"warning: OpenAI enrichment failed; using deterministic fallback: {exc}")
        return None


def yaml_string(value: str) -> str:
    return json.dumps(value, ensure_ascii=False)


def render_daily(logical_date: date, items: list[dict]) -> str:
    generated_at = datetime.now(ZoneInfo("Asia/Tokyo")).isoformat(timespec="seconds")
    enrichment = ai_editorial(items)
    if enrichment:
        overview, summaries, model = enrichment
        ai_enabled = True
    else:
        overview = (
            f"本次自动化收录 {len(items)} 条此前未归档的 Gaussian Splatting 相关 arXiv 条目。"
            if items
            else "本次自动化运行成功，但在回看窗口内没有发现此前未归档的新条目。"
        )
        summaries = {}
        model = ""
        ai_enabled = False

    status = "draft" if items else "no-data"
    lines = [
        "---",
        "schema_version: 1",
        f"id: {yaml_string(f'gsd-{logical_date.isoformat()}')}",
        f"date: {yaml_string(logical_date.isoformat())}",
        'timezone: "Asia/Tokyo"',
        f"generated_at: {yaml_string(generated_at)}",
        f'status: "{status}"',
        f"title: {yaml_string(f'Gaussian Splatting Daily — {logical_date.isoformat()}')}",
        f"source_count: {len(items)}",
        f"ai_enrichment: {'true' if ai_enabled else 'false'}",
        f"ai_model: {yaml_string(model)}",
        "---",
        "",
        "# 今日概览",
        "",
        overview,
        "",
        "## 论文与研究",
        "",
    ]

    if not items:
        lines.extend(["今天没有新增条目。该文件仍然保留，以区分“没有新内容”和“自动化没有运行”。", ""])

    for item in items:
        arxiv_id = item["arxiv_id"]
        authors = ", ".join(item["authors"]) or "Unknown"
        categories = ", ".join(item["categories"]) or "Unknown"
        published = item["published"][:10] if item["published"] else "Unknown"
        lines.extend(
            [
                f"### [{item['title']}]({item['url']})",
                "",
                f"<!-- arxiv:{arxiv_id} -->",
                "",
                f"- **arXiv:** [{arxiv_id}]({item['url']})",
                f"- **Authors:** {authors}",
                f"- **Published:** {published}",
                f"- **Categories:** {categories}",
                "",
            ]
        )
        summary = summaries.get(arxiv_id)
        if summary:
            lines.extend([f"**编辑摘要：** {summary}", ""])
        else:
            lines.extend(["**编辑摘要：** 未启用或未成功完成 AI 编辑增强；请以原始 arXiv 记录为准。", ""])

    lines.extend(
        [
            "## 自动化说明",
            "",
            "- 逻辑日期：Asia/Tokyo。",
            "- 数据源：arXiv API；canonical ID、URL、作者和日期由程序写入。",
            "- AI（如启用）只基于本次提供的元数据/摘要生成编辑说明。",
            "- Thank you to arXiv for use of its open access interoperability.",
            "",
        ]
    )
    return "\\n".join(lines)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--date", help="Logical date YYYY-MM-DD")
    parser.add_argument("--lookback-days", type=int, default=7)
    parser.add_argument("--limit", type=int, default=12)
    args = parser.parse_args()

    tz = ZoneInfo("Asia/Tokyo")
    logical_date = date.fromisoformat(args.date) if args.date else datetime.now(tz).date()
    output = ROOT / "docs" / "daily" / f"{logical_date.year:04d}" / f"{logical_date.month:02d}" / f"{logical_date.isoformat()}.md"
    output.parent.mkdir(parents=True, exist_ok=True)

    candidates = fetch_arxiv()
    items = select_items(
        candidates,
        logical_date=logical_date,
        seen=seen_arxiv_ids(output),
        lookback_days=args.lookback_days,
        limit=args.limit,
    )
    output.write_text(render_daily(logical_date, items), "utf-8")
    print(f"generated {output.relative_to(ROOT)} with {len(items)} new item(s)")


if __name__ == "__main__":
    main()
