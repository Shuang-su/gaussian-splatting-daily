import test from 'node:test';
import assert from 'node:assert/strict';
import {restoreReading,sspaiHref} from '../src/sspai/state.ts';

test('reading state restores the loaded archive and chosen feed after returning',()=>{
  assert.deepEqual(restoreReading('{"feed":"热门内容","loaded":48,"scroll":1750}',48),{feed:'热门内容',loaded:48,scroll:1750});
});
test('invalid or stale stored reading state remains usable with the current sample',()=>{
  assert.deepEqual(restoreReading('broken JSON',48),{feed:'推荐',loaded:12,scroll:0});
  assert.deepEqual(restoreReading('{"feed":"unknown","loaded":999,"scroll":-10}',24),{feed:'推荐',loaded:24,scroll:0});
  assert.equal(restoreReading(null,6).loaded,6);
});
test('only captured pages use local URLs, including encoded Chinese and anchors',()=>{
  assert.equal(sspaiHref('https://sspai.com/post/115197#ss-hId-4'),'/post/115197#ss-hId-4');
  assert.equal(sspaiHref('/tag/%E6%B4%BE%E6%97%A9%E6%8A%A5/'),'/tag/派早报');
  for(const route of ['/matrix','/create','/prime','/series','/u/clyde'])assert.equal(sspaiHref(route),'https://sspai.com'+route);
  assert.equal(sspaiHref('#ss-hId-1'),'#ss-hId-1');
  assert.equal(sspaiHref('mailto:contact@sspai.com'),'mailto:contact@sspai.com');
});
