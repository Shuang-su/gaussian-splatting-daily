import sys
import unittest
import xml.etree.ElementTree as ET
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from verify_export import FeedLinks

class ExportFeeds(unittest.TestCase):
    def test_decodes_html_description_links_and_unicode_anchors(self):
        xml = '''<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom"><channel>
        <link>https://shuang-su.github.io/gaussian-splatting-daily/</link>
        <atom:link href="https://shuang-su.github.io/gaussian-splatting-daily/feeds/daily.xml"/>
        <item><guid isPermaLink="true">https://shuang-su.github.io/gaussian-splatting-daily/daily/2026/09/30/</guid>
        <description>&lt;a href="https://shuang-su.github.io/gaussian-splatting-daily/daily/2026/09/30/#事件-一"&gt;中文 &amp;amp; 更新&lt;/a&gt;</description></item>
        </channel></rss>'''
        parsed = FeedLinks(xml)
        self.assertEqual(len(parsed.urls), 4)
        self.assertTrue(parsed.urls[-1].endswith('#事件-一'))

    def test_missing_prefix_or_relative_feed_links_are_rejected(self):
        for url in ('/gaussian-splatting-daily/daily/', 'https://shuang-su.github.io/daily/', 'http://127.0.0.1:4337/gaussian-splatting-daily/'):
            with self.subTest(url=url), self.assertRaises(ValueError):
                FeedLinks(f'<rss version="2.0"><channel><link>{url}</link></channel></rss>')

    def test_unescaped_xml_content_is_rejected(self):
        with self.assertRaises(ET.ParseError):
            FeedLinks('<rss version="2.0"><channel><title>A & B</title></channel></rss>')

if __name__ == '__main__':
    unittest.main()
