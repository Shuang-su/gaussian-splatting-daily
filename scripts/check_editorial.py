#!/usr/bin/env python3
"""Editorial completeness, retaining historical section numbering and real no-change reports."""
from __future__ import annotations
import argparse,re,sys
from validate_daily import DAILY_ROOT,ARXIV_RE,parse_frontmatter,daily_files
HEADINGS=re.compile(r'^#{1,2} (\d{1,2})\. (.+)$',re.M)
CATEGORIES=[r'今日最值得看',r'SuperSplat\s*/\s*PlayCanvas',r'可实际运行.*开源',r'4D\s*/\s*Dynamic',r'Viewer\s*/\s*Editor',r'Compression\s*/\s*Format',r'Training\s*/\s*Reconstruction',r'Avatar\s*/\s*Human',r'软件.*硬件.*平台厂商',r'研究论文|论文与研究',r'海外.*社区',r'中文.*社区',r'今[天日]最值得实际测试']
PLACEHOLDERS=('未启用或未成功完成 AI 编辑增强','请以原始 arXiv 记录为准','TODO:','待填正文')
NO_CHANGE=re.compile(r'无新增|没有.{0,12}新增|未发现.{0,12}新增|没有.{0,12}新实质|检索失败|无法访问|未能访问|本窗口.{0,15}无')
def check(text:str)->list[str]:
 errors=[];meta=parse_frontmatter(text)
 body=text.split('---\n',2)[2] if text.startswith('---\n') and len(text.split('---\n',2))==3 else text
 if meta.get('status') not in {'published','corrected'}:errors.append('report has not been marked published/corrected')
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
 if not re.search(r'https://',body) and not (NO_CHANGE.search(body) and re.search(r'窗口|检查范围|检索范围',body)):
  errors.append('report needs source links or an explicit search-window explanation')
 if not legacy:
  matches=list(ARXIV_RE.finditer(text))
  for i,m in enumerate(matches):
   block=text[m.end():matches[i+1].start() if i+1<len(matches) else len(text)]
   summary=re.search(r'(?:\*\*)?编辑摘要：(?:\*\*)?\s*([^\n]+)',block)
   if not summary or len(summary.group(1).strip())<30:errors.append(f'arXiv {m.group(1)} needs a specific editorial summary')
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
   errors += [f'{path.name}: {e}' for e in check(path.read_text())]
 if errors:
  print('\n'.join('EDITORIAL INCOMPLETE: '+e for e in errors),file=sys.stderr);raise SystemExit(1)
 print(f'Editorial gate passed for {len(paths)} report(s)')
if __name__=='__main__':main()
