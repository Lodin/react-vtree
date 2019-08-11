import {number, withKnobs} from '@storybook/addon-knobs';
import {storiesOf} from '@storybook/react';
import * as React from 'react';
import AutoSizer from 'react-virtualized-auto-sizer';
import Tree, {
  VariableSizeNodeComponentProps,
  VariableSizeNodeMetadata,
} from '../src/VariableSizeTree';

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
const defaultGapStyle = {marginLeft: 10};
const defaultButtonStyle = {fontFamily: 'Courier New'};

const Node: React.FunctionComponent<VariableSizeNodeComponentProps> = ({
  data: itemSize,
  height,
  metadata: {childrenCount, data, nestingLevel},
  isOpen,
  resize,
  style,
  toggle,
}) => {
  const isLeaf = childrenCount === 0;
  const canOpen = height <= itemSize;
  const halfSize = itemSize / 2;

  const toggleNodeSize = React.useCallback(
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
      <div style={defaultGapStyle}>{data}</div>
      <div>
        <button type="button" onClick={toggleNodeSize} style={defaultGapStyle}>
          {canOpen ? 'Open' : 'Close'}
        </button>
      </div>
    </div>
  );
};

interface TreePresenterProps {
  itemSize: number;
}

const TreePresenter: React.FunctionComponent<TreePresenterProps> = ({
  itemSize,
}) => {
  const tree = React.useRef<Tree>(null);

  const treeWalker = React.useCallback(
    function*(
      refresh: boolean,
    ): IterableIterator<VariableSizeNodeMetadata | string | symbol | null> {
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
              defaultHeight: itemSize,
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
    },
    [itemSize],
  );

  React.useEffect(() => {
    if (tree.current) {
      tree.current!.recomputeTree({refreshNodes: true, useDefaultHeight: true});
    }
  }, [itemSize]);

  return (
    <AutoSizer disableWidth>
      {({height}) => (
        <Tree
          ref={tree}
          itemData={itemSize}
          treeWalker={treeWalker}
          height={height}
          width="100%"
        >
          {Node}
        </Tree>
      )}
    </AutoSizer>
  );
};

storiesOf('Tree', module)
  .addDecorator(withKnobs)
  .add('VariableSizeTree', () => (
    <TreePresenter itemSize={number('Default row height', 30)} />
  ));
