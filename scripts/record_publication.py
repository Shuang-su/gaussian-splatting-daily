#!/usr/bin/env python3
"""Record publication only after main, deployment metadata and public HTML agree."""
from __future__ import annotations

import argparse
import base64
import copy
import hashlib
import json
import urllib.request
from datetime import date, datetime, timezone
from html.parser import HTMLParser

from validate_daily import ROOT, parse_frontmatter

REPO = 'Shuang-su/metaflow-horizon'
SITE = 'https://metaflow.shuang-su.com/horizon'


class PageEvidence(HTMLParser):
    def __init__(self, html):
        super().__init__()
        self.elements = []
        self.has_main = False
        self.has_h1 = False
        self.feed(html)

    def handle_starttag(self, tag, attrs):
        self.has_main |= tag == 'main'
        self.has_h1 |= tag == 'h1'
        self.elements.append(dict(attrs))


def verify_readback(report_date, content_hash, deployment, homepage, detail):
    """Validate rendered-page identity, including a hash of canonical source bytes."""
    date.fromisoformat(report_date)
    reports = deployment.get('reports', [])
    target = next((r for r in reports if r.get('date') == report_date), None)
    if not target or target.get('id') != f'gsd-{report_date}' or target.get('contentHash') != content_hash:
        raise ValueError('Deployment does not contain the canonical report bytes')
    latest_date = deployment.get('updatedThrough')
    latest = next((r for r in reports if r.get('date') == latest_date), None)
    if not latest or latest_date < report_date:
        raise ValueError('Deployment has no matching latest report')
    home, article = PageEvidence(homepage), PageEvidence(detail)
    if not (home.has_main and home.has_h1 and article.has_main and article.has_h1):
        raise ValueError('Public homepage or detail is not a rendered article page')
    if not any(e.get('data-latest-report') == latest_date and e.get('data-source-sha256') == latest.get('contentHash') for e in home.elements):
        raise ValueError('Public homepage is stale or does not show the deployed latest report')
    if not any(e.get('data-report-id') == f'gsd-{report_date}' and e.get('data-source-sha256') == content_hash for e in article.elements):
        raise ValueError('Public detail is stale or does not contain the canonical report')
    return {
        'report_id': f'gsd-{report_date}',
        'content_sha256': content_hash,
        'latest_report_date': latest_date,
        'homepage_url': SITE + '/',
        'detail_url': SITE + '/daily/' + report_date.replace('-', '/') + '/',
    }


def observation_status(observations):
    """Count distinct consecutive scheduled dates; manual runs/retries cannot fill slots."""
    latest = {}
    for run in sorted(observations.get('runs', []), key=lambda r: r.get('verified_at', r.get('failed_at', ''))):
        if run.get('mode') == 'scheduled':
            latest[date.fromisoformat(run['date'])] = run
    streak, previous = 0, None
    for day in sorted(latest, reverse=True):
        if latest[day].get('state') != 'deployed-and-read-back' or (previous and (previous - day).days != 1):
            break
        streak += 1
        previous = day
    return {'scheduled_success_streak': streak,
            'status': 'observed' if streak >= observations.get('target_scheduled_runs', 3) else 'observing'}


def transition(checkpoint, observations, report_date, main_sha, deployment, mode, window_end=None, *, readback=None):
    date.fromisoformat(report_date)
    if mode not in {'manual', 'scheduled'}:
        raise ValueError('Publication mode must be manual or scheduled')
    if deployment.get('commit') != main_sha:
        raise ValueError('Horizon does not contain current main; success window is unchanged')
    if deployment.get('updatedThrough', '') < report_date:
        raise ValueError('Horizon has not published this report date')
    if not readback or readback.get('report_id') != f'gsd-{report_date}' or not readback.get('content_sha256'):
        raise ValueError('Successful homepage and detail readback is required')
    cp, obs = copy.deepcopy(checkpoint), copy.deepcopy(observations)
    if report_date >= cp.get('committed_through', ''):
        cp.update(committed_through=report_date, verified_main_sha=main_sha)
        if window_end:
            dt = datetime.fromisoformat(window_end)
            if dt.tzinfo is None:
                raise ValueError('Window end requires timezone')
            if not cp.get('last_successful_window_end') or dt > datetime.fromisoformat(cp['last_successful_window_end']):
                cp['last_successful_window_end'] = window_end
    key = f'{mode}:{report_date}:{main_sha}'
    if not any(r.get('key') == key for r in obs['runs']):
        obs['runs'].append({
            'key': key, 'date': report_date, 'mode': mode, 'commit': main_sha,
            'verified_at': datetime.now(timezone.utc).isoformat(),
            'state': 'deployed-and-read-back', 'url': SITE + '/', 'readback': readback,
        })
    obs.update(observation_status(obs))
    return cp, obs


def read(url, *, html=False):
    request = urllib.request.Request(url, headers={
        'Accept': 'text/html' if html else 'application/vnd.github+json',
        'User-Agent': 'gaussian-splatting-daily-publication-verifier',
        'Cache-Control': 'no-cache',
    })
    with urllib.request.urlopen(request, timeout=30) as response:
        if response.status != 200:
            raise ValueError(f'Unexpected response status: {response.status}')
        return response.read().decode('utf-8') if html else json.load(response)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--date', required=True)
    parser.add_argument('--mode', choices=['manual', 'scheduled'], required=True)
    parser.add_argument('--window-end')
    args = parser.parse_args()
    date.fromisoformat(args.date)
    main_url = f'https://api.github.com/repos/{REPO}/commits/main'
    sha = read(main_url)['sha']
    canonical = read(f'https://api.github.com/repos/{REPO}/contents/docs/daily/{args.date[:4]}/{args.date[5:7]}/{args.date}.md?ref={sha}')
    raw = base64.b64decode(canonical['content'])
    if parse_frontmatter(raw.decode('utf-8')).get('status') not in {'published', 'corrected'}:
        raise ValueError('Main report is incomplete')
    deployment = read(SITE + '/deployment.json?verify=' + sha)
    readback = verify_readback(
        args.date, hashlib.sha256(raw).hexdigest(), deployment,
        read(SITE + '/?verify=' + sha, html=True),
        read(SITE + '/daily/' + args.date.replace('-', '/') + '/?verify=' + sha, html=True),
    )
    if read(main_url)['sha'] != sha:
        raise ValueError('Main changed during readback; retry without advancing the window')
    cp_path, obs_path = ROOT / 'state/checkpoint.json', ROOT / 'state/publication-observations.json'
    cp, obs = transition(json.loads(cp_path.read_text()), json.loads(obs_path.read_text()), args.date, sha, deployment, args.mode, args.window_end, readback=readback)
    cp_path.write_text(json.dumps(cp, ensure_ascii=False, indent=2) + '\n')
    obs_path.write_text(json.dumps(obs, ensure_ascii=False, indent=2) + '\n')
    print(f'Verified {args.date} at main {sha}; homepage, detail and source hash agree. Record through a content-only PR.')


if __name__ == '__main__':
    main()
