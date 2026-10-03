"""Run the workflow's actual shell against local Git repos and a recording gh stub."""

import json
import os
import shutil
import subprocess
import sys
import tempfile
import textwrap
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
WORKFLOW = (ROOT / ".github/workflows/daily-ingest.yml").read_text()
DATE = "2026-10-03"
BRANCH = f"automation/daily/{DATE}"
DAILY = Path(f"docs/daily/2026/10/{DATE}.md")


def step(name):
    # These three steps use literal run blocks. Read production commands rather
    # than duplicating their logic in the regression fixture.
    return WORKFLOW.split(f"      - name: {name}\n", 1)[1].split("      - name:", 1)[0]


class DailyWorkflowTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.repo = self.root / "checkout"
        self.remote = self.root / "remote.git"
        self.repo.mkdir()
        self.bin = self.root / "bin"
        self.bin.mkdir()
        (self.bin / "python").symlink_to(sys.executable)
        self.calls = self.root / "gh-calls.jsonl"
        self.output = self.root / "github-output"
        self.env = dict(os.environ, PATH=f"{self.bin}{os.pathsep}{os.environ['PATH']}",
                        DATE=DATE, BRANCH=BRANCH, GITHUB_REPOSITORY="example/daily",
                        GITHUB_OUTPUT=str(self.output), GH_CALLS=str(self.calls),
                        GH_EXISTING="", GIT_CONFIG_GLOBAL=os.devnull, GIT_CONFIG_NOSYSTEM="1")
        # No credentials or external Git remotes are used by this harness.
        gh = self.bin / "gh"
        gh.write_text("#!/usr/bin/env python\n" + textwrap.dedent("""\
            import json, os, sys
            from pathlib import Path
            args = sys.argv[1:]
            with Path(os.environ['GH_CALLS']).open('a') as log:
                log.write(json.dumps(args) + '\\n')
            if args[:2] == ['issue', 'list'] and os.environ.get('GH_EXISTING'):
                print('40')
            elif args[:2] == ['pr', 'list'] and os.environ.get('GH_EXISTING'):
                print('41')
            elif args[:2] == ['issue', 'create']:
                print('https://github.com/example/daily/issues/40')
            elif args[:2] == ['pr', 'create']:
                print('https://github.com/example/daily/pull/41')
            elif args[:2] not in (['issue', 'list'], ['pr', 'list'], ['issue', 'edit'], ['pr', 'edit'], ['pr', 'merge']):
                raise SystemExit('unexpected gh command: ' + repr(args))
            """))
        gh.chmod(0o755)
        self.git("init", "--bare", str(self.remote))
        self.git("init", "--initial-branch=main")
        self.git("config", "user.name", "Workflow test")
        self.git("config", "user.email", "workflow-test@example.invalid")
        shutil.copytree(ROOT / "scripts", self.repo / "scripts", ignore=shutil.ignore_patterns("__pycache__"))
        self.write(DAILY, (ROOT / DAILY).read_text())
        self.write("data/daily-index.json", "{}\n")
        self.write("state/checkpoint.json", "{}\n")
        self.commit("baseline")
        self.git("remote", "add", "origin", str(self.remote))
        self.git("push", "origin", "main")
        self.prepare()

    def git(self, *args, check=True):
        return subprocess.run(["git", *args], cwd=self.repo, env=self.env,
                              text=True, capture_output=True, check=check)

    def write(self, path, value):
        target = self.repo / path
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(value)

    def commit(self, message):
        self.git("add", ".")
        self.git("commit", "-m", message)

    def run_step(self, name):
        script = textwrap.dedent(step(name).split("        run: |\n", 1)[1])
        # Give each test its own artifact directory instead of the runner's /tmp.
        script = script.replace("/tmp/daily-summary", str(self.root / "summary"))
        return subprocess.run(["bash", "--noprofile", "--norc", "-eo", "pipefail", "-c", script],
                              cwd=self.repo, env=self.env, text=True, capture_output=True)

    def prepare(self):
        result = self.run_step("Prepare deterministic automation branch")
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)

    def publish(self, expect_success=True):
        self.output.write_text("")
        result = self.run_step("Commit and push Daily branch")
        if expect_success:
            self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        outputs = dict(line.split("=", 1) for line in self.output.read_text().splitlines())
        # Honor the production Actions condition, and fail if it is removed.
        publish_step = step("Create, record, and merge Daily PR")
        self.assertIn("        if: steps.commit.outputs.publishable == 'true'\n", publish_step)
        if result.returncode == 0 and outputs.get("publishable") == "true":
            result = self.run_step("Create, record, and merge Daily PR")
            self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        return result, outputs

    def commands(self):
        return [json.loads(line)[:2] for line in self.calls.read_text().splitlines()] if self.calls.exists() else []

    def remote_head(self):
        return self.git("ls-remote", "origin", f"refs/heads/{BRANCH}").stdout

    def assert_no_publication(self):
        before = self.remote_head()
        _, outputs = self.publish()
        self.assertEqual(outputs["publishable"], "false")
        self.assertEqual(self.remote_head(), before, "no-op must not push branch history")
        self.assertEqual(self.commands(), [], "no-op must not read or write Issues/PRs")

    def test_unchanged_main_does_not_publish(self):
        self.assert_no_publication()

    def test_squash_merged_branch_with_ahead_commits_does_not_publish(self):
        self.write("docs/new.md", "Daily content\n")
        self.commit("daily content")
        self.git("push", "origin", BRANCH)
        self.git("switch", "main")
        self.git("merge", "--squash", BRANCH)
        self.git("commit", "-m", "squash daily")
        self.git("push", "origin", "main")
        self.prepare()
        self.assertGreater(int(self.git("rev-list", "--count", "origin/main..HEAD").stdout), 0)
        self.assertEqual(self.git("diff", "origin/main", "HEAD", "--", "docs", "data", "state").stdout, "")
        self.assert_no_publication()
        self.assert_no_publication()

    def test_new_content_is_committed_pushed_and_published(self):
        self.write("docs/new.md", "New content\n")
        _, outputs = self.publish()
        self.assertEqual(outputs, {"changed": "true", "publishable": "true"})
        self.assertIn(self.git("rev-parse", "HEAD").stdout.strip(), self.remote_head())
        self.assertIn(["issue", "create"], self.commands())
        self.assertIn(["pr", "create"], self.commands())
        self.assertIn(["pr", "merge"], self.commands())

    def test_retry_of_pending_content_survives_unchanged_worktree(self):
        self.write("docs/new.md", "Pending content\n")
        self.commit("pending daily")
        self.git("push", "origin", BRANCH)
        _, outputs = self.publish()
        self.assertEqual(outputs, {"changed": "false", "publishable": "true"})
        self.assertIn(["pr", "create"], self.commands())

    def test_pending_content_updates_existing_issue_and_pr(self):
        self.env["GH_EXISTING"] = "1"
        self.write("docs/new.md", "Pending content\n")
        self.publish()
        self.assertIn(["issue", "edit"], self.commands())
        self.assertIn(["pr", "edit"], self.commands())
        self.assertNotIn(["issue", "create"], self.commands())
        self.assertNotIn(["pr", "create"], self.commands())

    def test_code_only_ahead_commit_does_not_publish(self):
        self.write("scripts/unrelated.py", "# code-only change\n")
        self.commit("code only")
        self.assert_no_publication()

    def test_reverting_pending_content_to_main_does_not_publish(self):
        self.write("docs/pending.md", "Pending content\n")
        self.commit("pending content")
        (self.repo / "docs/pending.md").unlink()
        self.assert_no_publication()

    def test_data_and_state_changes_are_publishable(self):
        for path in ("data/daily-index.json", "state/checkpoint.json"):
            with self.subTest(path=path):
                self.git("reset", "--hard", "origin/main")
                self.write(path, '{"changed": true}\n')
                _, outputs = self.publish()
                self.assertEqual(outputs["publishable"], "true")
                # Keep this local-only remote at the same base for the next case.
                self.git("push", "origin", "--delete", BRANCH)

    def test_deleted_content_is_publishable(self):
        (self.repo / "state/checkpoint.json").unlink()
        _, outputs = self.publish()
        self.assertEqual(outputs["publishable"], "true")

    def test_bad_base_ref_fails_without_publishing(self):
        self.git("update-ref", "-d", "refs/remotes/origin/main")
        result, outputs = self.publish(expect_success=False)
        self.assertNotEqual(result.returncode, 0)
        self.assertNotEqual(outputs.get("publishable"), "true")
        self.assertEqual(self.commands(), [])
        self.assertEqual(self.remote_head(), "")

    def test_failed_push_does_not_write_issue_or_pr(self):
        hook = self.remote / "hooks/pre-receive"
        hook.write_text("#!/bin/sh\nexit 1\n")
        hook.chmod(0o755)
        self.write("docs/new.md", "New content\n")
        result, outputs = self.publish(expect_success=False)
        self.assertNotEqual(result.returncode, 0)
        self.assertNotEqual(outputs.get("publishable"), "true")
        self.assertEqual(self.commands(), [])

    def test_incomplete_editorial_cannot_merge(self):
        self.write(DAILY, (ROOT / DAILY).read_text().replace("**编辑摘要：** ", ""))
        result, outputs = self.publish()
        self.assertEqual(outputs["publishable"], "true")
        self.assertIn(["pr", "create"], self.commands())
        self.assertNotIn(["pr", "merge"], self.commands())
        self.assertIn("EDITORIAL INCOMPLETE", result.stderr)


if __name__ == "__main__":
    unittest.main()
