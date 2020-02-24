// https://jsonplaceholder.typicode.com/todos
import todos from './jsonplaceholder.json';

const todoString = JSON.stringify(todos);

export const obj = () => ({
  // standard stuff
  foo: 123,
  bar: { deep: true },
  baz: 'foo',
  arr: [1, 2, '3', { foo: 'bar', baz: [0, 1, 2] }],
  nan: NaN,
  inf: Infinity,
  map: new Map(),
  set: new Set(),
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