import sys,unittest
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from validate_coverage import validate
class CoverageTests(unittest.TestCase):
 def record(self):return {'date':'2026-11-13','mode':'scheduled','window':{'start':'2026-11-12T08:00:00+08:00','end':'2026-11-13T08:00:00+08:00'},'checks':[{'sourceId':'x','status':'unavailable','checkedAt':'2026-11-13T07:55:00+08:00','urls':['https://x.com/playcanvas'],'gap':'HTTP 403'}],'candidates':[]}
 def test_unavailable_is_explicit_not_no_new(self):
  r=self.record();self.assertEqual(validate(r,{'sources':[{'id':'x','required':True}]},set()),[])
  del r['checks'][0]['gap'];self.assertIn('source failure needs gap',validate(r,{'sources':[{'id':'x'}]},set()))
 def test_important_candidate_requires_destination(self):
  r=self.record();r['candidates']=[{'id':'a','importance':'important','disposition':'included','reason':'release','sources':['https://example.com/release'],'eventId':'a'}]
  self.assertIn('published candidate has no reading destination',validate(r,{'sources':[{'id':'x'}]},set()))
  self.assertEqual(validate(r,{'sources':[{'id':'x'}]},{'a'}),[])
 def test_scheduled_run_cannot_skip_source(self):
  r=self.record();r['checks'][0]['status']='unchecked'
  self.assertIn('scheduled edition has unchecked source',validate(r,{'sources':[{'id':'x'}]},set()))
 def test_important_event_cannot_defer(self):
  r=self.record();r['candidates']=[{'id':'a','importance':'important','disposition':'deferred','reason':'too short','sources':['https://example.com']}]
  self.assertTrue(any('important event' in e for e in validate(r,{'sources':[{'id':'x'}]},set())))

 def test_family_success_cannot_hide_an_unchecked_registered_url(self):
  r=self.record();registry={'sources':[{'id':'x','urls':['https://x.com/playcanvas','https://x.com/valigurskym']}]}
  r['checks'][0]['urlResults']=[{'url':'https://x.com/playcanvas','status':'unavailable','checkedAt':'2026-11-13T07:55:00+08:00','gap':'login wall'}]
  self.assertTrue(any('valigurskym' in e for e in validate(r,registry,set())))
  r['checks'][0]['urlResults'].append({'url':'https://x.com/valigurskym','status':'unavailable','checkedAt':'2026-11-13T07:56:00+08:00','gap':'login wall'})
  self.assertEqual(validate(r,registry,set()),[])
