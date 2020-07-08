# @immutabl3/store

Store is a modern, [Proxy-based](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy) JavaScript data store supporting cursors and enabling developers to easily navigate and monitor nested data though events

It's a combination and evolution of the work done in [fabiospampinato/store](https://github.com/fabiospampinato/store) and [Yomguithereal/baobab](https://github.com/Yomguithereal/baobab) with a focus on performance (especially pertaining to data changes) and size with a loosely coupled API

It aims at providing a centralized model to hold an application's state and can be paired with [**React**](#react) easily through [hooks](#react-hooks) and [higher order components](#react-hoc)



## Install

```sh
npm install @immutabl3/store
```

`store` is ~`5.1`kb minified and gzipped 



## Quick Start

```js
import Store from '@immutabl3/store'

// initialize the store
const store = Store({
  palette: {
    colors: ['green', 'red'],
    name: 'Glorious colors'
  }
});

// listen to all changes in the store
store.onChange(({ transactions }) => {
  console.log('the store has been updated!', transactions);
});

// data is the object passed to Store, wrapped in a Proxy
const { data } = store;

// manipulate the data as plain-old-javascript
data.palette.colors.push('blue');
> ['green', 'red', 'blue']
  
// type checks work as well
Array.isArray(data.palette.colors);
> true
```



## Summary

