import sys,unittest
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from check_editorial import check
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
