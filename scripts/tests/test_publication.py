import copy
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from record_publication import transition, verify_readback, observation_status


class Publication(unittest.TestCase):
    def setUp(self):
        self.cp = {'committed_through': '2026-09-30'}
        self.obs = {'schema_version': 1, 'runs': []}
        self.deployment = {'commit': 'sha', 'updatedThrough': '2026-10-01', 'reports': [
            {'date': '2026-10-01', 'id': 'gsd-2026-10-01', 'contentHash': 'hash'},
        ]}
        self.home = '<main><h1>Latest</h1><section data-latest-report="2026-10-01" data-source-sha256="hash"></section></main>'
        self.detail = '<main><h1>Report</h1><div data-report-id="gsd-2026-10-01" data-source-sha256="hash"></div></main>'
        self.evidence = verify_readback('2026-10-01', 'hash', self.deployment, self.home, self.detail)

    def test_deployment_failure_does_not_advance_or_destroy_work(self):
        with self.assertRaises(ValueError):
            transition(self.cp, self.obs, '2026-10-01', 'new', {'commit': 'old', 'updatedThrough': '2026-09-30'}, 'scheduled')
        self.assertEqual(self.cp, {'committed_through': '2026-09-30'})
        self.assertEqual(self.obs['runs'], [])

    def test_missing_report_in_deployment_does_not_advance(self):
        with self.assertRaises(ValueError):
            transition(self.cp, self.obs, '2026-10-01', 'same', {'commit': 'same', 'updatedThrough': '2026-09-30'}, 'scheduled')

    def test_metadata_alone_cannot_mark_success(self):
        with self.assertRaises(ValueError):
            transition(self.cp, self.obs, '2026-10-01', 'sha', self.deployment, 'manual')

    def test_error_detail_page_is_rejected(self):
        with self.assertRaises(ValueError):
            verify_readback('2026-10-01', 'hash', self.deployment, self.home, '<h1>404: Not Found</h1>')

    def test_stale_homepage_is_rejected(self):
        with self.assertRaises(ValueError):
            verify_readback('2026-10-01', 'hash', self.deployment, self.home.replace('2026-10-01', '2026-09-30'), self.detail)

    def test_stale_detail_source_hash_is_rejected(self):
        with self.assertRaises(ValueError):
            verify_readback('2026-10-01', 'hash', self.deployment, self.home, self.detail.replace('="hash"', '="old"'))

    def test_missing_exact_report_is_rejected(self):
        deployment = copy.deepcopy(self.deployment)
        deployment['reports'] = []
        with self.assertRaises(ValueError):
            verify_readback('2026-10-01', 'hash', deployment, self.home, self.detail)

    def test_wrong_canonical_content_hash_is_rejected(self):
        with self.assertRaises(ValueError):
            verify_readback('2026-10-01', 'different', self.deployment, self.home, self.detail)

    def test_repeat_publication_is_idempotent(self):
        cp, obs = transition(self.cp, self.obs, '2026-10-01', 'sha', self.deployment, 'scheduled', '2026-10-01T08:00:00+08:00', readback=self.evidence)
        cp2, obs2 = transition(cp, obs, '2026-10-01', 'sha', self.deployment, 'scheduled', readback=self.evidence)
        self.assertEqual(cp, cp2)
        self.assertEqual(obs, obs2)

    def test_explicit_historical_retry_keeps_latest_window(self):
        cp, obs = transition(self.cp, self.obs, '2026-09-18', 'sha', self.deployment, 'manual', readback={**self.evidence, 'report_id': 'gsd-2026-09-18'})
        self.assertEqual(cp['committed_through'], '2026-09-30')
        self.assertEqual(len(obs['runs']), 1)

    def test_manual_and_same_day_retries_cannot_complete_scheduled_observation(self):
        runs = [{'date':'2026-11-14','mode':mode,'state':'deployed-and-read-back','verified_at':f'2026-11-14T08:0{i}:00+08:00'} for i,mode in enumerate(['manual','scheduled','scheduled'])]
        self.assertEqual(observation_status({'runs':runs})['scheduled_success_streak'],1)
        self.assertEqual(observation_status({'runs':runs})['status'],'observing')

    def test_three_dates_must_be_consecutive_and_a_failed_latest_run_resets_observation(self):
        runs = [{'date':f'2026-11-{day}','mode':'scheduled','state':'deployed-and-read-back','verified_at':f'2026-11-{day}T08:10:00+08:00'} for day in [14,15,16]]
        self.assertEqual(observation_status({'runs':runs})['status'],'observed')
        self.assertEqual(observation_status({'runs':[runs[0],runs[2]]})['scheduled_success_streak'],1)
        runs.append({'date':'2026-11-17','mode':'scheduled','state':'failed','failed_at':'2026-11-17T08:20:00+08:00'})
        self.assertEqual(observation_status({'runs':runs})['scheduled_success_streak'],0)


if __name__ == '__main__':
    unittest.main()
