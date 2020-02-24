// https://jsonplaceholder.typicode.com/todos
import todos from './jsonplaceholder.json';

const todoString = JSON.stringify(todos);

export const small = () => ({
  foo: 123,
  bar: { deep: true },
  baz: 'foo',
  arr: [1, 2, '3', { foo: 'bar' }],
  nan: NaN,
  inf: Infinity,
  map: new Map(),
  set: new Set(),
});

export const large = () => ({
  // standard stuff
  ...small(),
  arr: [1, 2, '3', { foo: 'bar', baz: [0, 1, 2] }],
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
  todos: JSON.parse(todoString),
});