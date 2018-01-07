# react-vtree

This component is designed as a basic solution for rendering huge tree structures without affecting performance. Under
the hood it uses [react-virtualized](https://github.com/bvaughn/react-virtualized) library and also can be considered
as a part of this library.

### Terminology
* **Node** - basic structure element of tree. Nodes nested in each other form tree structure.
* **Row** - single line of virtualized list that contains one node and a margin showing nesting level of the node. Row
can also contain a button to toggle visibility of the node's children. 

### Prop Types
| Property | Type | Required? | Description |
|----------|----------|:--------:|----------|
| autoHeight | Boolean |  | Removes fixed height from the `scrollingContainer` so that the total height of rows can stretch the window. Intended for use with `WindowScroller` HOC. |
| className | String |  | Optional CSS class name. |
| controlClassName | String |  | Optional CSS class for all toggle controls. |
| controlStyle | Object |  | Optional inline styles for all toggle controls. |
| estimatedRowSize | Number |  | Used to estimate the total height of a Tree before all of its rows have actually been measured. The estimated total height is adjusted as rows are rendered. |
| height | Number | ✓ | Sets height of a container Tree is rendered inside of. It also determines how many actual rows are rendered. |
| id | String |  | Custom HTML id |
| nodeGetter | Function | ✓ | Generator flattens tree data to display it in a list form basing on information of nodes' openness. It should yield node metadata or node id depending on boolean `refresh` parameter it receives. |
| nodeNestingMultiplier | Number |  | Multiplier for a margin that depends on node's nesting level. E.g. if multiplier is 10 margin for node with nesting level 2 will be 20px and for node with nesting level 3 - 30px. |
| noRowsRenderer | Function |  | Optional renderer to be used in place of rows when tree is empty. |
| onRowClick | Function |  | Callback invoked when a user clicks on a node |
| onRowDoubleClick | Function |  | Callback invoked when a user double-clicks on a node |
| onRowMouseOut | Function |  | Callback invoked when the mouse leaves a node |
| onRowMouseOver | Function |  | Callback invoked when a user moves the mouse over a node |
| onRowRightClick | Function |  | Callback invoked when a user right-clicks on a node |
| onRowsRendered | Function |  | Callback invoked with information about the slice of rows that were just rendered |
| onScroll | Function |  | Callback invoked whenever the scroll offset changes within the inner scrollable region. This callback can be used to sync scrolling between lists, tables, or grids. |
| overscanIndicesGetter | Object |  | See Grid#overscanIndicesGetter. |
| overscanRowCount | Number |  | Number of rows to render above/below the visible bounds of the list. These rows can help for smoother scrolling on touch devices. |
| rowClassName | String |  | Optional CSS class to apply to all rows. |
| rowHeight | Number | ✓ | Fixed row height. |
| rowRenderer | Function |  | Renders data received from NodeGetter. |
| rowStyle | Object |  | Optional inline styles for all rows. |
| scrollToAlignment | String |  | See Grid#scrollToAlignment |
| scrollToIndex | Number |  | Row index to ensure visible (by forcefully scrolling if necessary). |
| scrollTop | Number |  | Vertical offset. |
| style | Object |  | Optional inline styles. |
| tabIndex | Number |  | Tab index for focus. |
| update | Number |  | If is set and is different than Update.None forces component to recompute and call nodeGetter. This property is not pure: component will re-render any time it receives this property and it is not Update.None. Useful if you changed something in the tree structure and want to re-render component using new data. |
| width | Number | ✓ | Width of Tree container. |

### Public Methods

#### forceUpdateGrid (callback?: () => any)
Forcefully re-render the inner `Grid` component.

Calling `forceUpdate` on `Tree` may not re-render the inner `Grid` since it uses `shallowCompare` as a performance
optimization. Use this method if you want to manually trigger a re-render. This may be appropriate if the underlying
row data has changed but the row sizes themselves have not.

#### getOffsetForRow (params: {alignment?: string, index?: number}): number
Gets offset for a given row and alignment.

#### measureAllRows (): void
Pre-measure all rows in a `Tree`.

Typically rows are only measured as needed and estimated heights are used for cells that have not yet been measured.
This method ensures that the next call to getTotalSize() returns an exact size (as opposed to just an estimated one).

#### recomputeTree (update: Update): Promise<void>
Recomputes Tree component basing on update type.

Method calls `nodeGetter` internally and flattens tree structure to an array. Depending on `update` value it runs
one of the following algorithms:
  1) **Update.NodesAndOpenness**. Requires full node metadata. Updates order, number and rendering data of all
     nodes. Overrides current openness state with `openedByDefault` value.
  2) **Update.Nodes**. Requires full node metadata. Updates order, number and rendering data of all nodes. Preserves
     openness state of all nodes.
  3) **Update.Order**. Requires only node id. Updates nodes order (useful for sorting etc.). Preserves openness
     state of all nodes.
  4) **Update.None**. Updates nothing.

After all computations forces inner `Grid` to re-render. Returns promise that resolves after all re-rendering is done.

