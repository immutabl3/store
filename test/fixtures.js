import React from 'react';
import Store from '../src/index.js';
import Store from '../src';

export const API = () => {
  const store = Store({
    value: 0,
    arr: ['foo', 'bar', 'baz'],
  });
  const obj = {
    store,
    renders: 0,
    actions: {
      onIncrement() {
        store.data.value++;
      },
      onDecrement() {
        store.data.value--;
      },
      onRender() {
        obj.renders++;
      },
    }
  };
  return obj;
};


export const Component = ({
  value,
  onIncrement,
  onDecrement,
}) => {
  return (
    React.createElement('div', null,
      React.createElement('div', { id: 'value', }, value),
      React.createElement('div', { id: 'increment', onClick: onIncrement }, 'Increment'),
      React.createElement('div', { id: 'decrement', onClick: onDecrement }, 'Decrement')
    )
  );
};
