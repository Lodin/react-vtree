import {boolean, number, withKnobs} from '@storybook/addon-knobs';
import {storiesOf} from '@storybook/react';
import * as React from 'react';
import {AutoSizer} from 'react-virtualized';
import Tree from '.';
import {Node} from './types';
import {UpdateType} from './utils';

interface DataNode {
  children: DataNode[];
  id: number;
  name: string;
}

interface TreePresenterProps {
  enableDynamicHeight: boolean;
  rootChildrenHeight: number;
  rowHeight: number;
}

interface TreePresenterState {
  update: UpdateType;
}

class TreePresenter extends React.PureComponent<TreePresenterProps, TreePresenterState> {
  public state: TreePresenterState = {
    update: UpdateType.None,
  };

  private id: number = 0;
  private root: DataNode = this.createNode();

  constructor(props: TreePresenterProps, context: any) {
    super(props, context);

    this.nodeGetter = this.nodeGetter.bind(this);
  }

  public componentWillReceiveProps({
    enableDynamicHeight: nextEnableDynamicHeight,
    rootChildrenHeight: nextRootChildrenHeight,
  }: TreePresenterProps): void {
    const {enableDynamicHeight, rootChildrenHeight} = this.props;

    this.setState({
      update: enableDynamicHeight !== nextEnableDynamicHeight
        || rootChildrenHeight !== nextRootChildrenHeight ? UpdateType.Nodes : UpdateType.None,
    });
  }

  public render(): JSX.Element {
    const {rowHeight} = this.props;
    const {update} = this.state;

    return (
      <AutoSizer disableHeight>
        {({width}) => (
          <Tree
            height={500}
            nodeGetter={this.nodeGetter}
            rowHeight={rowHeight}
            update={update}
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

    const {enableDynamicHeight, rootChildrenHeight} = this.props;

    const stack = [];

    stack.push({
      nestingLevel: 0,
      node: this.root,
    });

    while (stack.length !== 0) {
      const {node, nestingLevel}: StackElement = stack.pop()!;
      const id = node.id.toString();

      const isOpened = yield refresh ? {
        childrenCount: node.children.length,
        height: enableDynamicHeight && nestingLevel === 1 ? rootChildrenHeight : undefined,
        id,
        isOpenedByDefault: true,
        nestingLevel,
        nodeData: node.name,
      } : id;

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
    <TreePresenter
      enableDynamicHeight={boolean('Enable dynamic height', false)}
      rootChildrenHeight={number('Root direct children height', 30)}
      rowHeight={number('Row height', 30)}
    />
  ));