#### scrollToPosition (scrollTop: number): void
Scroll to the specified offset.
Useful for animating position changes.

#### scrollToRow (index: number): void
Ensure row is visible.
This method can be used to safely scroll back to a cell that a user has scrolled away from even if it was previously
scrolled to.

### nodeGetter (refresh: boolean): IterableIterator<Node | string | null>
This callback is responsible for providing tree data in consumable form. It should be a `generator` that yields node
metadata to render. Depending on `refresh` parameter it should yield full metadata or only node id. The result of
yielding will be current openness state of the node. This value should be used as a rule to decide if `nodeGetter`
should render node's children or not.

#### Node
| Property | Type | Can be omitted? | Description |
|----------|----------|:--------:|----------|
| childrenCount | Number |  | Number of current node children. |
| id | String |  | Unique ID of current node. Used to identify node inside Tree component. |
| height | Number | ✓ | Current node height. Specify only if you want your tree to have nodes with different heights. |
| isOpenedByDefault | Boolean |  | Current node openness state. Will set node openness state on first rendering or if `update` is set to Update.NodeAndOpenness. |
| nestingLevel | Number |  | Current node nesting level (how deep it is placed relative to tree root). |
| nodeData | Any |  | Node data to be rendered. Will be sent as is to `rowRenderer` callback. |
| style | Object | ✓ | Specific styles for row contains current node. |

#### Example
Let's imagine our tree is build from following nodes: 
```typescript
interface TreeNode {
  id: string;
  name: string;
  children: TreeNode[];
}
```
Then `nodeGetter` for this tree could be following:
```typescript
function * nodeGetter(refresh: boolean): IterableIterator<Node | string | null> {
  const stack = [];

  stack.push({
    nestingLevel: 0,
    node: root, // tree data structure
  });

  while (stack.length !== 0) {
    const {node, nestingLevel} = stack.pop()!;
    const id = node.id.toString();

    const isOpened = yield (
      refresh ? {
        childrenCount: node.children.length,
        height: 20, // only if you want to use dynamic heights; otherwise use "rowHeight"
        id,
        isOpenedByDefault: true, // set "true" if you want your tree to be opened by default, or "false" if you want it closed 
        nestingLevel,
        nodeData: node.name,
      } : id
    );

    if (node.children.length !== 0 && isOpened) {
      for (let i = node.children.length - 1; i >= 0; i--) {
        stack.push({
          nestingLevel: nestingLevel + 1,
          node: node.children[i],
        });
      }
    }
  }
}
```

### rowRenderer (params: RowRendererParams): React.ReactNode
This callback is responsible for rendering single tree row. It receives metadata including data from `nodeGetter` and
renders it to a React node.

Default tree renderer can provide only the very basic tree rendering: toggle button and string body. So if you need
more functional tree, you can fork `defaultRowRenderer`. 


#### RowRendererParams
| Property | Type | Can be undefined? | Description |
|----------|----------|:--------:|----------|
| childrenCount | Number |  | Number of children current node has. |
| className | String | ✓ | Optional CSS class name (a `rowClassName` property set in Tree component). |
| controlClassName | String | ✓ | Optional CSS class name for toggle control (a `controlClassName` property set in Tree component). |
| controlStyle | Object |  | Inline styles for toggle control. Contains two styles: 1) a `controlStyle` property set in Tree component, 2) default styles necessary for displaying control |
| id | String |  | Optional HTML id (an `id` property set in Tree component). |
| index | Number |  | Current row index in the list of all rows. |
| isOpened | Boolean |  | Current node openness state. |
| isScrolling | Boolean |  | Current row scrolling state. |
| key | String |  | Unique key to specify current row. Should be sent to row container to avoid re-rendering issues. |
| nestingLevel | Number |  | Current node nesting level (how deep it is placed relative to tree root). |
| nodeData | Any |  | Node data to be rendered. |
| onNodeToggle | Function |  | Callback to control node toggling. Should be sent to control element (e.g. `<button>`) to show and hide node children. |
| onRowClick | Function | ✓ | Callback invoked when a user clicks on a node (a `onRowClick` property set in Tree component). |
| onRowDoubleClick | Function | ✓ | Callback invoked when a user double-clicks on a node (a `onRowDoubleClick` property set in Tree component). |
| onRowMouseOut | Function | ✓ | Callback invoked when the mouse leaves a node (a `onRowMouseOut` property set in Tree component). |
| onRowMouseOver | Function | ✓ | Callback invoked when a user moves the mouse over a node (a `onRowMouseOver` property set in Tree component). |
| onRowRightClick | Function | ✓ | Callback invoked when a user right-clicks on a node (a `onRowRightClick` property set in Tree component). |
| style | Object |  | Inline styles for row container. Should be sent to a row container to display tree structure property. Contains tree styles: 1) Styles provided by Grid necessary to display row as an element of Grid. 2) Default row styles provided by Tree component. 3) Row styles provided by `rowStyle` prop from Tree component. 4) Row styles provided by `style` property of metadata gotten from `nodeGetter`. |

### Example
You can find very basic example in the [stories](./__stories__/Tree.tsx). 