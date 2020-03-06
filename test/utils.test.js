import test from 'tape';
import permute from '../src/utils/permute';

test('permute', assert => {
  assert.plan(4);

  assert.same(permute([]), [], `permuting nothing results in nothing`);
  assert.same(permute([1]), [], `permuting 1 entry results in nothing`);
  assert.same(permute([1, 2, 3]), [
    [1],
    [1, 2],
  ], `permuting 3 entry results in the correct permutations`);

  const arr = [1, 2, 3];
  permute(arr);
  assert.same(arr, [1, 2, 3], `permutating does not mutate`);

  assert.end();
});