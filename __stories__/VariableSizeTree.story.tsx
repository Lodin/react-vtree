/* eslint-disable max-depth */
import {number, withKnobs} from '@storybook/addon-knobs';
import {storiesOf} from '@storybook/react';
import React, {FC, useCallback, useEffect, useRef} from 'react';
import AutoSizer from 'react-virtualized-auto-sizer';
import {
  TreeWalker,
  TreeWalkerNext,
  VariableSizeNodeComponentProps,
  VariableSizeNodeData,
  VariableSizeTree,
} from '../src';

document.body.style.margin = '0';
document.body.style.display = 'flex';
document.body.style.minHeight = '100vh';

const root = document.getElementById('root')!;
root.style.margin = '10px 0 0 10px';
root.style.flex = '1';

type TreeNode = Readonly<{
  children: TreeNode[];
  id: number;
  name: string;
}>;

type NodeInfo = Readonly<{
  nestingLevel: number;
  node: TreeNode;
}>;

type ExtendedData = VariableSizeNodeData &
  Readonly<{
    isLeaf: boolean;
    name: string;
    nestingLevel: number;
  }>;

let nodeId = 0;

const createNode = (depth: number = 0) => {
  const node: TreeNode = {
    children: [],
    id: nodeId,
    name: `test-${nodeId}`,
  };

  nodeId += 1;

  if (depth === 2) {
    return node;
  }

  for (let i = 0; i < 1000; i++) {
    node.children.push(createNode(depth + 1));
  }

  return node;
};

const rootNode = createNode();
const defaultGapStyle = {marginLeft: 10};
const defaultButtonStyle = {fontFamily: 'Courier New'};

const Node: FC<VariableSizeNodeComponentProps<ExtendedData>> = ({
  height,
  data: {isLeaf, name, nestingLevel},
  isOpen,
  resize,
  style,
  toggle,
  treeData: itemSize,
}) => {
  const canOpen = height <= itemSize;
  const halfSize = itemSize / 2;

  const toggleNodeSize = useCallback(
    () => resize(canOpen ? height + halfSize : height - halfSize, true),
    [height, resize],
  );

  return (
    <div
      style={{
        ...style,
        alignItems: 'center',
        background: canOpen ? undefined : '#ddd',
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
      <div style={defaultGapStyle}>{name}</div>
      <div>
        <button type="button" onClick={toggleNodeSize} style={defaultGapStyle}>
          {canOpen ? 'Open' : 'Close'}
        </button>
      </div>
    </div>
  );
};

type TreePresenterProps = Readonly<{
  itemSize: number;
}>;

const getNodeData = (
  node: TreeNode,
  nestingLevel: number,
  itemSize: number,
): TreeWalkerNext<ExtendedData, NodeInfo> => ({
  data: {
    defaultHeight: itemSize,
    id: node.id.toString(),
    isLeaf: node.children.length === 0,
    isOpenByDefault: true,
    name: node.name,
    nestingLevel,
  },
  node: {nestingLevel, node},
});

const TreePresenter: FC<TreePresenterProps> = ({itemSize}) => {
  const tree = useRef<VariableSizeTree<ExtendedData>>(null);

  const treeWalker = useCallback(
    function* treeWalker(): ReturnType<TreeWalker<ExtendedData, NodeInfo>> {
      yield getNodeData(rootNode, 0, itemSize);

      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      while (true) {
        const parent = yield;

        // eslint-disable-next-line @typescript-eslint/prefer-for-of
        for (let i = 0; i < parent.node.children.length; i++) {
          yield getNodeData(
            parent.node.children[i],
            parent.nestingLevel + 1,
            itemSize,
          );
        }
      }
    },
    [itemSize],
  );

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    tree.current?.recomputeTree({
      refreshNodes: true,
      useDefaultHeight: true,
    });
  }, [itemSize]);

  return (
    <AutoSizer disableWidth>
      {({height}) => (
        <VariableSizeTree
          ref={tree}
          itemData={itemSize}
          treeWalker={treeWalker}
          height={height}
          width="100%"
        >
          {Node}
        </VariableSizeTree>
      )}
    </AutoSizer>
  );
};

storiesOf('Tree', module)
  .addDecorator(withKnobs)
  .add('VariableSizeTree', () => (
    <TreePresenter itemSize={number('Default row height', 30)} />
  ));
