import test from 'tape';
import partialCompare from '../src/utils/partialCompare';

test('partialCompare', assert => {
  assert.plan(4);

  assert.is(partialCompare([1, 2, 3], [1, 2, 3]), true, `a matches b`);
  assert.is(partialCompare([1], [1, 2, 3]), true, `a matches b if b is longer`);
  assert.is(partialCompare([1, 2, 3], [1]), false, `a does not match b if a is longer`);
  assert.is(partialCompare([1], ['1']), false, `differing values do not match`);

  assert.end();
});