/* eslint-disable max-depth */
import {number, withKnobs} from '@storybook/addon-knobs';
import {storiesOf} from '@storybook/react';
import React, {FC, useCallback, useRef} from 'react';
import AutoSizer from 'react-virtualized-auto-sizer';
import {
  TreeWalker,
  TreeWalkerValue,
  VariableSizeNodeData,
  VariableSizeNodePublicState,
  VariableSizeTree,
} from '../src';
import {NodeComponentProps} from '../src/Tree';

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

type NodeMeta = Readonly<{
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

const Node: FC<NodeComponentProps<
  ExtendedData,
  VariableSizeNodePublicState<ExtendedData>
>> = ({
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

const getNodeData = (
  node: TreeNode,
  nestingLevel: number,
  itemSize: number,
): TreeWalkerValue<ExtendedData, NodeMeta> => ({
  data: {
    defaultHeight: itemSize,
    id: node.id.toString(),
    isLeaf: node.children.length === 0,
    isOpenByDefault: true,
    name: node.name,
    nestingLevel,
  },
  nestingLevel,
  node,
});

type TreePresenterProps = Readonly<{
  itemSize: number;
  placeholder: string;
}>;

const TreePresenter: FC<TreePresenterProps> = ({itemSize, placeholder}) => {
  const tree = useRef<VariableSizeTree<ExtendedData>>(null);

  const treeWalker = useCallback(
    function* treeWalker(): ReturnType<TreeWalker<ExtendedData, NodeMeta>> {
      yield getNodeData(rootNode, 0, itemSize);

      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      while (true) {
        const parentMeta = yield;

        // eslint-disable-next-line @typescript-eslint/prefer-for-of
        for (let i = 0; i < parentMeta.node.children.length; i++) {
          yield getNodeData(
            parentMeta.node.children[i],
            parentMeta.nestingLevel + 1,
            itemSize,
          );
        }
      }
    },
    [itemSize],
  );

  return (
    <AutoSizer disableWidth>
      {({height}) => (
        <VariableSizeTree
          height={height}
          itemData={itemSize}
          placeholder={placeholder.length > 0 ? placeholder : undefined}
          ref={tree}
          treeWalker={treeWalker}
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
  .add('Big data (with placeholder)', () => (
    <TreePresenter
      itemSize={number('Default row height', 30)}
      placeholder="Building a tree..."
    />
  ));
