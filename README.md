# react-vtree

[![Latest Stable Version](https://img.shields.io/npm/v/react-vtree.svg)](https://www.npmjs.com/package/react-vtree)
[![License](https://img.shields.io/npm/l/react-vtree.svg)](./LICENSE)
[![CI Status](https://github.com/Lodin/react-vtree/workflows/CI/badge.svg)](https://github.com/Lodin/react-vtree/actions)
[![Coverage](https://sonarcloud.io/api/project_badges/measure?project=Lodin_react-vtree&metric=coverage)](https://sonarcloud.io/dashboard?id=Lodin_react-vtree)
[![Bugs](https://sonarcloud.io/api/project_badges/measure?project=Lodin_react-vtree&metric=bugs)](https://sonarcloud.io/dashboard?id=Lodin_react-vtree)
[![Vulnerabilities](https://sonarcloud.io/api/project_badges/measure?project=Lodin_react-vtree&metric=vulnerabilities)](https://sonarcloud.io/dashboard?id=Lodin_react-vtree)

This package provides a lightweight and flexible solution for rendering large tree structures. It is built on top of the [react-window](https://github.com/bvaughn/react-window) library.

**Attention!** This library is entirely rewritten to work with the `react-window`. If you are looking for the tree view solution for the [react-virtualized](https://github.com/bvaughn/react-virtualized), take a look at [react-virtualized-tree](https://github.com/diogofcunha/react-virtualized-tree).

**NOTE**: This is the documentation for version `3.x.x`. For version `2.x.x` see [this branch](https://github.com/Lodin/react-vtree/tree/version/2).

## Installation

```bash
# npm
npm i react-window react-vtree

# Yarn
yarn add react-window react-vtree
```

## Usage

### `FixedSizeTree`

#### Example

You can also take a look at the very similar example at the Storybook:

- [Source code](./__stories__/FixedSizeTree.story.tsx)
- [Demo](https://lodin.github.io/react-vtree/index.html?path=/story/tree--fixedsizetree)

```js
import {FixedSizeTree as Tree} from 'react-vtree';

// Tree component can work with any possible tree structure because it uses an
// iterator function that the user provides. Structure, approach, and iterator
// function below is just one of many possible variants.
const treeNodes = [
  {
    name: 'Root #1',
    id: 'root-1',
    children: [
      {
        children: [
          {id: 'child-2', name: 'Child #2'},
          {id: 'child-3', name: 'Child #3'},
        ],
        id: 'child-1',
        name: 'Child #1',
      },
      {
        children: [{id: 'child-5', name: 'Child #5'}],
        id: 'child-4',
        name: 'Child #4',
      },
    ],
  },
  {
    name: 'Root #2',
    id: 'root-2',
  },
];

// This helper function constructs the object that will be sent back at the step
// [2] during the treeWalker function work. Except for the mandatory `data`
// field you can put any additional data here.
const getNodeData = (node, nestingLevel) => ({
  data: {
    id: node.id.toString(), // mandatory
    isLeaf: node.children.length === 0,
    isOpenByDefault: true, // mandatory
    name: node.name,
    nestingLevel,
  },
  nestingLevel,
  node,
});

// The `treeWalker` function runs only on tree re-build which is performed
// whenever the `treeWalker` prop is changed.
function* treeWalker() {
  // Step [1]: Define the root node of our tree. There can be one or
  // multiple nodes.
  for (let i = 0; i < treeNodes.length; i++) {
    yield getNodeData(treeNodes[i], 0);
  }

  while (true) {
    // Step [2]: Get the parent component back. It will be the object
    // the `getNodeData` function constructed, so you can read any data from it.
    const parent = yield;

    for (let i = 0; i < parent.node.children.length; i++) {
      // Step [3]: Yielding all the children of the provided component. Then we
      // will return for the step [2] with the first children.
      yield getNodeData(parent.node.children[i], parent.nestingLevel + 1);
    }
  }
}

// Node component receives all the data we created in the `treeWalker` +
// internal openness state (`isOpen`), function to change internal openness
// state (`setOpen`) and `style` parameter that should be added to the root div.
const Node = ({data: {isLeaf, name}, isOpen, style, setOpen}) => (
  <div style={style}>
    {!isLeaf && (
      <button type="button" onClick={() => setOpen(!isOpen)}>
        {isOpen ? '-' : '+'}
      </button>
    )}
    <div>{name}</div>
  </div>
);

ReactDOM.render(
  <Tree treeWalker={treeWalker} itemSize={30} height={150} width={300}>
    {Node}
  </Tree>,
  document.querySelector('#root'),
);
```

#### Props

##### Props inherited from `FixedSizeList`

You can read more about these properties in the [`FixedSizeList` documentation](https://react-window.now.sh/#/api/FixedSizeList).

- <del>`children: component`</del>. Uses own implementation, see [below](#children).
- `className: string = ""`
- `direction: strig = "ltr"`
- `height: strig | number`
- `initialScrollOffset: number = 0`
- `innerRef: function | createRef object`. This property works as it described in the `react-window`. For getting a `FixedSizeList` reference use `listRef`.
- `innerElementType: React.ElementType = "div"`
- <del>`innerTagName: string`</del>. Deprecated by `react-window`.
- `itemData: any`
- <del>`itemKey: function`</del>. Handled internally.
- `itemSize: number`
- `layout: string = "vertical"`
- `onItemsRendered: function`
- `onScroll: function`
- `outerRef: function | createRef object`
- `outerElementType: React.ElementType = "div"`
- <del>`outerTagName: string`</del>. Deprecated by `react-window`.
- `overscanCount: number = 1`
- `style: object = null`
- `useIsScrolling: boolean = false`
- `width: number | string`

##### `async: boolean`

This option allows making the tree asynchronous; e.g. you will be able to load the branch data on the node opening. All it does under the hood is preserving the tree state between tree buildings on `treeWalker` update, so the user does not see the tree resetting to the default state when the async action is performed.

To see how it works you can check the [`AsyncData`](./__stories__/AsyncData.story.tsx) story. You can use the `disableAsync` to see what will happen on the async action if the `async` prop is `false`.

If it is combined with the `placeholder` option, the tree re-building won't be interrupted by showing the placeholder; it will be shown only at the first time the tree is building.

To see how two options interact with each other see the [`AsyncDataIdle`](./__stories__/AsyncDataIdle.story.tsx) story.

##### `children: component`

The `Node` component responsible for rendering each node.

It receives the following props:

- Inherited from `react-window`'s `Row` component:
  - `style: object`
  - `isScrolling: boolean` - if `useIsScrolling` is enabled.
- `Node`-specific props:

  - All fields of the [`FixedSizeNodePublicState`](#types) object.
  - `treeData: any` - any data provided via the `itemData` property of the `FixedSizeTree` component.

##### `placeholder: ReactNode | null`

This property receives any react node that will be displayed instead of a tree during the building process. This option should only be used if the tree building process requires too much time (which means you have a really giant amount of data, e.g. about a million nodes).

Setting this option enables the [`requestIdleCallback`](https://developer.mozilla.org/en-US/docs/Web/API/Window/requestIdleCallback) under the hood for browsers that support this feature. For other browsers the original scenario is applied; no placeholder will be shown.

Using this feature allows avoiding UI freezes; however, it may slightly increase the time spent for the building process.

To see how it works, you can check the [BigData](./__stories__/BigData.story.tsx) story. Use `placeholder` tool to add and remove placeholder.

If you have an asynchronous giant tree and want to use profits of `requestIdleCallback` but don't want placeholder to be shown on the first render (that is probably quite small because all other data will be loaded asynchronously), set `placeholder` to `null`. No placeholder will be shown on the first render but the `requestIdleCallback` building will be enabled and allow avoiding freezes on tree re-building when tree becomes bigger.

To see how it works you can check the [AsyncDataIdle](./__stories__/AsyncDataIdle.story.tsx) story. It uses the `null` placeholder, so no text is shown for the first build but async requests don't block the UI.

##### `buildingTaskTimeout: number`

This option works in tandem with the `placeholder` option. With it, you can set the task timeout for the `requestIdleCallback`. The `buildingTaskTimeout` will be sent directly as the `requestIdleCallback`'s `timeout` option.

##### `listRef: Ref<FixedSizeList>`

This option allows you to get the instance of the internal `react-window` list. It is usually unnecessary because all necessary methods are already provided but still can be useful for edge cases.

##### `rowComponent: component`

This property receives a custom `Row` component for the `FixedSizeList` that will override the default one. It can be used for adding new functionality.

`Row` component receives the following props:

- `index: number`
- `data: object` - the data tree component provides to `Row`. It contains the following data:
  - `component: component` - a `Node` component to create a React element from.
  - `getRecordData: function` - a function that gets the record data by `index`. It returns a [`FixedSizeNodePublicState`](#types) object.
  - `treeData: any` - any data provided via the `itemData` property of the `FixedSizeTree` component.
- `style: object`
- `isScrolling: boolean`

##### `* treeWalker()`

An iterator function that walks around the tree and yields node data to build an inner representation of the tree. For algorithm details, see [TreeWalker](#treewalker-3) section.

The `treeWalker` function should yield the object of the following shape:

- `data: FixedSizeNodeData` - this field is mandatory. See [`FixedSizeNodeData` type](#types) for the shape.
- `...` - you can add any other data to this object. It will be sent directly to the `treeWalker` at the step [2] of the execution.

Tree is re-computed on each `treeWalker` change. To avoid unnecessary tree re-computation keep the `treeWalker` memoized (e.g. with `useCallback` hook). If you want to update tree data, send the new version of `treeWalker` to the tree component.

Note that when `treeWalker` is updated no internal state will be shared with the new tree. Everything will be built from scratch.

#### Methods

The component provides the following methods.

##### `scrollToItem(id: string | symbol, align?: Align): void`

The `scrollToItem` method behaves the same as `scrollToItem` from `FixedSizeList` but receives node `id` instead of `index`.

##### `async recomputeTree(state): void`

This method starts the tree traversing to update the internal state of nodes.

It receives `state` object that contains nodes' `id` as keys and update rules as values. Each record traverses a subtree of the specified node (also "owner node") and does not affect other nodes (it also means that if you specify the root node the whole tree will be traversed).

The rules object has the following shape:

- `open: boolean` - this rule changes the openness state for the owner node only (subtree nodes are not affected).
- `subtreeCallback(node: object, ownerNode: object): void` - this callback runs against each node in the subtree of the owner node (including the owner node as well). It receives the subtree node and the owner node. Changing any property of the subtree node will affect the node state and how it will be displayed (e.g. if you change the node openness state it will be displayed according to the changed state).

The order of rules matters. If you specify the child node rules before the parent node rules, and that rules affect the same property, the parent node `subtreeCallback` will override that property. So if you want to override parent's rules, place children rules after the parent's.

The type of the node objects received by `subtreeCallback` is `FixedSizeNodePublicState`. See the [types description](#types) below.

##### `recomputeTree` example

```js
// The tree
const tree = {
  name: 'Root #1',
  id: 'root-1',
  children: [
    {
      children: [
        {id: 'child-2', name: 'Child #2'},
        {id: 'child-3', name: 'Child #3'},
      ],
      id: 'child-1',
      name: 'Child #1',
    },
    {
      children: [{id: 'child-5', name: 'Child #5'}],
      id: 'child-4',
      name: 'Child #4',
    },
  ],
};

// recomputeTree

tree.recomputeTree({
  'root-1': {
    open: false,
    subtreeCallback(node, ownerNode) {
      // Since subtreeCallback affects the ownerNode as well, we can check if the
      // nodes are the same, and run the action only if they aren't
      if (node !== ownerNode) {
        // All nodes of the tree will be closed
        node.isOpen = false;
      }
    },
  },
  // But we want `child-4` to be open
  'child-4': true,
});
```

#### Types

- `FixedSizeNodeData` - value of the `data` field of the object yielded by the `treeWalker` function. The shape is the following:
  - `id` - a unique identifier of the node.
  - `isOpenByDefault` - a default openness state of the node.
  - `...` - you can add any number of additional fields to this object. This object without any change will be sent directly to the `Node` component. You can also use `getRecordData` function to get this object along with the other record data by the index. To describe that data, you have to create a new type that extends the `FixedSizeNodeData` type.
- `FixedSizeNodePublicState<TData extends FixedSizeNodeData>` - the node state available for the `Node` component and `recomputeTree`'s `subtreeCallback` function. It has the following shape:
  - `data: FixedSizeNodeData`.
  - `isOpen: boolean` - a current openness status of the node.
  - `setOpen(state: boolean): function` - a function to change the openness state of the node. It receives the new openness state as a `boolean` and opens/closes the node accordingly.
- `FixedSizeTreeProps<TData extends FixedSizeNodeData>` - props that `FixedSizeTree` component receives. Described in the [Props](#props) section.
- `FixedSizeTreeState<TData extends FixedSizeNodeData>` - state that `FixedSizeTree` component has.

### `VariableSizeTree`

#### Example

You can also take a look at the very similar example at the Storybook:

- [Source code](./__stories__/VariableSizeTree.story.tsx)
- [Demo](https://lodin.github.io/react-vtree/index.html?path=/story/tree--variablesizetree)

```javascript
import {VariableSizeTree as Tree} from 'react-vtree';

// Tree component can work with any possible tree structure because it uses an
// iterator function that the user provides. Structure, approach, and iterator
// function below is just one of many possible variants.
const tree = {
  name: 'Root #1',
  id: 'root-1',
  children: [
    {
      children: [
        {id: 'child-2', name: 'Child #2'},
        {id: 'child-3', name: 'Child #3'},
      ],
      id: 'child-1',
      name: 'Child #1',
    },
    {
      children: [{id: 'child-5', name: 'Child #5'}],
      id: 'child-4',
      name: 'Child #4',
    },
  ],
};

// This helper function constructs the object that will be sent back at the step
// [2] during the treeWalker function work. Except for the mandatory `data`
// field you can put any additional data here.
const getNodeData = (node, nestingLevel) => ({
  data: {
    defaultHeight: itemSize, // mandatory
    id: node.id.toString(), // mandatory
    isLeaf: node.children.length === 0,
    isOpenByDefault: true, // mandatory
    name: node.name,
    nestingLevel,
  },
  nestingLevel,
  node,
});

// The `treeWalker` function runs only on tree re-build which is performed
// whenever the `treeWalker` prop is changed.
function* treeWalker() {
  // Step [1]: Define the root node of our tree. There can be yielded one or
  // multiple nodes.
  yield getNodeData(tree, 0);

  while (true) {
    // Step [2]: Get the parent component back. It will be the object
    // the `getNodeData` function constructed, so you can read any data from it.
    const parent = yield;

    for (let i = 0; i < parent.node.children.length; i++) {
      // Step [3]: Yielding all the children of the provided component. Then we
      // will return for the step [2] with the first children.
      yield getNodeData(parent.node.children[i], parent.nestingLevel + 1);
    }
  }
}

// Node component receives current node height as a prop
const Node = ({data: {isLeaf, name}, height, isOpen, style, setOpen}) => (
  <div style={style}>
    {!isLeaf && (
      <button type="button" onClick={() => setOpen(!isOpen)}>
        {isOpen ? '-' : '+'}
      </button>
    )}
    <div>{name}</div>
  </div>
);

const Example = () => (
  <Tree treeWalker={treeWalker} height={150} width={300}>
    {Node}
  </Tree>
);
```

#### Props

##### Props inherited from `VariableSizeList`

You can read more about these properties in the [`VariableSizeList` documentation](https://react-window.now.sh/#/api/VariableSizeList).

Since `VariableSizeList` in general inherits properties from the `FixedSizeList`, everything described in the [same section](#props-inherited-from-fixedsizelist) for `FixedSizeTree` affects this section. For the rest, there are the following changes:

- `estimatedItemSize: number = 50`
- `itemSize: (index: number) => number`. This property is optional. If it is not provided, the `defaultHeight` of the specific node will be used. Advanced property; prefer using node state for it.

##### `children`

The `Node` component. It is the same as the [`FixedSizeTree`](#fixedsizetree)'s one but receives properties from the [`VariableSizeNodePublicState`](#types-1) object.

##### `listRef: Ref<VariableSizeList>`

Same as [`listRef`](#listref-reffixedsizelist) of `FixedSizeTree`.

##### `rowComponent: component`

See [`rowComponent`](#rowcomponent-component) in the `FixedSizeTree` section; the `getRecordData` returns the [`VirtualSizeNodePublicState`](#types-1) object.

##### `* treeWalker(refresh: boolean)`

An iterator function that walks over the tree. It behaves the same as `FixedSizeTree`'s `treeWalker`. The `data` object should be in the [`VariableSizeNodeData`](#types-1) shape.

#### Methods

The component provides the following methods:

##### `scrollToItem(id: string | symbol, align?: Align): void`

The `scrollToItem` method behaves the same as `scrollToItem` from `VariableSizeList` but receives node `id` instead of `index`.

##### `resetAfterId(id: string | symbol, shouldForceUpdate: boolean = false): void`

This method replaces the `resetAfterIndex` method of `VariableSizeList` but works exactly the same. It receives node `id` as a first argument.

##### `async recomputeTree(state): void`

See `FixedSizeTree`'s [`recomputeTree`](#async-recomputetreestate-void) description. There are no differences.

#### Types

All types in this section are the extended variants of [`FixedSizeTree` types](#types).

- `VariableSizeNodeData` - this object extends [`FixedSizeNodeData`](#types) and contains the following additional fields:
  - `defaultHeight: number` - the default height the node will have.
- `VariableSizeNodePublicState<TData extends VariableSizeNodeData>`. The node state object. Extends the [`FixedSizeNodePublicState`](#types) and contains the following additional fields:
  - `height: number` - the current height of the node. The node will be displayed with this height.
  - `resize(newHeight: number, shouldForceUpdate?: boolean): function` - a function to change the height of the node. It receives two parameters:
    - `newHeight: number` - a new height of the node.
    - `shouldForceUpdate: boolean` - an optional argument that will be sent directly to the [`resetAfterIndex`](https://react-window.now.sh/#/api/VariableSizeList) method.
- `VariableSizeTreeProps<T extends VariableSizeNodeData>`.
- `VariableSizeTreeState<T extends VariableSizeNodeData>`.

### TreeWalker algorithm

The `treeWalker` algorithm works in the following way. During the execution, the `treeWalker` function sends a bunch of objects to the tree component which builds an internal representation of the tree. However, for it, the specific order of yieldings should be performed.

1. The first yielding is always root nodes. They will be the foundation of the whole tree.
2. Now start a loop where you will receive the parent node and yield all the children of it.
3. The first yielding of loop iteration should yield an `undefined`. In exchange, you will receive a node for which you should yield all the children in the same way you've done with the root ones.
4. When all the children are yielded, and the new iteration of loop is started, you yield `undefined` again and in exchange receive the next node. It may be:
   - a child node if the previous node has children;
   - a sibling node if it has siblings;
   - a sibling of the elder node.
5. When the whole tree is finished and algorithm reaches the end, the loop stops. You don't have to finish `treeWalker`'s loop manually.

The example of this algorithm is the following `treeWalker` function:

```js
function* treeWalker() {
  // Here we start our tree by yielding the data for the root node.
  yield getNodeData(rootNode, 0);

  while (true) {
    // Here in the loop we receive the next node whose children should be
    // yielded next.
    const parent = yield;

    for (let i = 0; i < parent.node.children.length; i++) {
      // Here we go through the parent's children and yield them to the tree
      // component
      yield getNodeData(parent.node.children[i], parent.nestingLevel + 1);
      // Then the loop iteration is over, and we are going to our next parent
      // node.
    }
  }
}
```

## Migrating `2.x.x` -> `3.x.x`

If you use `react-vtree` of version 2, it is preferable migrate to the version 3. The third version is quite different under the hood and provides way more optimized approach to the initial tree building and tree openness state change. The most obvious it becomes if you have a giant tree (with about 1 million of nodes).

To migrate to the new version, you have to do the following steps.

### 1. Migrate `treeWalker`

The `treeWalker` was and is the heart of the `react-vtree`. However, now it looks a bit different.

Old `treeWalker` worked for both initial tree building and changing node openness state:

```js
function* treeWalker(refresh) {
  const stack = [];

  stack.push({
    nestingLevel: 0,
    node: rootNode,
  });

  // Go through all the nodes adding children to the stack and removing them
  // when they are processed.
  while (stack.length !== 0) {
    const {node, nestingLevel} = stack.pop();
    const id = node.id.toString();

    // Receive the openness state of the node we are working with
    const isOpened = yield refresh
      ? {
          id,
          isLeaf: node.children.length === 0,
          isOpenByDefault: true,
          name: node.name,
          nestingLevel,
        }
      : id;

    if (node.children.length !== 0 && isOpened) {
      for (let i = node.children.length - 1; i >= 0; i--) {
        stack.push({
          nestingLevel: nestingLevel + 1,
          node: node.children[i],
        });
      }
    }
  }
}
```

The new `treeWalker` is only for the tree building. The `Tree` component builds and preserves the tree structure internally. See the full description [above](#treewalker-algorithm).

```js
// This function prepares an object for yielding. We can yield an object
// that has `data` object with `id` and `isOpenByDefault` fields.
// We can also add any other data here.
const getNodeData = (node, nestingLevel) => ({
  data: {
    id: node.id.toString(),
    isLeaf: node.children.length === 0,
    isOpenByDefault: true,
    name: node.name,
    nestingLevel,
  },
  nestingLevel,
  node,
});

function* treeWalker() {
  // Here we send root nodes to the component.
  for (let i = 0; i < rootNodes.length; i++) {
    yield getNodeData(rootNodes[i], 0);
  }

  while (true) {
    // Here we receive an object we created via getNodeData function
    // and yielded before. All we need here is to describe its children
    // in the same way we described the root nodes.
    const parentMeta = yield;

    for (let i = 0; i < parentMeta.node.children.length; i++) {
      yield getNodeData(
        parentMeta.node.children[i],
        parentMeta.nestingLevel + 1,
      );
    }
  }
}
```

### 2. Migrate tree components

Components haven't been changed a lot but you may want to add new features like:

- [`async`](#async-boolean)
- [`placeholder`](#placeholder-reactnode--null)
- [`buildingTaskTimeout`](#buildingtasktimeout-number).

### 3. Migrate `recomputeTree` method

The `recomputeTree` method now receives a list of nodes to change (previously, it was an `opennessState` object). See the full description [above](#async-recomputetreestate-void).

The most important change is the introduction of the `subtreeCallback`. It is a function that will be applied to each node in the subtree of the specified node. Among other useful things it also allows imitating the behavior of old `useDefaultOpenness` and `useDefaultHeight` options.

Old `recomputeTree`:

```js
treeInstance.recomputeTree({
  opennessState: {
    'node-1': true,
    'node-2': true,
    'node-3': false,
  },
  refreshNodes: true,
  useDefaultOpenness: false,
});
```

New `recomputeTree`:

```js
treeInstance.recomputeTree({
  'node-1': true,
  'node-2': {
    open: true,
    subtreeCallback(node, ownerNode) {
      if (node !== ownerNode) {
        node.isOpen = false;
      }
    },
  },
  'node-3': false,
});
```

### 4. Migrate all your `toggle()` calls to `setOpen(boolean)`

In the `3.x.x` version node provides a `setOpen` function instead of `toggle` that allows more fine-grained control over the openness state.

Old `toggle`:

```javascript
const Node = ({data: {isLeaf, name}, isOpen, style, toggle}) => (
  <div style={style}>
    {!isLeaf && (
      <div>
        <button onClick={toggle}>{isOpen ? '-' : '+'}</button>
      </div>
    )}
    <div>{name}</div>
  </div>
);
```

New `setOpen`:
```javascript
const Node = ({data: {isLeaf, name}, isOpen, style, setOpen}) => (
  <div style={style}>
    {!isLeaf && (
      <div>
        // Imitating the old `toggle` function behavior
        <button onClick={() => setOpen(!isOpen)}>{isOpen ? '-' : '+'}</button>
      </div>
    )}
    <div>{name}</div>
  </div>
);
```

### 5. Migrate all your IDs to string

Using node IDs as keys should improve React rendering performance. However, it means that you won't be able to use `Symbol` as IDs anymore. You should move all your IDs to be strings instead of symbols.
