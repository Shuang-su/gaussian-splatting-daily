import {test} from 'node:test';
import assert from 'node:assert/strict';
import {visibleSelection,stepSlide} from '../src/carousel-state';

test('mobile daily survives a temporary desktop fallback; shared content stays selected',()=>{
  const mobile=['daily','excel','matrix','recommend'],desktop=mobile.slice(1);
  const fallback=visibleSelection(desktop,'daily','daily')!;
  assert.equal(fallback,'excel');
  assert.equal(visibleSelection(mobile,'daily',fallback),'daily');
  assert.equal(visibleSelection(desktop,'matrix','excel'),'matrix');
});
test('carousel wraps through only visible content in both directions',()=>{
  const desktop=['excel','matrix','recommend'];
  assert.equal(stepSlide(desktop,'recommend',1),'excel');
  assert.equal(stepSlide(desktop,'excel',-1),'recommend');
  assert.equal(stepSlide([],'daily',1),undefined);
});
