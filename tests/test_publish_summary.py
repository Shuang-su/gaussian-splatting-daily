import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))
from publish_summary import summary

REPORT = ROOT / "docs/daily/2026/10/2026-10-03.md"


class PublishSummaryTests(unittest.TestCase):
    def test_october_3_title_and_complete_introduction(self):
        lead, intro, rows = summary(REPORT.read_text("utf-8"))
        self.assertEqual(lead, "Gaussian-Splat-Lite v1.2.0")
        self.assertIn("SplatTransform #340/#341", intro)
        self.assertIn("今天没有 P0", intro)
        self.assertTrue(intro.endswith("在本窗口发布新的原生 GS SDK/标准。"))
        self.assertNotIn("今日最值得看", intro)
        self.assertEqual(len(rows), 5)
        self.assertIn(
            "[Gaussian-Splat-Lite v1.2.0](https://github.com/WilliamLiu-1997/Gaussian-Splat-Lite/releases/tag/v1.2.0)",
            rows[0],
        )

    def test_title_strips_multiple_links_before_truncation(self):
        text = "| **P1** | [**First**](https://example.com/" + "x" * 100 + ") + [`Second`](https://example.com/two) | MIT | Test |"
        self.assertEqual(summary(text)[0], "First + Second")

    def test_long_title_truncates_display_text(self):
        label = "研究" * 50
        text = f"| **P1** | [{label}](https://example.com) | MIT | Test |"
        self.assertEqual(summary(text)[0], label[:72])

    def test_escaped_table_pipe(self):
        text = r"| **P1** | [A \| B](https://example.com) | `MIT` | Works |"
        lead, _, rows = summary(text)
        self.assertEqual(lead, "A | B")
        self.assertIn(" — MIT；Works", rows[0])

    def test_generated_overview_and_paper_fallback(self):
        text = "# 今日概览\n\nMerged #340.\n\nSecond paragraph.\n\n## 论文与研究\n\n### [**Paper**](https://arxiv.org/abs/1234.12345)\n"
        lead, intro, rows = summary(text)
        self.assertEqual(lead, "Paper")
        self.assertEqual(intro, "Merged #340.\n\nSecond paragraph.")
        self.assertEqual(rows, ["- [**Paper**](https://arxiv.org/abs/1234.12345)"])

    def test_empty_report(self):
        self.assertEqual(summary(""), ("无新增研究条目", "", []))

    def test_cli_issue_and_pr_artifacts(self):
        with tempfile.TemporaryDirectory() as folder:
            subprocess.run(
                [sys.executable, str(ROOT / "scripts/publish_summary.py"),
                 "--date", "2026-10-03", "--output-dir", folder, "--issue-number", "40"],
                check=True,
            )
            output = Path(folder)
            self.assertEqual((output / "issue-title.txt").read_text(), "[Daily] 2026-10-03｜Gaussian-Splat-Lite v1.2.0\n")
            self.assertEqual((output / "pr-title.txt").read_text(), "docs(daily): 2026-10-03 — Gaussian-Splat-Lite v1.2.0\n")
            body = (output / "issue-body.md").read_text()
            self.assertIn("SplatTransform #340/#341", body)
            self.assertNotIn("Closes #40", body)
            self.assertEqual((output / "pr-body.md").read_text(), body + "\nCloses #40\n")


if __name__ == "__main__":
    unittest.main()
