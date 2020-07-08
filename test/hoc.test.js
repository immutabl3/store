import test from 'tape';
import React from 'react';
import { mount } from 'enzyme';
import { delay } from './utils';
import { API, dom, Component } from './fixtures';
import { root, branch } from '../src/react/hoc';

const Root = props => React.createElement('div', props);

const AppWithProjection = branch({
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

const AppWithDynamicProjection = branch(function({ index }) {
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

test('context', assert => {
  dom();

  assert.plan(2);

  assert.throws(() => {
    const store = {};
    const Context = root(store, Root);
    mount(React.createElement(Context));
  }, `Context should throw if the passed argument is not a store`);
  
  assert.doesNotThrow(() => {
    const { store } = API();
    const Context = root(store, Root);
    mount(React.createElement(Context));
  }, `Context does not throw if the passed argument is a store`);

  assert.end();
});

test('branch: project', async assert => {
  dom();

  assert.plan(9);

  const App = AppWithProjection;

  const api = API();

  const RootedApp = root(api.store, Root);

  const app = mount(
    React.createElement(RootedApp, null,
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
});

test('branch: dynamic', async assert => {
  dom();

  assert.plan(12);

  const App = branch({
    index: 'value',
  }, AppWithDynamicProjection);

  const api = API();

  const RootedApp = root(api.store, Root);

  const app = mount(
    React.createElement(RootedApp, null,
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