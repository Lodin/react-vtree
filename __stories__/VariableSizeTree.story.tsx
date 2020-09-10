/* eslint-disable max-depth */
import {number, withKnobs} from '@storybook/addon-knobs';
import {storiesOf} from '@storybook/react';
import React, {FC, useCallback, useEffect, useRef} from 'react';
import AutoSizer from 'react-virtualized-auto-sizer';
import {
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

type DataNode = Readonly<{
  children: DataNode[];
  id: number;
  name: string;
}>;

type TreeElement = Readonly<{
  nestingLevel: number;
  node: DataNode;
}> & {
  child: TreeElement | null;
  parent: TreeElement | null;
  sibling: TreeElement | null;
  visited: boolean;
};

type ExtendedData = VariableSizeNodeData &
  Readonly<{
    isLeaf: boolean;
    name: string;
    nestingLevel: number;
  }>;

let nodeId = 0;

const createNode = (depth: number = 0) => {
  const node: DataNode = {
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

const TreePresenter: FC<TreePresenterProps> = ({itemSize}) => {
  const tree = useRef<VariableSizeTree<ExtendedData>>(null);

  const treeWalker = useCallback(
    function* treeWalker(
      refresh: boolean,
    ): Generator<ExtendedData | string, void, boolean> {
      let current: TreeElement | null = {
        child: null,
        nestingLevel: 0,
        node: rootNode,
        parent: null,
        sibling: null,
        visited: false,
      };

      do {
        if (!current.visited) {
          const {node, nestingLevel} = current;
          const id = node.id.toString();

          const isOpened = yield refresh
            ? {
                defaultHeight: itemSize,
                id,
                isLeaf: node.children.length === 0,
                isOpenByDefault: true,
                name: node.name,
                nestingLevel,
              }
            : id;

          if (node.children.length !== 0 && (refresh || isOpened)) {
            let temp: TreeElement = current;

            for (let i = 0; i < node.children.length - 1; i++) {
              const child: TreeElement = {
                child: null,
                nestingLevel: nestingLevel + 1,
                node: node.children[i],
                parent: current,
                sibling: null,
                visited: false,
              };

              if (temp === current) {
                temp.child = child;
              } else {
                temp.sibling = child;
              }

              temp = child;
            }
          }

          current.visited = true;
          current = current.child ?? current.sibling ?? current.parent;
        } else {
          current = current.sibling ?? current.parent;
        }
      } while (current !== null);
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
