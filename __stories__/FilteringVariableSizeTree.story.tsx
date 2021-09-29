/* eslint-disable max-depth */
import {number, withKnobs} from '@storybook/addon-knobs';
import {storiesOf} from '@storybook/react';
import React, {FC, useState, useCallback, useEffect, useRef} from 'react';
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

  if (depth === 5) {
    return node;
  }

  for (let i = 0; i < 10; i++) {
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
>> = ({data: {isLeaf, name, nestingLevel}, isOpen, style, setOpen}) => {
  return (
    <div
      style={{
        ...style,
        alignItems: 'center',
        background: isLeaf ? '#fdd' : '#ddd',
        display: 'flex',
        marginLeft: nestingLevel * 30 + (isLeaf ? 48 : 0),
      }}
    >
      {!isLeaf && (
        <div>
          <button
            type="button"
            onClick={() => setOpen(!isOpen)}
            style={defaultButtonStyle}
          >
            {isOpen ? '-' : '+'}
          </button>
        </div>
      )}
      <div style={defaultGapStyle}>{name}</div>
    </div>
  );
};

type TreePresenterProps = Readonly<{
  itemSize: number;
}>;

const getNodeData = (
  node: TreeNode,
  nestingLevel: number,
): TreeWalkerValue<ExtendedData, NodeMeta> => ({
  data: {
    defaultHeight: node.children.length === 0 ? 30 : 60,
    id: node.id.toString(),
    isLeaf: node.children.length === 0,
    isOpenByDefault: true,
    name: node.name,
    nestingLevel,
  },
  nestingLevel,
  node,
});

let i = 0;
function filterTree(tree: TreeNode, text: string) {
  if (tree.children.length) {
    const subtree = {
      ...tree,
      children: tree.children
        .map((child) => filterTree(child, text))
        .filter((child) => !!child),
    };

    return subtree.children.length ? subtree : null;
  }

  return tree.name.startsWith(text) ? tree : null;
}

const TreePresenter: FC<TreePresenterProps> = () => {
  const tree = useRef<VariableSizeTree<ExtendedData>>(null);
  const [filter, setFilter] = useState('');
  const filteredRootNode = filterTree(rootNode, filter) || {
    name: 'no results',
    children: [],
    id: 'na',
    nestingLevel: 0,
  };
  i = 0;

  const treeWalker = useCallback(
    function* treeWalker(): ReturnType<TreeWalker<ExtendedData, NodeMeta>> {
      yield getNodeData(filteredRootNode, 0);

      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      while (true) {
        const parentMeta = yield;

        // eslint-disable-next-line @typescript-eslint/prefer-for-of
        for (let i = 0; i < parentMeta.node.children.length; i++) {
          yield getNodeData(
            parentMeta.node.children[i],
            parentMeta.nestingLevel + 1,
          );
        }
      }
    },
    [filteredRootNode],
  );

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    tree.current?.recomputeTree({
      refreshNodes: true,
      useDefaultHeight: true,
    });
    // Important, recompute tree on filter text changing
  }, [filter]);

  return (
    <>
      <label htmlFor="filter">Filter</label>
      <input
        id="filter"
        type="text"
        onChange={(event) => {
          setFilter(event.target.value);
        }}
        value={filter}
      />
      <AutoSizer disableWidth>
        {({height}) => (
          <VariableSizeTree
            ref={tree}
            treeWalker={treeWalker}
            height={height}
            width="100%"
          >
            {Node}
          </VariableSizeTree>
        )}
      </AutoSizer>
    </>
  );
};

storiesOf('Tree', module)
  .addDecorator(withKnobs)
  .add('FilteringVariableSizeTree', () => <TreePresenter />);
