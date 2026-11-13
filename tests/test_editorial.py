import re
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))
from check_editorial import check

REPORT = (ROOT / "docs/daily/2026/10/2026-10-03.md").read_text("utf-8")


class EditorialTests(unittest.TestCase):
    def test_corrected_report_passes_strict_gate(self):
        self.assertEqual(REPORT.count("**编辑摘要：**"), 10)
        self.assertEqual(check(REPORT), [])

    def test_unlabelled_summaries_are_still_rejected(self):
        errors = check(REPORT.replace("**编辑摘要：** ", ""))
        self.assertEqual(len(errors), 10)
        self.assertTrue(all("needs a specific editorial summary" in error for error in errors))

    def test_short_summary_is_still_rejected(self):
        short = re.sub(r"\*\*编辑摘要：\*\*[^\n]+", "**编辑摘要：** Too short.", REPORT, count=1)
        self.assertIn("arXiv 2610.00749 needs a specific editorial summary", check(short))

    def test_placeholder_is_still_rejected(self):
        self.assertTrue(any("placeholder" in error for error in check(REPORT + "\n未启用或未成功完成 AI 编辑增强")))

    def test_draft_status_is_still_rejected(self):
        self.assertIn("report has not been marked published/corrected", check(REPORT.replace('status: "corrected"', 'status: "draft"')))

    def test_missing_section_is_still_rejected(self):
        self.assertIn("report needs substantive, ordered sections 1–13", check(REPORT.replace("## 13.", "## Missing.")))


if __name__ == "__main__":
    unittest.main()
