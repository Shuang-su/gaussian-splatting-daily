#!/usr/bin/env python3
"""Validate source checks, editorial decisions and important-event destinations."""
import argparse,json,re
from datetime import datetime,date
from pathlib import Path
from urllib.parse import urlsplit
ROOT=Path(__file__).resolve().parents[1]
STATUSES={'checked-no-new','candidates','unavailable','unchecked'}
DISPOSITIONS={'included','merged','deferred','excluded'}
def source_url(url):
 p=urlsplit(url);return (p.scheme,p.netloc,p.path.rstrip("/"))

def validate(record,registry,events):
 errors=[]
 try:
  date.fromisoformat(record['date'])
  start=datetime.fromisoformat(record['window']['start']);end=datetime.fromisoformat(record['window']['end'])
  if not start.tzinfo or not end.tzinfo or end<=start:errors.append('invalid source window')
 except (KeyError,ValueError,TypeError):errors.append('missing or invalid source window')
 checks=record.get('checks',[]);ids=[x.get('sourceId') for x in checks]
 if len(ids)!=len(set(ids)):errors.append('duplicate source check')
 for source in registry['sources']:
  if source.get('required') and source['id'] not in ids:errors.append('missing required source '+source['id'])
 for check in checks:
  if check.get('status') not in STATUSES:errors.append('unknown source status')
  if check.get('sourceId') not in {s['id'] for s in registry['sources']}:errors.append('unknown source id')
  if check.get('status')=='unchecked' and record.get('mode')=='scheduled':errors.append('scheduled edition has unchecked source')
  if check.get('status')!='unchecked':
   try:
    if not datetime.fromisoformat(check['checkedAt']).tzinfo:raise ValueError()
   except (KeyError,ValueError):errors.append('source check needs actual timestamp')
   if not check.get('urls'):errors.append('source check needs attempted URLs')
  if check.get('status') in {'unavailable','unchecked'} and not check.get('gap'):errors.append('source failure needs gap')
  if check.get('status')=='checked-no-new' and check.get('candidateIds'):errors.append('no-new source contains candidates')
  if record.get('mode') in {'scheduled','manual'}:
   source=next((s for s in registry['sources'] if s['id']==check.get('sourceId')), {})
   receipts=check.get('urlResults',[])
   for url in source.get('urls',[]):
    receipt=next((r for r in receipts if source_url(r.get('url',''))==source_url(url)), None)
    if not receipt:errors.append('registered source URL needs its own receipt: '+url);continue
    if receipt.get('status') not in {'checked-no-new','candidates','unavailable'}:errors.append('source URL needs explicit access outcome')
    try:
     if not datetime.fromisoformat(receipt['checkedAt']).tzinfo:raise ValueError()
    except (KeyError,ValueError,TypeError):errors.append('source URL needs actual timestamp')
    if receipt.get('status')=='unavailable' and not receipt.get('gap'):errors.append('source URL failure needs gap')

 candidates=record.get('candidates',[]);candidate_ids=[c.get('id') for c in candidates]
 if len(candidate_ids)!=len(set(candidate_ids)):errors.append('duplicate candidate')
 for c in candidates:
  if c.get('disposition') not in DISPOSITIONS or not c.get('reason'):errors.append('candidate needs disposition and reason')
  if not c.get('sources') or not all(u.startswith('https://') for u in c['sources']):errors.append('candidate needs HTTPS sources')
  if c.get('disposition') in {'included','merged'} and c.get('eventId') not in events:errors.append('published candidate has no reading destination')
  if c.get('importance')=='important' and c.get('disposition')=='deferred':errors.append('important event cannot silently defer: publish verified facts or report blocked edition')
  if c.get('disposition')=='excluded' and not c.get('exclusionEvidence'):errors.append('excluded candidate needs evidence')
 for check in checks:
  if any(i not in candidate_ids for i in check.get('candidateIds',[])):errors.append('source references unknown candidate')
 return errors

def main():
 parser=argparse.ArgumentParser();parser.add_argument('--date');parser.add_argument('--all',action='store_true');args=parser.parse_args()
 registry=json.loads((ROOT/'data/source-registry.json').read_text())
 paths=[ROOT/f'data/research/{args.date}.json'] if args.date else sorted((ROOT/'data/research').glob('*.json'))
 failures=[]
 for p in paths:
  record=json.loads(p.read_text());reader=ROOT/f'docs/reading/{record["date"]}.md'
  match=re.search(r'^events: (.+)$',reader.read_text(),re.M) if reader.exists() else None
  events={x['id'] for x in json.loads(match[1])} if match else set()
  failures.extend(f'{p.name}: {e}' for e in validate(record,registry,events))
 if failures:raise SystemExit('\n'.join(failures))
 print(f'Validated source coverage and candidate destinations for {len(paths)} editions')
if __name__=='__main__':main()
