#!/usr/bin/env python3
"""Read public identity and canonical/reader bytes without advancing the cursor."""
import argparse, hashlib, json, time, urllib.request
import xml.etree.ElementTree as ET
from pathlib import Path
from datetime import datetime, timezone
from record_publication import SITE, verify_readback
from validate_daily import ROOT

def verify(commit, site=SITE):
    def read(path):
        req=urllib.request.Request(site+path,headers={'Cache-Control':'no-cache','User-Agent':'metaflow-horizon-readback'})
        with urllib.request.urlopen(req,timeout=30) as r:
            if r.status!=200: raise ValueError(f'HTTP {r.status}: {path}')
            return r.read().decode()
    deployment=json.loads(read('/deployment.json'))
    if deployment['commit']!=commit: raise ValueError('Public deployment commit mismatch')
    date=deployment['updatedThrough']
    canonical=ROOT/f'docs/daily/{date[:4]}/{date[5:7]}/{date}.md'
    detail=read('/daily/'+date.replace('-','/')+'/')
    evidence=verify_readback(date,hashlib.sha256(canonical.read_bytes()).hexdigest(),deployment,read('/'),detail)
    reader=next(x for x in deployment['reports'] if x['date']==date).get('readingEdition')
    if reader:
        digest=hashlib.sha256((ROOT/reader['path']).read_bytes()).hexdigest()
        if reader['contentHash']!=digest or f'data-reading-sha256="{digest}"' not in detail: raise ValueError('Public reading edition mismatch')
    index=json.loads(read('/content-index.json'))
    if index.get('updatedThrough')!=date: raise ValueError('Public search index is stale')
    for name in ['daily','weekly','articles']:
        feed=ET.fromstring(read('/feeds/'+name+'.xml'))
        if feed.tag!='rss' or feed.find('channel/link').text!=SITE+'/': raise ValueError('Public RSS uses the wrong site')
    sitemap=ET.fromstring(read('/sitemap.xml'))
    if any(not e.text.startswith(SITE+'/') for e in sitemap.iter('{http://www.sitemaps.org/schemas/sitemap/0.9}loc')): raise ValueError('Public sitemap uses the wrong site')
    return {'searchVerified':True,'feedsVerified':['daily','weekly','articles'],'sitemapVerified':True,'state':'deployed-and-read-back','commit':commit,'checkedAt':datetime.now(timezone.utc).isoformat(),'site':site,'evidence':evidence}

if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--commit',required=True);p.add_argument('--site',default=SITE);p.add_argument('--output',required=True);a=p.parse_args()
    result=None
    for attempt in range(12):
        try: result=verify(a.commit,a.site);break
        except Exception as e:
            if attempt==11: raise
            print(f'Public readback attempt {attempt+1}: {type(e).__name__}: {e}',flush=True);time.sleep(5)
    out=Path(a.output);out.parent.mkdir(parents=True,exist_ok=True);out.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n');print(json.dumps(result,ensure_ascii=False))
