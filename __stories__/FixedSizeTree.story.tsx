import {number, withKnobs} from '@storybook/addon-knobs';
import {storiesOf} from '@storybook/react';
import * as React from 'react';
import AutoSizer from 'react-virtualized-auto-sizer';
import Tree from '../src/FixedSizeTree';
import {CommonNodeComponentProps, CommonNodeMetadata} from '../src/utils';

document.body.style.margin = '0';
document.body.style.display = 'flex';

const root = document.getElementById('root')!;
root.style.margin = '10px 0 0 10px';
root.style.flex = '1';

interface DataNode {
  children: DataNode[];
  id: number;
  name: string;
}

interface StackElement {
  nestingLevel: number;
  node: DataNode;
}

let nodeId = 0;

const createNode = (depth: number = 0) => {
  const node: DataNode = {
    children: [],
    id: nodeId,
    name: `test-${nodeId}`,
  };

  nodeId += 1;

  if (depth === 5) {
    return node;
  }

  // tslint:disable-next-line:increment-decrement
  for (let i = 0; i < 5; i++) {
    node.children.push(createNode(depth + 1));
  }

  return node;
};

const rootNode = createNode();
const defaultTextStyle = {marginLeft: 10};
const defaultButtonStyle = {fontFamily: 'Courier New'};

function* treeWalker(
  refresh: boolean,
): IterableIterator<CommonNodeMetadata | string | symbol> {
  const stack: StackElement[] = [];

  stack.push({
    nestingLevel: 0,
    node: rootNode,
  });

  while (stack.length !== 0) {
    const {node, nestingLevel} = stack.pop()!;
    const id = node.id.toString();

    const isOpened = yield refresh
      ? {
          childrenCount: node.children.length,
          data: node.name,
          id,
          isOpenByDefault: true,
          nestingLevel,
        }
      : id;

    if (node.children.length !== 0 && isOpened) {
      // tslint:disable-next-line:increment-decrement
      for (let i = node.children.length - 1; i >= 0; i--) {
        stack.push({
          nestingLevel: nestingLevel + 1,
          node: node.children[i],
        });
      }
    }
  }
}

const Node: React.FunctionComponent<CommonNodeComponentProps> = ({
  metadata: {childrenCount, data, nestingLevel},
  isOpen,
  style,
  toggle,
}) => {
  const isLeaf = childrenCount === 0;

  return (
    <div
      style={{
        ...style,
        alignItems: 'center',
        display: 'flex',
        marginLeft: nestingLevel * 30 + (isLeaf ? 48 : 0),
      }}
    >
      {!isLeaf && (
        <div>
          <button type="button" onClick={toggle} style={defaultButtonStyle}>
            {isOpen ? '-' : '+'}
          </button>
        </div>
      )}
      <div style={defaultTextStyle}>{data}</div>
    </div>
  );
};

interface TreePresenterProps {
  readonly itemSize: number;
}

const TreePresenter: React.FunctionComponent<TreePresenterProps> = ({
  itemSize,
}) => (
  <AutoSizer disableWidth>
    {({height}) => (
      <Tree
        treeWalker={treeWalker}
        itemSize={itemSize}
        height={height}
        width="100%"
      >
        {Node}
      </Tree>
    )}
  </AutoSizer>
);

storiesOf('Tree', module)
  .addDecorator(withKnobs)
  .add('FixedSizeTree', () => (
    <TreePresenter itemSize={number('Row height', 30)} />
  ));
