import {boolean, number, withKnobs} from '@storybook/addon-knobs';
import {storiesOf} from '@storybook/react';
import * as React from 'react';
import {AutoSizer} from 'react-virtualized';
import Tree from '.';
import {Node} from './types';

function getRandomInt(min: number, max: number): number {
  // tslint:disable-next-line:insecure-random
  return Math.floor(Math.random() * (max - min)) + min;
}

interface DataNode {
  children: DataNode[];
  id: number;
  name: string;
}

class TreePresenter extends React.PureComponent {
  private id: number = 0;
  private root: DataNode = this.createNode();

  constructor(props: {}, context: any) {
    super(props, context);

    this.nodeGetter = this.nodeGetter.bind(this);
  }

  public render(): JSX.Element {
    return (
      <AutoSizer disableHeight>
        {({width}) => (
          <Tree
            height={500}
            nodeGetter={this.nodeGetter}
            rowHeight={number('rowHeight', 30)}
            width={width}
          />
        )}
      </AutoSizer>
    );
  }

  private createNode(depth: number = 0): DataNode {
    const node: DataNode = {
      children: [],
      id: this.id,
      name: `test-${this.id}`,
    };

    this.id += 1;

    if (depth === 5) {
      return node;
    }

    // tslint:disable-next-line:no-increment-decrement
    for (let i = 0; i < 5; i++) {
      node.children.push(this.createNode(depth + 1));
    }

    return node;
  }

  private * nodeGetter(refresh: boolean): IterableIterator<Node | string> {
    interface StackElement {
      nestingLevel: number;
      node: DataNode;
    }

    const stack = [];

    stack.push({
      nestingLevel: 0,
      node: this.root,
    });

    while (stack.length !== 0) {
      const {node, nestingLevel}: StackElement = stack.pop()!;

      const isOpened = yield refresh ? {
        childrenCount: node.children.length,
        height: boolean('dynamicRowsHeights', false) ? getRandomInt(30, 60) : undefined,
        id: node.id.toString(),
        isOpenedByDefault: false,
        nestingLevel,
        nodeData: node.name,
      } : node.id.toString();

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

storiesOf('Tree', module)
  .addDecorator(withKnobs)
  .add('Default', () => (
    <TreePresenter/>
  ));
