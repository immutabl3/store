import test from 'tape';
import React from 'react';
import { mount } from 'enzyme';
import { delay } from './utils';
import { API, dom, Component } from './fixtures';
import { useRoot, useBranch } from '../src/hooks';

const Root = function({ store, children }) {
  const Root = useRoot(store);
  return React.createElement(Root, null, children);
};

const AppWithSelector = ({
  onRender,
  onIncrement,
  onDecrement,
}) => {
  onRender();
  const value = useBranch(['value']);
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
  const { val: value } = useBranch({
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
  const index = useBranch(['value']);
  const value = useBranch(['arr', index]);
  return React.createElement(Component, {
    value,
    onIncrement,
    onDecrement,
  });
};

test('useRoot', assert => {
  dom();

  assert.plan(2);

  assert.throws(() => {
    mount(React.createElement(Root));
  }, `root should throw if the passed argument is not a store`);
  
  assert.doesNotThrow(() => {
    const api = API();
    mount(React.createElement(Root, { store: api.store }));
  }, `root does not throw if the passed argument is a store`);

  assert.end();
});

test('useBranch: selection and projection', async assert => {
  dom();

  const apps = [
    AppWithSelector,
    AppWithProjection,
  ];

  assert.plan(18);

  for (const App of apps) {
    const api = API();

    const app = mount(
      React.createElement(Root, { store: api.store },
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

test('useBranch: dynamic', async assert => {
  dom();

  assert.plan(9);

  const App = AppWithDynamicSelector;
  const api = API();

  const app = mount(
    React.createElement(Root, { store: api.store },
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

  assert.end();
});