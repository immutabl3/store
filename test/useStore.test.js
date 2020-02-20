import './dom';

import test from 'tape';
import { configure, mount } from 'enzyme';
import ReactAdapter from 'enzyme-adapter-react-16';
import delay from './delay';
import React from 'react';
import { API, AppNoSelector, AppSelector } from './fixtures';

configure({
  adapter: new ReactAdapter(),
});

test('useStore', async assert => {
  const Apps = [AppNoSelector, AppSelector];

  assert.plan(12);

  for (const App of Apps) {
    API.store.value = 0;

    let rendersNr = 0;
    const rendering = () => rendersNr++;

    const app = mount(React.createElement(App, { rendering }));
    const getValue = () => app.find('#value').text();

    assert.is(getValue(), '0');
    assert.is(rendersNr, 1);

    API.increment();
    API.increment();
    API.increment();

    await delay(10);

    assert.is(getValue(), '3');
    assert.is(rendersNr, 2);

    API.decrement();

    await delay(10);

    assert.is(getValue(), '2');
    assert.is(rendersNr, 3);
  }

  assert.end();
});