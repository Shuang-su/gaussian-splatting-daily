#!/usr/bin/env python3
"""Reuse a Daily branch without replaying a tip already squash-merged to main."""

import json
import os
import subprocess
import sys


def git(*args, check=True):
    return subprocess.run(["git", *args], text=True, capture_output=True, check=check)


def tip_was_merged(repository, branch, tip, base):
    # Paginate closed PRs: an older merge of this branch name is not evidence
    # that its current tip (possibly containing new work) has been published.
    response = subprocess.run(
        ["gh", "api", "--method", "GET", f"repos/{repository}/pulls",
         "-f", "state=closed", "-f", f"head={repository.split('/')[0]}:{branch}",
         "-f", "base=main", "-f", "per_page=100", "--paginate", "--slurp"],
        text=True, capture_output=True, check=True,
    )
    for page in json.loads(response.stdout):
        for pr in page:
            head, target = pr.get("head") or {}, pr.get("base") or {}
            merge = pr.get("merge_commit_sha")
            if (pr.get("merged_at") and head.get("sha") == tip
                    and head.get("ref") == branch
                    and (head.get("repo") or {}).get("full_name") == repository
                    and target.get("ref") == "main"
                    and (target.get("repo") or {}).get("full_name") == repository
                    and merge):
                if git("merge-base", "--is-ancestor", merge, base, check=False).returncode == 0:
                    return True
    return False


def main():
    branch, repository = os.environ["BRANCH"], os.environ["GITHUB_REPOSITORY"]
    git("fetch", "origin", "+refs/heads/main:refs/remotes/origin/main")
    base = git("rev-parse", "origin/main").stdout.strip()
    remote = git("ls-remote", "--exit-code", "--heads", "origin", f"refs/heads/{branch}", check=False)
    if remote.returncode == 2:
        git("switch", "-c", branch, base)
        print(f"Created {branch} from main {base}.")
        return
    remote.check_returncode()
    git("fetch", "origin", f"+refs/heads/{branch}:refs/remotes/origin/{branch}")
    tip = git("rev-parse", f"origin/{branch}").stdout.strip()
    if (git("merge-base", "--is-ancestor", tip, base, check=False).returncode == 0
            or tip_was_merged(repository, branch, tip, base)):
        # This only moves the local checkout. Never force-push the remote ref.
        git("switch", "-C", branch, base)
        print(f"Published tip {tip} is covered by main; reusing {branch} from {base}.")
        return
    git("switch", "-C", branch, tip)
    result = git("merge", "--no-edit", base, check=False)
    if result.returncode:
        git("merge", "--abort")
        print(result.stdout + result.stderr, file=sys.stderr)
        print("Automation branch conflicts with main; preserving unpublished tip.", file=sys.stderr)
        raise SystemExit(42)
    print(f"Preserved unpublished tip {tip} and merged main {base}.")


if __name__ == "__main__":
    try:
        main()
    except subprocess.CalledProcessError as exc:
        print(exc.stderr, file=sys.stderr)
        raise SystemExit(exc.returncode)
