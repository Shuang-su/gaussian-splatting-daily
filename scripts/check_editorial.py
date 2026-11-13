#!/usr/bin/env python3
"""Validate research coverage and event completeness, with legacy report support."""
from __future__ import annotations
import argparse,re,sys,json,hashlib
from validate_daily import ROOT,DAILY_ROOT,ARXIV_RE,parse_frontmatter,daily_files
HEADINGS=re.compile(r'^#{1,2} (\d{1,2})\. (.+)$',re.M)
CATEGORIES=[r'今日最值得看',r'SuperSplat\s*/\s*PlayCanvas',r'可实际运行.*开源',r'4D\s*/\s*Dynamic',r'Viewer\s*/\s*Editor',r'Compression\s*/\s*Format',r'Training\s*/\s*Reconstruction',r'Avatar\s*/\s*Human',r'软件.*硬件.*平台厂商',r'研究论文|论文与研究',r'海外.*社区',r'中文.*社区',r'今[天日]最值得实际测试']
PLACEHOLDERS=('未启用或未成功完成 AI 编辑增强','请以原始 arXiv 记录为准','TODO:','待填正文')
NO_CHANGE=re.compile(r'无新增|没有.{0,12}新增|未发现.{0,12}新增|没有.{0,12}新实质|检索失败|无法访问|未能访问|本窗口.{0,15}无')
COVERAGE_IDS={'overview','playcanvas','opensource','dynamic','viewer','formats','training','avatar','vendors','papers','overseas','chinese','practice'}
def event_check(text, meta, body):
 errors=[]
 try:
  coverage=json.loads(re.search(r'^research_coverage: (.+)$',text,re.M).group(1))
  layout=json.loads(re.search(r'^  editorial: (.+)$',text,re.M).group(1))
 except (AttributeError,ValueError):return ['event layout needs JSON editorial metadata and research_coverage']
 if not isinstance(coverage,list) or not all(isinstance(r,dict) for r in coverage) or {r.get('id') for r in coverage}!=COVERAGE_IDS or len(coverage)!=13:errors.append('research coverage must record all 13 scopes exactly once')
 else:
  for record in coverage:
   status=record.get('status')
   if status not in {'updated','no-change','unavailable','historical-record'}:errors.append('unknown research status')
   if status=='historical-record' and meta.get('date','')>'2026-09-30':errors.append('new reports cannot claim historical coverage')
   if not str(record.get('note','')).strip():errors.append('coverage needs a scope/result explanation')
   if status!='historical-record' and (not record.get('sources') or not all(re.match(r'^https://',u) for u in record.get('sources',[]))):errors.append('each live research scope needs checked or attempted source URLs')
   if status=='unavailable' and not record.get('gap'):errors.append('inaccessible sources need an explicit gap')
 if not isinstance(layout,dict) or layout.get('version')!=1 or not isinstance(layout.get('events'),list):return errors+['unsupported event layout']
 events=layout['events'];ids=set();anchors=set()
 for event in events:
  if not isinstance(event,dict):errors.append('event must be an object');continue
  if not event.get('id') or event['id'] in ids or not event.get('anchor') or event['anchor'] in anchors:errors.append('event identity/anchor must be unique')
  ids.add(event.get('id'));anchors.add(event.get('anchor'))
  if not event.get('title') or event.get('group') not in {'main','brief','paper','analysis'} or not event.get('blocks'):errors.append('event needs title, group and canonical source blocks')
  if event.get('group')=='main' and not event.get('judgment') and not event.get('guideRows'):errors.append('main event needs its core judgment')
  tags=event.get('tags',{})
  if not isinstance(tags,dict):tags={}
  if any(not isinstance(tags.get(d),list) for d in ['techniques','projects','content','sources']):errors.append('event taxonomy dimensions are missing')
 if not events and isinstance(coverage,list) and any(isinstance(r,dict) and r.get('status')=='updated' for r in coverage):errors.append('updated research needs an event')
 if not events and not NO_CHANGE.search(body):errors.append('empty edition must explain no change or source failure')
 return errors

def reading_summaries(text:str, reading:str|None)->dict[str,str]:
 if not reading:return {}
 meta=parse_frontmatter(text)
 header,body=reading.split('---\n',2)[1:]
 fields={m.group(1):json.loads(m.group(2)) for m in re.finditer(r'^(version|report|sourceHash|events): (.+)$',header,re.M)}
 evidence=text
 supplements=re.search(r'^supplements: (.+)$',header,re.M)
 seen=set()
 for item in json.loads(supplements.group(1)) if supplements else []:
  path=item.get('path','')
  if not re.fullmatch(r'docs/supplements/\d{4}-\d{2}-\d{2}(?:-[a-z0-9-]+)?\.md',path) or path in seen:raise ValueError('invalid supplement path')
  seen.add(path)
  raw=(ROOT/path).read_bytes()
  if hashlib.sha256(raw).hexdigest()!=item.get('sha256'):raise ValueError('stale supplement hash')
  evidence+='\n'+raw.decode()
 if fields.get('version')!=2 or fields.get('report')!=meta.get('id') or fields.get('sourceHash')!=hashlib.sha256(text.encode()).hexdigest():raise ValueError('reading edition does not match its research record')
 sections=re.split(r'^## .+\n',body,flags=re.M)[1:]
 events=fields.get('events',[])
 if len(sections)!=len(events) or len({e.get('id') for e in events})!=len(events):raise ValueError('reading event mapping is incomplete or duplicated')
 summaries={}
 for event,section in zip(events,sections):
  if not event.get('sourceRefs') or event.get('source') not in evidence:raise ValueError('reading source mapping is missing')
  if event.get('id','').startswith('arxiv:'):
   identifier=event['id'][6:]
   if not re.search(r'<!--\s*arxiv:'+re.escape(identifier)+r'\s*-->',text):continue
   paragraph=section.strip().split('\n\n')[0]
   if len(paragraph)<30 or not re.search(r'[\u4e00-\u9fff]',paragraph):raise ValueError('reading paper needs a specific Chinese summary')
   summaries[identifier]=paragraph
 return summaries

