import sys,json,hashlib,tempfile,unittest
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from validate_media import validate_directory
class DailyMedia(unittest.TestCase):
 def setUp(self):
  self.tmp=tempfile.TemporaryDirectory();self.folder=Path(self.tmp.name)/'2026-09-30';self.folder.mkdir();prefix='/daily-media/2026-09-30/'
  original=b'\x89PNG\r\n\x1a\nfixture';(self.folder/'original.png').write_bytes(original)
  (self.folder/'test-1.webp').write_bytes(b'RIFF0000WEBPfixture')
  self.data={'schemaVersion':1,'date':'2026-09-30','assets':[{'remoteUrl':'https://example.org/image.png','original':prefix+'original.png','originalSha256':hashlib.sha256(original).hexdigest(),'sourceSha256':hashlib.sha256(original).hexdigest(),'image':{'source':'https://example.org/','alt':'方法图','credit':'作者'},'retrievedAt':'2026-10-04T00:00:00Z','sourcePublishedAt':'2026-09-29'}],'images':{'https://example.org/image.png':{'originalUrl':prefix+'original.png','url':prefix+'test-1.webp','width':1,'height':1,'variants':[{'url':prefix+'test-1.webp','width':1}]}}}
 def tearDown(self):self.tmp.cleanup()
 def run_check(self):
  (self.folder/'manifest.json').write_text(json.dumps(self.data));return validate_directory(self.folder)
 def test_bounded_manifest(self):self.assertEqual(self.run_check(),[])
 def test_unlisted_file(self):(self.folder/'script.js').write_text('');self.assertTrue(self.run_check())
 def test_changed_checksum(self):self.data['assets'][0]['originalSha256']='0'*64;self.assertTrue(self.run_check())
 def test_future_source(self):self.data['assets'][0]['sourcePublishedAt']='2026-10-01';self.assertTrue(self.run_check())
 def test_path_escape(self):self.data['assets'][0]['original']='/daily-media/2026-09-30/../original.png';self.assertTrue(self.run_check())
 def test_upscaled_variant(self):self.data['images']['https://example.org/image.png']['variants'][0]['width']=640;self.assertTrue(self.run_check())
