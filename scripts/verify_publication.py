#!/usr/bin/env python3
"""Read public identity and canonical/reader bytes without advancing the cursor."""
import argparse, hashlib, json, time, urllib.request
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
    return {'state':'deployed-and-read-back','commit':commit,'checkedAt':datetime.now(timezone.utc).isoformat(),'site':site,'evidence':evidence}

if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--commit',required=True);p.add_argument('--site',default=SITE);p.add_argument('--output',required=True);a=p.parse_args()
    result=None
    for attempt in range(12):
        try: result=verify(a.commit,a.site);break
        except Exception as e:
            if attempt==11: raise
            print(f'Public readback attempt {attempt+1}: {type(e).__name__}: {e}',flush=True);time.sleep(5)
    out=Path(a.output);out.parent.mkdir(parents=True,exist_ok=True);out.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n');print(json.dumps(result,ensure_ascii=False))
