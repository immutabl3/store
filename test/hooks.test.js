import test from 'tape';
import React from 'react';
import { mount } from 'enzyme';
import { delay } from './utils';
import { API, dom, Component } from './fixtures';
import { useContext, useStore } from '../src/react/hooks';

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

test('useContext', assert => {
  dom();

  assert.plan(2);

  assert.throws(() => {
    mount(React.createElement(Context));
  }, `Context should throw if the passed argument is not a store`);
  
  assert.doesNotThrow(() => {
    const api = API();
    mount(React.createElement(Context, { store: api.store }));
  }, `Context does not throw if the passed argument is a store`);

  assert.end();
});

test('useStore: select and project', async assert => {
  dom();

  const apps = [
    AppWithSelector,
    AppWithProjection,
  ];

  assert.plan(18);

  for (const App of apps) {
    const api = API();

    const app = mount(
      React.createElement(Context, { store: api.store },
        React.createElement(
          App,
          api.actions
        )
      )
    );

    const getValue = () => app.find('#value').text();
    const increment = () => app.find('#increment').simulate('click');
    const decrement = () => app.find('#decrement').simulate('click');

    assert.is(api.store.data.value, 0, `store starting value is 0`);
    assert.is(getValue(), '0', `rendered value is 0`);
    assert.is(api.renders, 1, `only 1 render occurred`);

    increment();
    increment();
    increment();

    await delay();

    assert.is(api.store.data.value, 3, `store incremented to 3`);
    assert.is(getValue(), '3', `rendered value is 3`);
    assert.is(api.renders, 2, `only 1 render occurred`);

    decrement();

    await delay();

    assert.is(api.store.data.value, 2, `store decremented to 2`);
    assert.is(getValue(), '2', `rendered value is 2`);
    assert.is(api.renders, 3, `only 1 render occurred`);
  }

  assert.end();
});

test('useStore: dynamic', async assert => {
  dom();

  assert.plan(12);

  const App = AppWithDynamicSelector;
  const api = API();

  const app = mount(
    React.createElement(Context, { store: api.store },
      React.createElement(
        App,
        api.actions
      )
    )
  );

  const getValue = () => app.find('#value').text();
  const increment = () => app.find('#increment').simulate('click');
  const decrement = () => app.find('#decrement').simulate('click');

  assert.is(api.store.data.value, 0, `store starting value is 0`);
  assert.is(getValue(), 'foo', `rendered value is arr[0]`);
  assert.is(api.renders, 1, `only 1 render occurred`);

  increment();
  increment();

  await delay();

  assert.is(api.store.data.value, 2, `store incremented to 2`);
  assert.is(getValue(), 'baz', `rendered value is arr[2]`);
  assert.is(api.renders, 2, `only 1 render occurred`);

  decrement();

  await delay();

  assert.is(api.store.data.value, 1, `store decremented to 1`);
  assert.is(getValue(), 'bar', `rendered value is arr[1]`);
  assert.is(api.renders, 3, `only 1 render occurred`);

  api.store.data.value = 2;

  await delay();

  assert.is(api.store.data.value, 2, `store value assigned 2`);
  assert.is(getValue(), 'baz', `rendered value is arr[2]`);
  assert.is(api.renders, 4, `only 1 render occurred`);

  assert.end();
});