#!/usr/bin/env python3
"""Check exported HTML paths and canonical source identity without a browser."""
from __future__ import annotations

import hashlib
import json
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit
import xml.etree.ElementTree as ET

from record_publication import verify_readback
from validate_daily import ROOT

BASE = '/horizon'


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


class FeedLinks:
    """Validate RSS XML, then follow its page and embedded-description links."""
    def __init__(self, xml):
        feed = ET.fromstring(xml)
        if feed.tag != 'rss' or feed.get('version') != '2.0':
            raise ValueError('Expected an RSS 2.0 document')
        self.ids = set()
        self.urls = []
        for element in feed.iter():
            name = element.tag.rsplit('}', 1)[-1]
            if name == 'link':
                self.urls.append(element.get('href') or element.text or '')
            if name == 'guid' and element.get('isPermaLink', 'true') == 'true':
                self.urls.append(element.text or '')
            if name == 'description':
                self.urls.extend(Links(element.text or '').urls)
        if any(urlsplit(url).scheme != 'https' or urlsplit(url).netloc != 'metaflow.shuang-su.com' or not urlsplit(url).path.startswith(BASE + '/') for url in self.urls):
            raise ValueError('RSS links must use canonical HTTPS URLs with the project prefix')


def verify(root=ROOT):
    output = (root / 'site/out').resolve()
    pages = {path: Links(path.read_text()) for path in output.rglob('*.html')}
    if not pages:
        raise ValueError('No exported HTML pages; build the portal first')
    feeds = {}
    for kind in ('daily', 'weekly', 'articles'):
        source = output / 'feeds' / f'{kind}.xml'
        if not source.is_file():
            raise ValueError(f'Missing RSS file: {source}')
        feeds[source] = FeedLinks(source.read_text())
    errors = []
    for source, page in {**pages, **feeds}.items():
        for url in page.urls:
            parsed = urlsplit(url)
            if (parsed.scheme or parsed.netloc) and parsed.netloc != 'metaflow.shuang-su.com':
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
        if report.get('readingEdition'):
            reader = report['readingEdition']
            reader_path = (root / reader['path']).resolve()
            if not reader_path.is_relative_to((root / 'docs/reading').resolve()):
                raise ValueError(f'Invalid reading edition path: {reader_path}')
            digest = hashlib.sha256(reader_path.read_bytes()).hexdigest()
            if digest != reader['contentHash'] or f'data-reading-sha256="{digest}"' not in detail.read_text():
                raise ValueError(f'Reading edition does not match the export: {report_date}')
    cover_manifest = root / 'site/public/media/editorial-covers/manifest.json'
    if cover_manifest.is_file():
        covers = json.loads(cover_manifest.read_text())['covers']
        shares = json.loads((output / 'share/manifest.json').read_text())['reports']
        for report_date, cover in covers.items():
            detail = output / f'daily/{report_date.replace("-", "/")}/index.html'
            share = shares[report_date]
            if BASE + cover['image']['url'] not in pages[detail].urls:
                raise ValueError(f'Editorial cover does not appear on its daily page: {report_date}')
            for variant in cover['files']:
                media = output / variant['url'].lstrip('/')
                if hashlib.sha256(media.read_bytes()).hexdigest() != variant['sha256']:
                    raise ValueError(f'Editorial cover does not match its export: {variant["url"]}')
            current = share.get('cover', {})
            png = output / share['url'].lstrip('/')
            if (current.get('url') != cover['image']['url'] or
                    current.get('kind') != 'editorial-illustration' or
                    current.get('source') != cover['image']['source'] or
                    current.get('credit') != cover['image']['credit'] or
                    current.get('sha256') != next(file['sha256'] for file in cover['files'] if file['url'] == current['url']) or
                    hashlib.sha256(png.read_bytes()).hexdigest() != share['sha256']):
                raise ValueError(f'Editorial cover does not match its share card: {report_date}')
    return len(pages), len(reports)


if __name__ == '__main__':
    pages, reports = verify()
    print(f'Export verified: {pages} HTML files, 3 RSS feeds, {reports} canonical reports, no broken internal links/assets/anchors. Browser interactions remain a separate check.')