def check(text:str, reading:str|None=None)->list[str]:
 errors=[];meta=parse_frontmatter(text)
 try: summaries=reading_summaries(text,reading)
 except (ValueError,KeyError,TypeError,IndexError) as error:return [f'invalid reading edition: {error}']
 body=text.split('---\n',2)[2] if text.startswith('---\n') and len(text.split('---\n',2))==3 else text
 if meta.get('status') not in {'published','corrected'}:errors.append('report has not been marked published/corrected')
 if meta.get('editorial_policy')=='horizon-v1':
  if not reading:return errors+['Horizon report requires a source-bound reading edition']
  from validate_coverage import validate
  record=json.loads((ROOT/f'data/research/{meta["date"]}.json').read_text())
  registry=json.loads((ROOT/'data/source-registry.json').read_text())
  event_meta=json.loads(re.search(r'^events: (.+)$',reading,re.M)[1])
  errors+=validate(record,registry,{e['id'] for e in event_meta})
  for phrase in PLACEHOLDERS:
   if phrase in reading:errors.append(f'editorial placeholder remains: {phrase}')
  return errors
 if re.search(r'^  layout: events$',text,re.M):
  errors+=event_check(text,meta,body)
  for phrase in PLACEHOLDERS:
   if phrase in body:errors.append(f'editorial placeholder remains: {phrase}')
  errors+=source_checks(body,meta,summaries)
  return errors
 headings=list(HEADINGS.finditer(text));titles=re.findall(r'^#{1,3} (.+)$',text,re.M)
 legacy=meta.get('date','')<'2026-09-30'
 if legacy:
  for category,pattern in enumerate(CATEGORIES):
   if category in {2,4,8,9,10,11}:continue # Historical prose combines columns; new reports require all 13.
   if not any(re.search(pattern,t,re.I) for t in titles):errors.append(f'missing editorial category: {pattern}')
 else:
  if [int(m.group(1)) for m in headings]!=list(range(1,14)):errors.append('report needs substantive, ordered sections 1–13')
  elif any(not re.search(pattern,headings[i].group(2),re.I) for i,pattern in enumerate(CATEGORIES)):errors.append('report section titles must cover the original 13 editorial categories')
 for i,m in enumerate(headings):
  content=text[m.end():headings[i+1].start() if i+1<len(headings) else len(text)]
  meaningful=re.sub(r'<!--.*?-->|\s+','',content,flags=re.S)
  # A short report must say what was checked and distinguish no change from a failed search.
  if len(meaningful)<60 and not (NO_CHANGE.search(content) and len(meaningful)>=18):errors.append(f'section {m.group(1)} is incomplete')
 for phrase in PLACEHOLDERS:
  if phrase in text:errors.append(f'editorial placeholder remains: {phrase}')
 errors+=source_checks(body,meta,summaries)
 return errors

def source_checks(body,meta,summaries=None):
 errors=[]
 if not re.search(r'https://',body) and not (NO_CHANGE.search(body) and re.search(r'窗口|检查范围|检索范围',body)):
  errors.append('report needs source links or an explicit search-window explanation')
 if meta.get('date','')>='2026-09-30':
  matches=list(ARXIV_RE.finditer(body))
  for i,m in enumerate(matches):
   block=body[m.end():matches[i+1].start() if i+1<len(matches) else len(body)]
   summary=re.search(r'(?:\*\*)?编辑摘要：(?:\*\*)?\s*([^\n]+)',block)
   if (not summary or len(summary.group(1).strip())<30) and not (summaries or {}).get(m.group(1)):errors.append(f'arXiv {m.group(1)} needs a specific editorial summary')
 return errors

def main():
 parser=argparse.ArgumentParser();parser.add_argument('--date');parser.add_argument('--all',action='store_true');args=parser.parse_args()
 if args.all:paths=daily_files()
 elif args.date:paths=[DAILY_ROOT/args.date[:4]/args.date[5:7]/f'{args.date}.md']
 else:parser.error('provide --date or --all')
 errors=[]
 for path in paths:
  if not path.exists():errors.append(f'missing {path}');continue
  if parse_frontmatter(path.read_text()).get('status') in {'published','corrected'} or not args.all:
   reader=DAILY_ROOT.parent/'reading'/path.name
   errors += [f'{path.name}: {e}' for e in check(path.read_text(),reader.read_text() if reader.exists() and re.search(r'^version: 2$',reader.read_text(),re.M) else None)]
 if errors:
  print('\n'.join('EDITORIAL INCOMPLETE: '+e for e in errors),file=sys.stderr);raise SystemExit(1)
 print(f'Editorial gate passed for {len(paths)} report(s)')
if __name__=='__main__':main()
