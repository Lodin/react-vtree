# react-vtree

[![Latest Stable Version](https://img.shields.io/npm/v/react-vtree.svg)](https://www.npmjs.com/package/react-vtree)
[![License](https://img.shields.io/npm/l/react-vtree.svg)](./LICENSE)
[![Build Status](https://img.shields.io/travis/Lodin/react-vtree/master.svg)](https://travis-ci.org/Lodin/react-vtree)
[![Test Coverage](https://img.shields.io/codecov/c/github/Lodin/react-vtree/master.svg)](https://codecov.io/gh/Lodin/react-vtree)

This package provides a lightweight and flexible solution for rendering large
tree structures. It is built on top of the [react-window](https://github.com/bvaughn/react-window)
library.

**Attention!** This library is entirely rewritten to work with the `react-window`. If
you are looking for the tree view solution for the [react-virtualized](https://github.com/bvaughn/react-virtualized),
take a look at [react-virtualized-tree](https://github.com/diogofcunha/react-virtualized-tree).

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

```javascript
import {FixedSizeTree as Tree} from 'react-vtree';

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

function* treeWalker(refresh) {
  const stack = [];

  // Remember all the necessary data of the first node in the stack.
  stack.push({
    nestingLevel: 0,
    node: tree,
  });

  // Walk through the tree until we have no nodes available.
  while (stack.length !== 0) {
    const {
      node: {children = [], id, name},
      nestingLevel,
    } = stack.pop();

    // Here we are sending the information about the node to the Tree component
    // and receive an information about the openness state from it. The
    // `refresh` parameter tells us if the full update of the tree is requested;
    // basing on it we decide to return the full node data or only the node
    // id to update the nodes order.
    const isOpened = yield refresh
      ? {
          id,
          isLeaf: children.length === 0,
          isOpenByDefault: true,
          name,
          nestingLevel,
        }
      : id;

    // Basing on the node openness state we are deciding if we need to render
    // the child nodes (if they exist).
    if (children.length !== 0 && isOpened) {
      // Since it is a stack structure, we need to put nodes we want to render
      // first to the end of the stack.
      for (let i = children.length - 1; i >= 0; i--) {
        stack.push({
          nestingLevel: nestingLevel + 1,
          node: children[i],
        });
      }
    }
  }
}

// Node component receives all the data we created in the `treeWalker` +
// internal openness state (`isOpen`), function to change internal openness
// state (`toggle`) and `style` parameter that should be added to the root div.
const Node = ({data: {isLeaf, name}, isOpen, style, toggle}) => (
  <div style={style}>
    {!isLeaf && (
      <button type="button" onClick={toggle}>
        {isOpen ? '-' : '+'}
      </button>
    )}
    <div>{name}</div>
  </div>
);

const Example = () => (
  <Tree treeWalker={treeWalker} itemSize={30} height={150} width={300}>
    {Node}
  </Tree>
);
```

#### Props

The component receives all the props of the `FixedSizeList` component except for
the `itemCount`. Additional properties are the following:

##### `children`

The `Node` component that is responsible for rendering each node. It receives
all the properties [`Row`](https://react-window.now.sh/#/api/FixedSizeList)
recieves except for the `index` prop plus the following properties:

- `data: object` - a data object yielded by the `treeWalker` function.
- `isOpen: boolean` - a current openness status of the node.
- `toggle(): function` - a function to change the openness state of the node. It
  receives no arguments and can be provided directly as an `onClick` handler.
- `treeData: any` - any data provided via the `itemData` property of the
  `FixedSizeTree` component.

##### `rowComponent: component`

This property receives a custom `Row` component for the `FixedSizeList` that
will override the default one. It can be used for adding new functionality to an
existing one by wrapping the default `Row` into a custom component.

##### `* treeWalker(refresh: boolean)`

An iterator function that walks around the tree and yields each node one by one
flattening them to an array that can be easily displayed by `FixedSizeList`
component.

The function receives `refresh` parameter. If it is `true`, the component
requests the full node update and expects the complete data object yielded. If
it is `false`, the component awaits only the node id to update the order of
displayed nodes.

The data object should contain the following required properties:

- `id` - a unique identifier of the node.
- `isOpenByDefault` - a default openness state of the node.

You can add any other property you need. This object will be sent directly to
the `Node` component.

Yielding the object gets the current openness state of the node. Basing on it,
you should decide if the node's children are going to be rendered.

#### Methods

The component provides all the methods `FixedSizeList` provides with the
following changes:

##### `scrollToItem(id: string | symbol, align?: Align): void`

The `scrollToItem` method receives node `id` instead of `index`.

##### `async recomputeTree(options): void`

This method runs the `treeWalker` function again and, basing on the received
options, updates either nodes or their order.

It receives options object with the following parameters:

- `refreshNodes: boolean` - if this parameter is `true`, `treeWalker` will
  receive `refresh` option, and the component will expect the data object yielded.
  If this parameter is either `false` or not provided, the component will expect
  string id.
- `useDefaultOpenness: boolean` - if this parameter is `true`, openness state of
  all nodes will be reset to `isOpenByDefault`. Nodes updated during the tree
  walking will use the new `isOpenByDefault` value.

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

function* treeWalker(refresh) {
  const stack = [];

  stack.push({
    nestingLevel: 0,
    node: tree,
  });

  while (stack.length !== 0) {
    const {
      node: {children = [], id, name},
      nestingLevel,
    } = stack.pop();

    const isOpened = yield refresh
      ? {
          // The only difference VariableSizeTree `treeWalker` has comparing to
          // the FixedSizeTree is the `defaultHeight` property in the data
          // object.
          defaultHeight: 30,
          id,
          isLeaf: children.length === 0,
          isOpenByDefault: true,
          name,
          nestingLevel,
        }
      : id;

    if (children.length !== 0 && isOpened) {
      for (let i = children.length - 1; i >= 0; i--) {
        stack.push({
          nestingLevel: nestingLevel + 1,
          node: children[i],
        });
      }
    }
  }
}

// Node component receives current node height as a prop
const Node = ({data: {isLeaf, name}, height, isOpen, style, toggle}) => (
  <div style={style}>
    {!isLeaf && (
      <button type="button" onClick={toggle}>
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

The component receives all the props of the `VariableSizeList` component except
for the `itemCount` and `itemSize`. `itemSize` is still available but not
required, and should be used only if the default behavior is not enough.
Additional properties are the following:

##### `children`

The `Node` component. It is the same as the [`FixedSizeTree`](#fixedsizetree)'s
one but receives two additional properties:

- `height: number` - a current height of the node.
- `resize(newHeight: number, shouldForceUpdate?: boolean): function` - a
  function to change the height of the node. It receives two parameters:
  - `newHeight: number` - a new height of the node.
  - `shouldForceUpdate: boolean` - an optional argument that will be sent to the
    [`resetAfterIndex`](https://react-window.now.sh/#/api/VariableSizeList)
    method.

##### `rowComponent: component`

This property receives a custom `Row` component for the `VariableSizeList` that
will override the default one. It can be used for adding new functionality to an
existing one by wrapping the default `Row` into a custom component.

##### `* treeWalker(refresh: boolean)`

An iterator function that walks over the tree. It behaves the same as
`FixedSizeTree`'s `treeWalker`, but there one additional required property for
the data object:

- `defaultHeight: number` - the default height of the node.

#### Methods

The component provides all the methods `VariableSizeList` provides with the
following changes:

##### `scrollToItem(id: string | symbol, align?: Align): void`

The `scrollToItem` method receives node `id` instead of `index`.

##### `resetAfterId(id: string | symbol, shouldForceUpdate: boolean = false): void`

This method replaces the `resetAfterIndex` method of `VariableSizeList`, but
works exactly the same. It receives node `id` as a first argument.

##### `async recomputeTree(options): void`

This method works exactly the same as the `FixedSizeTree`'s one, but receives
one additional option:

- `useDefaultHeight: boolean` - if this parameter is `true`, the height of
  all nodes will be reset to `defaultHeight`. Nodes updated during the tree
  walking will use the new `defaultHeight` value.
