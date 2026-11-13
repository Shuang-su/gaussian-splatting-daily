#!/usr/bin/env python3
"""Discover dated RF candidates. Never marks a report published or advances cursors."""
import argparse,gzip,hashlib,html,json,re,urllib.request
from datetime import datetime,timezone,timedelta
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
ROOT=Path(__file__).resolve().parents[1]
def get(url):
 req=urllib.request.Request(url,headers={'User-Agent':'metaflow-horizon-source-discovery/1.0'})
 with urllib.request.urlopen(req,timeout=35) as response:
  raw=response.read(50*1024*1024)
  if raw[:2]==b'\x1f\x8b':raw=gzip.decompress(raw)
  return raw

def candidates(index,start,end):
 found={}
 for path,v in index.items():
  if path.count('/')!=1:continue
  dates=[(i,p) for i,p in enumerate(v.get('p',[])) if re.fullmatch(r'[A-Z][a-z]{2} \d{1,2}, \d{4}',p)]
  if not dates or dates[0][0]>=35:continue
  date=datetime.strptime(dates[0][1],'%b %d, %Y').date().isoformat()
  if start<=date<=end:found[path]={'url':'https://radiancefields.com'+path,'indexDate':date}
 return list(found.values())

def inspect(candidate):
 try:
  raw=get(candidate['url']);s=raw.decode();articles=[]
  for block in re.findall(r'<script[^>]+type="application/ld\+json"[^>]*>(.*?)</script>',s,re.S):
   try:item=json.loads(html.unescape(block))
   except ValueError:continue
   if isinstance(item,dict) and item.get('@type') in ['NewsArticle','Article']:articles.append(item)
  if not articles:return {**candidate,'status':'excluded','reason':'not an article with publication metadata'}
  article=articles[0]
  return {**candidate,'status':'candidate','title':article['headline'],'description':article.get('description'),'publishedAt':article['datePublished'],'checkedAt':datetime.now(timezone.utc).isoformat(),'sha256':hashlib.sha256(raw).hexdigest(),'needsEditorialReview':True}
 except Exception as e:return {**candidate,'status':'unavailable','gap':str(e),'checkedAt':datetime.now(timezone.utc).isoformat()}

def main():
 p=argparse.ArgumentParser();p.add_argument('--through',required=True);p.add_argument('--since');p.add_argument('--output',required=True);a=p.parse_args()
 end=datetime.fromisoformat(a.through).date();start=a.since or (end-timedelta(days=7)).isoformat()
 home=get('https://radiancefields.com/').decode()
 indexes=list(dict.fromkeys(re.findall(r'https://[^"\s<>]+searchIndex[^"\s<>]+\.json',home)))
 if not indexes:raise SystemExit('RF index unavailable; do not report no news')
 index={}
 for url in indexes:index.update(json.loads(get(url)))
 discovered=candidates(index,start,end.isoformat())
 with ThreadPoolExecutor(max_workers=4) as pool:rows=list(pool.map(inspect,discovered))
 result={'sourceId':'radiancefields','checkedAt':datetime.now(timezone.utc).isoformat(),'window':{'from':start,'through':end.isoformat()},'indexes':indexes,'candidates':rows}
 target=(ROOT/a.output).resolve()
 if not target.is_relative_to(ROOT/'.codex-work'):raise SystemExit('Discovery output must stay in project .codex-work until edited')
 target.parent.mkdir(parents=True,exist_ok=True);target.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
 print(f'Discovered {len(rows)} candidates; editorial review required: {target}')
if __name__=='__main__':main()
