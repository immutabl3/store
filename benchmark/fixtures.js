// https://jsonplaceholder.typicode.com/todos
import fs from 'fs';
import path from 'path';

const todos = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), './benchmark/jsonplaceholder.json')).toString());

const todoString = JSON.stringify(todos);

export const small = () => ({
  foo: 123,
  bar: { deep: true },
  baz: 'foo',
  arr: [1, 2, '3', { foo: 'bar', deep: {} }],
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