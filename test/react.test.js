/* eslint-disable no-loop-func */
import '@testing-library/jest-dom';

import React from 'react';
import { wait } from '@immutabl3/utils';
import { API, Component } from './fixtures.js';
import { observe } from '../src/index.js';
import { root, branch } from '../src/react/hoc.js';
import { useContext, useStore } from '../src/react/hooks.js';
import observer from '../src/react/observer.js';
import { render, fireEvent, screen, waitFor } from '@testing-library/react';
import { describe, expect, test } from '@jest/globals';

const getValue = () => screen.getByLabelText('value');
const increment = () => fireEvent.click(screen.getByLabelText('increment'));
const decrement = () => fireEvent.click(screen.getByLabelText('decrement'));

const Context = function({ store, children }) {
  const Context = useContext(store);
  return React.createElement(Context, null, children);
};

const AppWithSelector = ({
  onRender,
  onIncrement,
  onDecrement,
}) => {
  onRender();
  const value = useStore(['value']);
  return React.createElement(Component, {
    value,
    onIncrement,
    onDecrement,
  });
};

const AppWithProjection = ({
  onRender,
  onIncrement,
  onDecrement,
}) => {
  onRender();
  const { val: value } = useStore({
    val: 'value',
  });
  return React.createElement(Component, {
    value,
    onIncrement,
    onDecrement,
  });
};

const AppWithDynamicSelector = ({
  onRender,
  onIncrement,
  onDecrement,
}) => {
  onRender();
  const index = useStore(['value']);
  const value = useStore(['arr', index]);
  return React.createElement(Component, {
    value,
    onIncrement,
    onDecrement,
  });
};

const AppWithComplexSelector = ({
  onRender,
  onIncrement,
  onDecrement,
}) => {
  onRender();
  const foo = useStore(['id']);
  const value = useStore(['obj', foo, 'value']) || {};
  const id = value.id || 'empty';
  return React.createElement(Component, {
    value: id,
    onIncrement,
    onDecrement,
  });
};

test('useContext', () => {
  expect(() => {
    render(React.createElement(Context));
  }).toThrow();
  
  expect(() => {
    const api = API();
    render(React.createElement(Context, { store: api.store }));
  }).not.toThrow();
});

describe('useStore: select and project', function() {
  const apps = [
    AppWithSelector,
    AppWithProjection,
  ];

  for (const App of apps) {
    test('useStore: select and project', async function() {
      const api = API();

      render(
        React.createElement(Context, { store: api.store },
          React.createElement(
            App,
            api.actions
          )
        )
      );
     
      await waitFor(() => expect(getValue()).toHaveTextContent('0'));

      expect(api.store.data.value).toBe(0);
      expect(api.renders).toBe(1);

      increment();
      increment();
      increment();

      await waitFor(() => expect(getValue()).toHaveTextContent('3'));

      expect(api.store.data.value).toBe(3);
      expect(api.renders).toBe(2);

      decrement();

      await waitFor(() => expect(getValue()).toHaveTextContent('2'));

      expect(api.store.data.value).toBe(2);
      expect(api.renders).toBe(3);
    });
  }
});

test('useStore: dynamic', async function() {
  const App = AppWithDynamicSelector;
  const api = API();

  render(
    React.createElement(Context, { store: api.store },
      React.createElement(
        App,
        api.actions
      )
    )
  );

  await waitFor(() => expect(getValue()).toHaveTextContent('foo'));

  expect(api.store.data.value).toBe(0);
  expect(api.renders).toBe(1);

  increment();
  increment();

  await waitFor(() => expect(getValue()).toHaveTextContent('baz'));
  
  expect(api.store.data.value).toBe(2);
  expect(api.renders).toBe(2);

  decrement();

  await waitFor(() => expect(getValue()).toHaveTextContent('bar'));
  
  expect(api.store.data.value).toBe(1);
  expect(api.renders).toBe(3);

  api.store.data.value = 2;

  await waitFor(() => expect(getValue()).toHaveTextContent('baz'));
  
  expect(api.store.data.value).toBe(2);
  expect(api.renders).toBe(4);
});

test('useStore: complex', async function() {
  const App = AppWithComplexSelector;
  const api = API();

  render(
    React.createElement(Context, { store: api.store },
      React.createElement(
        App,
        api.actions
      )
    )
  );

  await waitFor(() => expect(getValue()).toHaveTextContent('empty'));

  const id = 'foo';

  api.store.set(['obj', id], { value: {} });
  
  await waitFor(() => expect(api.renders).toBe(1));
  
  expect(getValue()).toHaveTextContent('empty');
  
  api.store.set(['obj', id, 'value', 'id'], id);
  api.store.set(['obj', id, 'value', 'count'], 1);
  api.store.set(['obj', id, 'value', 'count'], 2);
  api.store.set(['obj', id, 'value', 'count'], 3);
  api.store.merge(['obj', id, 'value'], { merged: true });
  
  await waitFor(() => expect(api.renders).toBe(1));

  expect(getValue()).toHaveTextContent('empty');
  
  api.store.set('id', 'foo');
  
  await waitFor(() => expect(api.renders).toBe(2));
  
  expect(getValue()).toHaveTextContent('foo');

  api.store.set('id', 'foo');

  // change event

  api.store.set(['obj', id, 'value', 'id'], 'bar');

  await waitFor(() => expect(api.renders).toBe(3));
  
  expect(getValue()).toHaveTextContent('bar');

  await wait(100); 

  // no further renders happen

  expect(getValue()).toHaveTextContent('bar');
  expect(api.renders).toBe(3);
});

