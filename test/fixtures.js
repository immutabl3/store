import React from 'react';
import Store from '../src/index.js';
import once from 'lodash/once';
import { configure } from 'enzyme';
import ReactAdapter from 'enzyme-adapter-react-16';
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

export const dom = once(() => {
  configure({
    adapter: new ReactAdapter(),
  });

  const { window } = new JSDOM('<!doctype html><html><body></body></html>');

  global.window = window;
  global.document = window.document;
  global.navigator = {
    userAgent: 'node.js',
  };
  global.requestAnimationFrame = function(callback) {
    return setTimeout(callback, 0);
  };
  global.cancelAnimationFrame = function(id) {
    clearTimeout(id);
  };
  Object.defineProperties(global, {
    ...Object.getOwnPropertyDescriptors(window),
    ...Object.getOwnPropertyDescriptors(global),
  });
});

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
