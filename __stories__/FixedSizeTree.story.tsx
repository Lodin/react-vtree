/* eslint-disable max-depth */
import {number, withKnobs} from '@storybook/addon-knobs';
import {storiesOf} from '@storybook/react';
import React, {FC} from 'react';
import {
  FixedSizeNodeComponentProps,
  FixedSizeNodeData,
  FixedSizeTree,
  TreeWalker,
  TreeWalkerNext,
} from '../src';

document.body.style.margin = '0';
document.body.style.display = 'flex';
document.body.style.minHeight = '100%';

const root = document.getElementById('root')!;
root.style.margin = '10px 0 0 10px';
root.style.flex = '1';

type TreeNode = Readonly<{
  children: TreeNode[];
  id: number;
  name: string;
}>;

type TreeData = FixedSizeNodeData &
  Readonly<{
    isLeaf: boolean;
    name: string;
    nestingLevel: number;
  }>;

let nodeId = 0;

const createNode = (depth: number = 0): TreeNode => {
  const node: TreeNode = {
    children: [],
    id: nodeId,
    name: `test-${nodeId}`,
  };

  nodeId += 1;

  if (depth === 5) {
    return node;
  }

  for (let i = 0; i < 20; i++) {
    node.children.push(createNode(depth + 1));
  }

  return node;
};

const rootNode = createNode();
const defaultTextStyle = {marginLeft: 10};
const defaultButtonStyle = {fontFamily: 'Courier New'};

type NodeInfo = Readonly<{
  nestingLevel: number;
  node: TreeNode;
}>;

const getNodeData = (
  node: TreeNode,
  nestingLevel: number,
): TreeWalkerNext<TreeData, NodeInfo> => ({
  data: {
    id: node.id.toString(),
    isLeaf: node.children.length === 0,
    isOpenByDefault: true,
    name: node.name,
    nestingLevel,
  },
  node: {nestingLevel, node},
});

function* treeWalker(): ReturnType<TreeWalker<TreeData, NodeInfo>> {
  yield getNodeData(rootNode, 0);

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  while (true) {
    const parent = yield;

    // eslint-disable-next-line @typescript-eslint/prefer-for-of
    for (let i = 0; i < parent.node.children.length; i++) {
      yield getNodeData(parent.node.children[i], parent.nestingLevel + 1);
    }
  }
}

const Node: FC<FixedSizeNodeComponentProps<TreeData>> = ({
  data: {isLeaf, name, nestingLevel},
  isOpen,
  style,
  toggle,
}) => (
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
    <div style={defaultTextStyle}>{name}</div>
  </div>
);

type TreePresenterProps = Readonly<{
  itemSize: number;
}>;

const TreePresenter: FC<TreePresenterProps> = ({itemSize}) => {
  return (
    <FixedSizeTree
      treeWalker={treeWalker}
      itemSize={itemSize}
      height={500}
      width="100%"
    >
      {Node}
    </FixedSizeTree>
  );
};

storiesOf('Tree', module)
  .addDecorator(withKnobs)
  .add('FixedSizeTree', () => (
    <TreePresenter itemSize={number('Row height', 30)} />
  ));