const Root = props => React.createElement('div', props);

const AppWithProjectionHoc = branch({
  value: 'value',
})(function AppWithProjection({
  value,
  onRender,
  onIncrement,
  onDecrement,
}) {
  onRender();
  return React.createElement(Component, {
    value,
    onIncrement,
    onDecrement,
  });
});

const AppWithDynamicProjectionHoc = branch(function({ index }) {
  return {
    value: ['arr', index],
  };
})(function AppWithDynamicProjection({
  value,
  onRender,
  onIncrement,
  onDecrement,
}) {
  onRender();
  return React.createElement(Component, {
    value,
    onIncrement,
    onDecrement,
  });
});

test('context', () => {
  expect(() => {
    const store = {};
    const Context = root(store, Root);
    render(React.createElement(Context));
  }).toThrow();
  
  expect(() => {
    const { store } = API();
    const Context = root(store, Root);
    render(React.createElement(Context));
  }).not.toThrow();
});

test('branch: project', async function() {
  const App = AppWithProjectionHoc;

  const api = API();

  const RootedApp = root(api.store, Root);

  render(
    React.createElement(RootedApp, null,
      React.createElement(
        App,
        api.actions
      )
    )
  );

  await waitFor(() => expect(getValue()).toHaveTextContent('0'));

  expect(api.store.data.value).toBe(0);
  expect(api.renders).toBe(1);

  increment();
  increment();
  increment();

  await waitFor(() => expect(getValue()).toHaveTextContent('3'));

  expect(api.store.data.value).toBe(3);
  expect(api.renders).toBe(2);

  decrement();

  await waitFor(() => expect(getValue()).toHaveTextContent('2'));

  expect(api.store.data.value).toBe(2);
  expect(api.renders).toBe(3);
});

test('branch: dynamic', async function() {
  const App = branch({
    index: 'value',
  }, AppWithDynamicProjectionHoc);

  const api = API();

  const RootedApp = root(api.store, Root);

  render(
    React.createElement(RootedApp, null,
      React.createElement(
        App,
        api.actions
      )
    )
  );

  await waitFor(() => expect(getValue()).toHaveTextContent('foo'));

  expect(api.store.data.value).toBe(0);
  expect(api.renders).toBe(1);

  increment();
  increment();

  await waitFor(() => expect(getValue()).toHaveTextContent('baz'));

  expect(api.store.data.value).toBe(2);
  expect(api.renders).toBe(2);

  decrement();

  await waitFor(() => expect(getValue()).toHaveTextContent('bar'));

  expect(api.store.data.value).toBe(1);
  expect(api.renders).toBe(3);

  api.store.data.value = 2;

  await waitFor(() => expect(getValue()).toHaveTextContent('baz'));

  expect(api.store.data.value).toBe(2);
  expect(api.renders).toBe(4);
});

test('observable', async function() {
  let renders = 0;
  
  class Ticker {
    constructor() {
      this.value = 0;
      this.arr = ['foo', 'bar', 'baz'];
      this.obj = {};
    }
    increment() {
      this.value++;
    }
    decrement() {
      this.value--;
    }
    onIncrement() {}
    onDecrement() {}
  }

  const ticker = observe(new Ticker());
  
  const TickerView = observer(({ ticker }) => {
    renders++;
    return React.createElement(Component, {
      value: ticker.arr[ticker.value],
      onIncrement: ticker.onIncrement,
      onDecrement: ticker.onDecrement,
    });
  });

  render(
    React.createElement(TickerView, { ticker }, null)
  );

  await waitFor(() => expect(getValue()).toHaveTextContent('foo'));

  expect(ticker.value).toBe(0);
  expect(renders).toBe(1);

  ticker.increment();
  ticker.increment();

  await waitFor(() => expect(getValue()).toHaveTextContent('baz'));

  expect(ticker.value).toBe(2);
  expect(renders).toBe(2);

  ticker.decrement();

  await waitFor(() => expect(getValue()).toHaveTextContent('bar'));

  expect(ticker.value).toBe(1);
  expect(renders).toBe(3);

  ticker.value = 2;

  await waitFor(() => expect(getValue()).toHaveTextContent('baz'));

  expect(ticker.value).toBe(2);
  expect(renders).toBe(4);
});