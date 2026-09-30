#!/usr/bin/env python3
"""Check exported HTML paths and canonical source identity without a browser."""
from __future__ import annotations

import hashlib
import json
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit

from record_publication import verify_readback
from validate_daily import ROOT

BASE = '/gaussian-splatting-daily'


class Links(HTMLParser):
    def __init__(self, html):
        super().__init__()
        self.ids = set()
        self.urls = []
        self.feed(html)

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if attrs.get('id'):
            self.ids.add(attrs['id'])
        if tag in {'a', 'link'} and attrs.get('href'):
            self.urls.append(attrs['href'])
        if tag in {'img', 'script'} and attrs.get('src'):
            self.urls.append(attrs['src'])
        if tag == 'img' and attrs.get('srcset'):
            self.urls.extend(part.strip().split()[0] for part in attrs['srcset'].split(',') if part.strip())
        if tag == 'meta' and (attrs.get('property') == 'og:image' or attrs.get('name') == 'twitter:image') and attrs.get('content'):
            self.urls.append(attrs['content'])


def verify(root=ROOT):
    output = (root / 'site/out').resolve()
    pages = {path: Links(path.read_text()) for path in output.rglob('*.html')}
    if not pages:
        raise ValueError('No exported HTML pages; build the portal first')
    errors = []
    for source, page in pages.items():
        for url in page.urls:
            parsed = urlsplit(url)
            if (parsed.scheme or parsed.netloc) and parsed.netloc != 'shuang-su.github.io':
                continue
            if parsed.path == BASE or parsed.path.startswith(BASE + '/'):
                destination = output / unquote(parsed.path[len(BASE):].lstrip('/'))
            elif not parsed.path:
                destination = source
            elif parsed.path.startswith('/'):
                errors.append(f'{source.name}: URL outside project base: {url}')
                continue
            else:
                destination = source.parent / unquote(parsed.path)
            destination = destination.resolve()
            if not destination.is_relative_to(output):
                errors.append(f'{source.name}: URL escapes export directory: {url}')
                continue
            if destination.is_dir():
                destination /= 'index.html'
            if not destination.is_file():
                errors.append(f'{source.name}: missing local destination: {url}')
            elif parsed.fragment and destination in pages and unquote(parsed.fragment) not in pages[destination].ids:
                errors.append(f'{source.name}: missing fragment: {url}')
    if errors:
        raise ValueError('\n'.join(errors))
    deployment = json.loads((output / 'deployment.json').read_text())
    homepage = (output / 'index.html').read_text()
    reports = deployment.get('reports', [])
    if not reports or deployment.get('dailyCount') != len(reports):
        raise ValueError('Deployment manifest must enumerate every exported Daily')
    for report in reports:
        report_date = report['date']
        canonical = root / f'docs/daily/{report_date[:4]}/{report_date[5:7]}/{report_date}.md'
        detail = output / f'daily/{report_date.replace("-", "/")}/index.html'
        verify_readback(report_date, hashlib.sha256(canonical.read_bytes()).hexdigest(), deployment, homepage, detail.read_text())
    return len(pages), len(reports)


if __name__ == '__main__':
    pages, reports = verify()
    print(f'Export verified: {pages} HTML files, {reports} canonical reports, no broken internal links/assets/anchors. Browser interactions remain a separate check.')
