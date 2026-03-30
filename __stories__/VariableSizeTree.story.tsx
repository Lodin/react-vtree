/* eslint-disable max-depth */
import type { Meta, StoryObj } from '@storybook/react-vite';
import { type FC, useCallback, useEffect, useRef } from 'react';
import { AutoSizer } from 'react-virtualized-auto-sizer';
import {
  VariableSizeTree,
  type TreeWalker,
  type TreeWalkerValue,
  type VariableSizeNodeData,
  type VariableSizeNodePublicState,
} from '../src';
import type { NodeComponentProps } from '../src/Tree';

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

  for (let i = 0; i < 10; i++) {
    node.children.push(createNode(depth + 1));
  }

  return node;
};

const rootNode = createNode();
const defaultGapStyle = { marginLeft: 10 };
const defaultButtonStyle = { fontFamily: 'Courier New' };

const Node: FC<
  NodeComponentProps<ExtendedData, VariableSizeNodePublicState<ExtendedData>>
> = ({
  height,
  data: { isLeaf, name, nestingLevel },
  isOpen,
  resize,
  style,
  setOpen,
  treeData: itemSize,
}) => {
  const canOpen = height <= itemSize;
  const halfSize = itemSize / 2;

  const toggleNodeSize = useCallback(
    () => resize(canOpen ? height + halfSize : height - halfSize, true),
    [canOpen, halfSize, height, resize],
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
          <button
            type="button"
            onClick={() => void setOpen(!isOpen)}
            style={defaultButtonStyle}
          >
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

const TreePresenter: FC<TreePresenterProps> = ({ itemSize }) => {
  const tree = useRef<VariableSizeTree<ExtendedData>>(null);

  const treeWalker = useCallback(
    function* variableTreeWalker(): ReturnType<
      TreeWalker<ExtendedData, NodeMeta>
    > {
      yield getNodeData(rootNode, 0, itemSize);

      // oxlint-disable-next-line typescript/no-unnecessary-condition
      while (true) {
        const parentMeta = yield;

        for (let i = 0; i < parentMeta.node.children.length; i++) {
          yield getNodeData(
            parentMeta.node.children[i]!,
            parentMeta.nestingLevel + 1,
            itemSize,
          );
        }
      }
    },
    [itemSize],
  );

  useEffect(() => {
    void tree.current?.recomputeTree({
      refreshNodes: true,
      useDefaultHeight: true,
    });
  }, [itemSize]);

  return (
    <AutoSizer
      renderProp={({ height }) => (
        <VariableSizeTree
          ref={tree}
          itemData={itemSize}
          treeWalker={treeWalker}
          height={height ?? 0}
          width="100%"
        >
          {Node}
        </VariableSizeTree>
      )}
    />
  );
};

const meta: Meta<typeof TreePresenter> = {
  args: {
    itemSize: 30,
  },
  component: TreePresenter,
  title: 'Tree/VariableSizeTree',
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
