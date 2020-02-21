export const obj = () => ({
  foo: 123,
  bar: { deep: true },
  baz: 'foo',
  arr: [1, 2, '3', { foo: 'bar' }],
  nan: NaN,
  inf: Infinity,
  map: new Map(),
  set: new Set(),
});