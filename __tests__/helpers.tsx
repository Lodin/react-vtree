// tslint:disable:ban-types

import {mount, ReactWrapper} from 'enzyme';
import * as React from 'react';
import {OverscanIndicesGetter} from 'react-virtualized/dist/es/Grid';
import Tree, {TreeProps} from '../src/Tree';
import {Node, NodeGetter, RowRendererParams} from '../src/types';

export interface SpecNode {
  children: SpecNode[];
  id: string;
  name: string;
}

export interface NodeGetterOptions {
  isOpenedByDefault?: boolean;
  root?: SpecNode;
}

export interface TreeRendererOptions {
  nodeGetter: NodeGetter;
  rowRenderer?: (params: RowRendererParams) => React.ReactElement<any>;
}

export type TreeRenderer = (props?: Partial<TreeProps>) => ReactWrapper<TreeProps, any>;

export type NodeGetterMock = jest.Mock<IterableIterator<Node | string | null>>;

// Override default behavior of overscanning by at least 1 (for accessibility)
// Because it makes simpler tests below
export const overscanIndicesGetter: OverscanIndicesGetter = ({startIndex, stopIndex}) => ({
  overscanStartIndex: startIndex,
  overscanStopIndex: stopIndex,
});

export function createNodeCreator(maxDepth: number = 3): (depth?: number) => SpecNode {
  let id = 0;

  function createNode(depth: number = 0): SpecNode {
    const node: SpecNode = {
      children: [],
      id: id.toString(),
      name: `Name ${id}`,
    };

    id += 1;

    if (depth === maxDepth) {
      return node;
    }

    // tslint:disable-next-line:no-increment-decrement
    for (let i = 0; i < 5; i++) {
      node.children.push(createNode(depth + 1));
    }

    return node;
  }

  return createNode;
}

export function createNodeGetter({
  isOpenedByDefault = true,
  root = createNodeCreator()(),
}: NodeGetterOptions = {}): NodeGetter {
  // tslint:disable-next-line:no-function-expression
  return function* nodeGetter(refresh: boolean): IterableIterator<Node | string | null> {
    interface StackElement {
      node: SpecNode;
      nestingLevel: number;
    }

    const stack = [];

    stack.push({
      nestingLevel: 0,
      node: root,
    });

    while (stack.length !== 0) {
      const {node, nestingLevel}: StackElement = stack.pop()!;

      const isOpened = yield (
        refresh ? {
          childrenCount: node.children.length,
          id: node.id,
          isOpenedByDefault,
          nestingLevel,
          nodeData: node.name,
        } : node.id
      );

      if (node.children.length !== 0 && isOpened) {
        // tslint:disable-next-line:no-increment-decrement
        for (let i = node.children.length - 1; i >= 0; i--) {
          stack.push({
            nestingLevel: nestingLevel + 1,
            node: node.children[i],
          });
        }
      }
    }
  }
}

function defaultRowRenderer({key, isOpened, nodeData, onNodeToggle, style}: RowRendererParams): React.ReactElement<any> {
  return (
    <div className="treeNode" key={key} style={style}>
      <button onClick={onNodeToggle}>{isOpened ? '[-]' : '[+]'}</button>
      <span>{String(nodeData)}</span>
    </div>
  );
}

export function createTreeRenderer({
  nodeGetter,
  rowRenderer = defaultRowRenderer,
}: TreeRendererOptions): (props?: Partial<TreeProps>) => ReactWrapper<TreeProps, any> {
  return (props = {}) => mount(
    <Tree
      height={100}
      overscanIndicesGetter={overscanIndicesGetter}
      overscanRowCount={0}
      nodeGetter={nodeGetter}
      rowRenderer={rowRenderer}
      rowHeight={10}
      width={100}
      {...props}
    />,
  );
}
