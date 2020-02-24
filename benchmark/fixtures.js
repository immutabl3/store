// https://jsonplaceholder.typicode.com/todos
import todos from './jsonplaceholder.json';

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

export const objLarge = () => ({
  // standard object
  ...obj(),
  // then a very deep object
  iamdeep: {
    one: {
      two: {
        three: {
          four: {
            five: {
              six: {
                seven: [
                  {
                    eight: {
                      nine: {
                        ten: 10
                      }
                    }
                  }
                ]
              }
            }
          }
        }
      }
    }
  },
  // and a long array of objects
  todos: JSON.parse(JSON.stringify(todos)),
});