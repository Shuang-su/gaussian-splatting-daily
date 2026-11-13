import sys,unittest,json,hashlib
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from check_editorial import check, reading_summaries
from validate_daily import parse_frontmatter
def report(content):
 return '---\ndate: "2026-10-01"\nstatus: "published"\n---\n'+'\n'.join(f'## {i}. {title}\n{content}' for i,title in enumerate(['今日最值得看','SuperSplat / PlayCanvas','可实际运行的开源项目','4D / Dynamic','Viewer / Editor','Compression / Format','Training / Reconstruction','Avatar / Human','软件硬件平台厂商','研究论文','海外社区','中文社区','今天最值得实际测试'],1))
class Editorial(unittest.TestCase):
 def test_real_no_change_passes(self):
  self.assertEqual(check(report('检查本窗口的官方源；无新增，检索范围与上次成功窗口一致。')),[])
 def test_short_empty_does_not_pass(self):
  self.assertTrue(check(report('无新增')))
 def test_failed_source_is_explicit(self):
  self.assertEqual(check(report('本窗口官方来源无法访问；检索失败，保留缺口，下次复用重试。')),[])
 def test_draft_cannot_publish(self):
  self.assertTrue(check(report('无新增；检查本窗口官方来源，未发现可核验的新发布。').replace('published','draft')))
 def test_missing_column_is_rejected(self):
  self.assertTrue(check(report('检查本窗口官方源；无新增，来源 https://example.org。').replace('## 13.','### 13.')))
 def test_placeholder_is_rejected(self):
  self.assertTrue(check(report('未启用或未成功完成 AI 编辑增强；本窗口无新增。')))
 def test_frontmatter_only_reads_top_level(self):
  self.assertEqual(parse_frontmatter('---\ndate: "2026-10-01"\nportal:\n  date: "wrong"\n---\n')['date'],'2026-10-01')
if __name__=='__main__':unittest.main()

class EventEditorial(unittest.TestCase):
 def source(self,events=None,status='no-change'):
  import json
  from check_editorial import COVERAGE_IDS
  coverage=[{'id':key,'status':status,'note':'检查项目官方发布记录；本窗口无新增。','sources':['https://example.org/releases']} for key in sorted(COVERAGE_IDS)]
  layout={'version':1,'events':events or [],'introduction':['b-example-1'],'archive':[],'omit':[]}
  return '---\ndate: "2026-10-01"\nstatus: "published"\nresearch_coverage: '+json.dumps(coverage)+'\nportal:\n  layout: events\n  editorial: '+json.dumps(layout)+'\n---\n检查本窗口官方来源；没有新增，检索范围与上次成功窗口一致。'
 def test_event_no_change_without_news_quota(self):self.assertEqual(check(self.source()),[])
 def test_event_unavailable_needs_gap(self):self.assertTrue(check(self.source(status='unavailable')))
 def test_event_updated_needs_event(self):self.assertTrue(check(self.source(status='updated')))
 def test_no_historical_research_in_new_report(self):self.assertTrue(check(self.source(status='historical-record')))
 def test_event_paper_still_needs_summary(self):self.assertTrue(check(self.source()+'\n<!-- arxiv:2609.38177 -->\n论文。'))

class ReadingEditorial(unittest.TestCase):
 def fixture(self):
  raw=report('检查本窗口官方来源；没有新增，检索范围与上次成功窗口一致。').replace('---\ndate:', '---\nid: "gsd-test"\ndate:',1)+'\n<!-- arxiv:2610.21121 -->\n[论文](https://arxiv.org/abs/2610.21121)\n'
  fields={'version':2,'report':'gsd-test','sourceHash':hashlib.sha256(raw.encode()).hexdigest(),'events':[{'id':'arxiv:2610.21121','source':'https://arxiv.org/abs/2610.21121','sourceRefs':['b-research-record-1']}]}
  body='## 双流研究\n\n论文将时间上稳定的部分与逐帧变化的部分分别处理，以研究移动设备的传输与解码成本；数字仍需独立复现。\n'
  return raw,fields,body
 def reader(self,fields,body):return '---\n'+'\n'.join(f'{key}: {json.dumps(value,ensure_ascii=False)}' for key,value in fields.items())+'\n---\n'+body
 def test_bound_reader_supplies_paper_summary_without_changing_raw(self):
  raw,fields,body=self.fixture()
  self.assertTrue(any('editorial summary' in error for error in check(raw)))
  self.assertEqual(check(raw,self.reader(fields,body)),[])
 def test_stale_raw_is_rejected(self):
  raw,fields,body=self.fixture()
  self.assertTrue(any('does not match' in error for error in check(raw+'\n',self.reader(fields,body))))
 def test_duplicate_mapping_is_rejected(self):
  raw,fields,body=self.fixture();fields['events']*=2
  self.assertTrue(any('duplicated' in error for error in check(raw,self.reader(fields,body+body))))
 def test_invented_source_is_rejected(self):
  raw,fields,body=self.fixture();fields['events'][0]['source']='https://example.org/not-in-report'
  self.assertTrue(any('source mapping' in error for error in check(raw,self.reader(fields,body))))
 def test_short_or_non_chinese_abstract_is_rejected(self):
  raw,fields,_=self.fixture()
  with self.assertRaisesRegex(ValueError,'specific Chinese summary'):reading_summaries(raw,self.reader(fields,'## 摘要\n\nNew paper.\n'))