- [Usage](#usage)
  - [instantiation](#instantiation)
  - [cursors](#cursors)
  - [onChange](#onChange)
  - [watch](#watch)
  - [project](#project)
  - [gets](#gets)
    - [get](#get)
    - [exists](#exists)
    - [clone](#clone)
  - [updates](#updates)
    - [set](#set)
    - [unset](#unset)
    - [push](#push)
    - [unshift](#unshift)
    - [concat](#concat)
    - [pop](#pop)
    - [shift](#shift)
    - [splice](#splice)
    - [merge](#merge)
  - [events](#events)
    - [target](#target)
    - [data](#data)
    - [transactions](#transactions)
  - [debug](#debug)
- [React](#react)
  - [Hooks](#hooks)
  - [HOC](#hoc)
- [Features](#features)
- [Philosophy](#philosophy)
- [Notes](#notes)
- [Test](#test)
- [Benchmark](#benchmark)
- [Contribution](#contribution)
- [License](#license)



## Usage

### instantiation

Creating a store is as simple as instantiating _Store_ with an initial data set.

```js
import Store from '@immutabl3/store';

const store = Store({ hello: 'world' });

// data is your store's data
store.data
> {hello: "world"}
```



An `options` object can be passed as a second parameter to the store to change behavior:

- asynchronous, default:  `true` - whether events should be fired asynchonously
- autoCommit, default: `true` - whether the store should automatically trigger changes when the data is changed
- debug, default: `undefined` - the [logger](#debug) for tracking changes



### cursors

You can create cursors to easily access nested data in your store and listen to changes concerning the part of the store selected

```js
// considering the following store
const store = Store({
  palette: {
    name: 'fancy',
    colors: ['blue', 'yellow', 'green'],
  },
});

// creating a cursor on the palette
var paletteCursor = store.select(['palette']);
paletteCursor.get();
> {name: 'fancy', colors: ['blue', 'yellow', 'green']}

// creating a cursor on the palette's colors
var colorsCursor = store.select(['palette', 'colors']);
colorsCursor.get();
> ['blue', 'yellow', 'green']

// creating a cursor on the palette's third color
var thirdColorCursor = store.select(['palette', 'colors', 2]);
thirdColorCursor.get();
> 'green'

// note that you can also perform subselections if needed
const colorCursor = paletteCursor.select('colors');
```



### onChange

A store can be watched for changes

```js
const store = Store({
  user: {
    name: 'John',
  },
});

const { data } = store;

// will fire when the store changes
store.onChange(() => {
	console.log(`user's name is ${data.user.name}`);
  > `user's name is Jane`
});

data.user.name = 'Jane';
```



[cursors](#cursors) can be watched as well. A cursor's change event will only fire if the target object has changed

```js
const store = Store({
  user: {
    name: 'John',
  },
});

// listen to the user
const userCursor = store.select(['user']);
userCursor.onChange(() => {
  console.log(`user's name is ${userCursor.data.name}`);
  > `user's name is Jane`
});

// listen to a specific value
store.select(['user', 'name'])
  .onChange(() => {
    console.log(`user's name is ${store.data.user.name}`);
		> `user's name is Jane`
  });

// change the data at the cursor level
cursor.data.name = 'Jane';
// or at the store level
store.data.user.name = 'Jane';
```



`onChange` returns a disposer. When called, the disposer will unbind the function

```js
const store = Store({ counter: 1 });

const dispose = store.onChange(() => {
  console.log(store.data.counter);
});

store.data.counter = 2;
> 2

dispose();

store.data.counter = 3;
// event is not called
```



### watch

`watch` is similar to `onChange`, but allows you to watch one or more values

```js
const store = Store({
  user: {
    name: 'John',
  },
});

// listen to the name change
store.watch(['user', 'name'], () => {
  console.log(`user's name is ${store.data.user.name}`);
  > `user's name is Jane`
});

store.data.user.name = 'Jane';
```



An object can be used to listen to multiple values. Each key of the object will be mapped to the changed data (for more info, see [Events](#events))

```js
const store = Store({
  user: {
    name: 'John',
    age: 50,
  },
});


store.watch({
  person: ['user', 'name'],
  years: ['user', 'age'],
// event will fire when either user.name or user.age change
}, e => {
  console.log(`${e.data.person} is ${e.data.years} years old`);
  > `Jane is 30 years old`
});

store.data.user.name = 'Jane';
```



`watch` returns a disposer. When called, the disposer will unbind the function

```js
const store = Store({ counter: 1 });

const dispose = store.watch(['counter'], e => {
  console.log(e.data);
});

store.data.counter = 2;
> 2

dispose();

store.data.counter = 3;
// event is not called
```



### project

`project` takes an object with paths and saturates the object with the current state of the store

```js
const store = Store({
  user: {
    name: 'John',
    age: 50,
  },
});


const result = store.project({
  person: ['user', 'name'],
  years: ['user', 'age'],
});

console.log(`${result.person} is ${result.years} years old`);
> `Jane is 30 years old`
```



### events

Every listener is passed an event object. The event contains:



#### data

Contains the data for the selector passed - pertinent if using [`watch`](#watch)

```js
const store = Store({ hello: 'universe' });

store.watch(['hello'], e => {
	e.data === 'world'
  > true
});

store.data.hello = 'world;
```

For an [`onChange`](#onChange) event, this is the same as `target`



#### transactions

A list of all changes made to the object (and its children) since the last event. Each transaction tracks the mutations made to the object sequentially, tracking the type of operation, the path of the change and the value/args used to make the change.

```js
const store = Store({
  val: 0,
  arr: [0],
});

store.watch(['hello'], e => {
	console.log(e.transactions);
	/* 
  [
    {
      type: 'set',
      path: ['val'],
      value: 1,
    },
    {
      type: 'push',
      path: ['arr'],
      value: [1],
    }
  ]
  */
});

store.data.val = 1;
store.data.arr.push(1);
```

Using a [cursor](#cursor) or [watching](#watch) values will only report transactions pertinent to that position in the store



### gets

Store comes with convenient pure functions for accessing nested data from the store.

#### get

Gets the value from the store

```js
const store = Store({
  palette: {
    name: 'fancy',
    colors: ['blue'],
    list: [{ item: 1, value: ['black'] }],
  },
});

// getting a path
store.get(['palette']);
> {name: 'fancy', colors: ['blue']}

// getting a cursor
store.select(['palette']).get();
> {name: 'fancy', colors: ['blue']}

// the path can be dynamic
store.get(['palette', 'list', { item: 1 }, 'value', 0]);
> 'black'
```



#### exists

Check whether a specific path exists within the data.

```js
// true
store.exists();

// does the cursor point at an existing path?
cursor.exists();

// can also take a path
store.exists('hello');
store.exists(['hello', 'message']);
```



#### clone

Shallow clone the cursor's data. The method takes an optional nested path.

```js
const store = Store({ user: {name: 'John' } }),
const cursor = store.select('user');

assert(cursor.get() !== cursor.clone());
```



### updates

Store comes with a set of convenient pure functions for updating data. These updates write to the data synchronously, even if `onChange` and `watch` events update asynchronously.

* [set](#set)
* [unset](#unset)
* [push](#push)
* [unshift](#unshift)
* [concat](#concat)
* [pop](#pop)
* [shift](#shift)
* [splice](#splice)
* [merge](#merge)



#### set

Replaces value at the given path. Will also work if you want to replace a list's item.

```js
// setting a value
const value = cursor.set('key', newValue);

// can also use a dynamic path
const value = cursor.set(['one', { id: 'two'}, 0], newValue);

// setting a cursor
const value = cursor.set(newValue);
```



#### unset

Unsets the given key. Will also work if you want to delete a list's item.

```js
// removing a value
cursor.unset(['one', 'two']);

// can also use a dynamic path
cursor.unset(['one', { id: 'two'}, 0]);

// removing data at cursor
cursor.unset();
```



#### push

Pushes a value into the selected list. Will fail if the selected node is not a list.

```js
// pushing a value
const list = cursor.push(['arr'], newValue);

// can also use a dynamic path
const list = cursor.push(['one', { id: 'two'}, 'arr'], newValue);

// pushing a cursor
const list = cursor.push(newValue);
```



#### unshift

Unshifts a value into the selected list. Will fail if the selected node is not a list.

```js
// unshift a value
const list = cursor.unshift(['arr'], newValue);

// can also use a dynamic path
const list = cursor.unshift(['one', { id: 'two'}, 'arr'], newValue);

// unshift a cursor
const list = cursor.unshift(newValue);
```



#### concat

Concatenates a list into the selected list. Will fail if the selected node is not a list.

```js
// concatenating a list at the given path
const list = cursor.concat(['key'], list);

// can also use a dynamic path
const list = cursor.unshift(['one', { id: 'two'}, 'arr'], list);

// concatenating a cursor
const list = cursor.concat(list);
```



#### pop

Removes the last item of the selected list. Will fail if the selected node is not a list.

```js
// popping a list at the given path
const value = cursor.pop(['key']);

// can also use a dynamic path
const value = cursor.pop(['one', { id: 'two'}, 'arr']);

// popping a cursor
const value = cursor.pop();
```



#### shift

Removes the first item of the selected list. Will fail if the selected node is not a list.

```js
// shifting a list at the given path
const value = cursor.shift(['key']);

// can also use a dynamic path
const value = cursor.shift(['one', { id: 'two'}, 'arr']);

// shifting a cursor
const value = cursor.shift();
```



#### splice

Splices the selected list. Will fail if the selected node is not a list.

The `splice` specifications works the same as for [`Array.prototype.splice`](https://developer.mozilla.org/fr/docs/Web/JavaScript/Reference/Objets_globaux/Array/splice).
There is one exception though: Per specification, splice deletes no values if the `deleteCount` argument is not parseable as a number. Instead store throws an error if the given `deleteCount` argument could not be parsed.

```js
// splicing the list
const list = cursor.splice([1, 1]);

// omitting the deleteCount argument makes splice delete no elements
const list = cursor.splice([1]);

// inserting an item
const list = cursor.splice([1, 0, 'newItem']);
const list = cursor.splice([1, 0, 'newItem1', 'newItem2']);

// splicing the list at key
const list = cursor.splice('key', [1, 1]);

// splicing list at path
const list = cursor.splice(['one', 'two'], [1, 1]);
const list = cursor.select('one', 'two').splice([1, 1]);
const list = cursor.select('one').splice('two', [1, 1]);
```



#### merge

Shallow merges the selected object with another one. This will fail if the selected node is not an object.

```js
// Merging
const newList = cursor.merge({ name: 'John' });

// Merging at key
const newList = cursor.merge('key', { name: 'John' });

// Merging at path
const newList = cursor.merge(['one', 'two'], { name: 'John' });
const newList = cursor.select('one').merge('two', { name: 'John' });
```



### debug

The debugger is a separate module that can be configured and passed to the store to enable debugging. It will log updates, additions and deletions between the previous and new state on commit.

It's not recommended to use `debug` in production, as it clones the store state on every commit and increases code size.

```js
import Store from '@immutabl3/store';
import debug from '@immutabl3/store/debug';
```

`debug` can be passed on options object:

- diffs, default: `true` - whether to log the diffs between the old and new state
- full, default: `false` - whether to log the entirety of the old and new state
- collapsed, default: `true` - will call `log.groupCollapsed` when `true`, `log.group` when `false`
- log, default: `console` - what to use to log the debug statements. Overwriting this will need to implement the following console methods: `log`, `group`, `groupCollapsed` and `groupEnd`



## React

React integration can be done with [hooks](#hooks) or [higher-order components](#hoc). Note that higher-order components implements hooks under-the-hood. See `peerDependencies` in the [package.json](./package.json) for supported React versions

### Hooks

####Creating the app's state

Let's create a **store** for our colors:

*state.js*

```js
import Store from '@immutabl3/store';

export default Store({
  colors: ['yellow', 'blue', 'orange']
});
```

#### Exposing the store

Now that the store is created, we should bind our React app to it by using a context.

Under the hood, this component will simply propagate the store to its descendants using React's context so that components may get data and subscribe to updates.

*main.jsx*

```jsx
import React from 'react';
import { render } from 'react-dom';
import { useContext } from '@immutabl3/store/react';
import store from './state';

// we will write this component later
import List from './list.jsx';

// creating our top-level component
const App = function({ store }) {
  // useContext takes the store and provides a component bound to the store
  const Context = useContext(store);
  return (
    <Context>
      <List />
    </Context>
  );
};

// render the app
render(<App store={ store } />, document.querySelector('#mount'));
```

#### Accessing data

Now that we have access to the top-level store, let's create the component displaying our colors.

*list.jsx*

```jsx
import React from 'react';
import { useStore } from '@immutabl3/store/react';

const List = function() {
  // branch by mapping the desired data to cursors
  let { colors } = useStore({
    colors: ['colors'],
  });
  
  // or get a speific value using a single cursor
	colors = useStore(['colors']);

  const renderItem = color=> <li key={color}>{color}</li>;

  return <ul>{colors.map(renderItem)}</ul>;
}

export default List;
```

Our app would now render something of the kind:

```html
<div>
  <ul>
    <li>yellow</li>
    <li>blue</li>
    <li>orange</li>
  </ul>
</div>
```

But let's add a new color to the list:

```js
import store from './state';
store.data.colors.push('purple');
```

And the list component will automatically update and to render the following:

```html
<div>
  <ul>
    <li>yellow</li>
    <li>blue</li>
    <li>orange</li>
    <li>purple</li>
  </ul>
</div>
```



### HOC

#### Creating the app's state

Let's create a **store** for our colors:

*state.js*

```js
import Store from '@immutabl3/store';

export default Store({
  colors: ['yellow', 'blue', 'orange']
});
```

#### Exposing the store

Now that the store is created, we should bind our React app to it. Under the hood, this component will simply propagate the store to its descendants using React's context.

*main.jsx*

```jsx
import React from 'react';
import { render } from 'react-dom';
import { root } from '@immutabl3/store/react';
import store from './state';

// we will write this component later
import List from './list.jsx';

// creating our top-level component
const App = () => <List />;

// lets's bind the component to the store through the `root` higher-order component
const RootedApp = root(store, App);

// render the app
render(<RootedApp />, document.querySelector('#mount'));
```

#### Accessing the data

Now that we have "rooted" our top-level `App` component, let's create the component displaying our colors  and branch it from the root data.

*list.jsx*

```jsx
import React from 'react';
import { branch } from '@immutabl3/store/react';

// thanks to the branch, our colors will be passed as props to the component
const List = function({ colors }) {
  const renderItem = color => <li key={color}>{color}</li>;

  return <ul>{colors.map(renderItem)}</ul>;
};

// branch the component by mapping the desired data to cursors
export default branch({
  colors: ['colors'],
}, List);
```

Our app would now render something of the kind:

```html
<div>
  <ul>
    <li>yellow</li>
    <li>blue</li>
    <li>orange</li>
  </ul>
</div>
```

But let's add a new color to the list:

```js
import store from './state';
store.data.colors.push('purple');
```

And the list component will automatically update and to render the following:

```html
<div>
  <ul>
    <li>yellow</li>
    <li>blue</li>
    <li>orange</li>
    <li>purple</li>
  </ul>
</div>
```

#### Dynamically set the list's path using props

Sometimes, you might find yourself needing cursors paths changing along with your component's props.

For instance, given the following state:

*state.js*

```js
import Store from '@immutabl3/store';

export default Store({
  colors: ['yellow', 'blue', 'orange'],
  alternativeColors: ['purple', 'orange', 'black']
});
```

You might want to have a list rendering either one of the colors' lists.

Fortunately, you can do so by passing a function taking the props of the components and returning a valid mapping:

*list.jsx*

```jsx
import React from 'react';
import { branch } from '@immutabl3/store/react';

const List = function({ colors }) {
  const renderItem = color => <li key={color}>{color}</li>;

  return <ul>{colors.map(renderItem)}</ul>;
};

// using a function so that your cursors' path can use the component's props
export default branch(props => {
  return {
    colors: [props.alternative ? 'alternativeColors' : 'colors'],
  };
}, List);
```

## Features

- **Simple**: there's barely anything to learn and no boilerplate code required. Thanks to the usage of [`Proxys`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy) you just have to wrap your state with [`store`](#instantiation), mutate it and retrieve values from it just like if it was a regular object, and listen to changes via [`onChange`](#events) 

- **Framework-agnostic**: Store doesn't make any assuptions about your UI framework of choice and can be used without one

- **[React support](#react)**:  both hooks and HOCs are provided for React (in a separate entry point)



## Philosophy

**Simple APIs**

Because the data is proxied, it doesn't need boilerplate, to confirm to a specific object shape, a class or add a dispatcher to your data. Store just wraps the data and allows you to watch for changes. Simple.

**More than just data**

While many stores only support JSON data or need to comform to a certain structure, the shortcomings of that strategy become transparent: [observables](https://mobx.js.org/refguide/observable.html), [setState](https://github.com/jamiebuilds/unstated#introducing-unstated), [computed data](https://github.com/Yomguithereal/baobab#computed-data-or-monkey-business) etc... Store supports every valid JavaScript object without needing to alter the data/wrapper to accommodate: use getters, functions, maps, promises etc... Everything short of circular references is supported.

**Pure functions**

Functional gets and sets are provided for easy and consistent access to the data - but are entirely optional. 

**Why not using [Baobab](https://github.com/Yomguithereal/baobab), [Redux](https://github.com/reduxjs/redux), [Unstated](https://github.com/jamiebuilds/unstated), [react-easy-state](https://github.com/RisingStack/react-easy-state) etc...?**

No reason. Pick whatever library suites your tastes. We try to keep store as [fast](#benchmarks) and [battle-tested](#tests) as possible.

**Why not using Store?**

If you're targeting older browsers, if Proxy isn't available or you don't want to polyfill your environment.



## Notes

There are two scenarios that store cannot currently handle:

- Circular References: the objects references mutate, however, the watchers may not fire and transactions will likely have incorrect pathing. If you know a way of solving this issue, please send a pull request!
- Array Length: watching an array's length won't trigger updates when the array changes. This may be fixed in a future version



## Test

To run tests:

1. Ensure your environment is up-to-date with the `engines` defined in the [package.json](./package.json)

2. Clone and install the repo

   ```sh
   git clone git@github.com:immutabl3/store.git
   cd store
   npm install
   ```

3. Run the tests

   ```sh
   npm test
   ```

   

## Benchmark

```sh
creation x 647,719 ops/sec ±0.73% (92 runs sampled)
gets: direct access x 257,818 ops/sec ±0.36% (97 runs sampled)
gets: path x 4,860,006 ops/sec ±0.35% (95 runs sampled)
sets: direct access x 159,482 ops/sec ±1.02% (91 runs sampled)
sets: path x 102,501 ops/sec ±0.79% (91 runs sampled)
onChange x 141,635 ops/sec ±0.96% (91 runs sampled)
watch x 88,262 ops/sec ±0.79% (92 runs sampled)
project x 1,243,192 ops/sec ±0.50% (93 runs sampled)
select x 190,039 ops/sec ±0.40% (97 runs sampled)
```



To setup for the benchmarks:

1. Ensure your environment is up-to-date with the `engines` defined in the [package.json](./package.json)

2. Clone and install the repo

   ```sh
   git clone git@github.com:immutabl3/store.git
   cd store
   npm install
   ```

3. Run the build

   ```sh
   npm run build
   ```



There are three benchmark scripts:

- `npm run bench:mark` - Runs benchmarks for store operations and is used to track performance degradation when implementing features
- `npm run bench:compare` - Compares store against similar features in other libraries and was used to test if the store was competitive to alternatives in its early stages. Additions or corrections are welcome.
- `npm run bench:micro` - microbenchmarks for competing implementations and optimizing hotpaths



## Contribution

See [CONTRIBUTING.md](CONTRIBUTING.md)



## License

MIT