import cn from 'classnames';
import shallowEqual from 'fbjs/lib/shallowEqual';
import * as React from 'react';
import {
  accessibilityOverscanIndicesGetter,
  Alignment,
  Grid,
  GridCellProps,
  Index, IndexRange,
  OverscanIndexRange,
  ScrollEventData,
} from 'react-virtualized';
import {OverscanIndicesGetter} from 'react-virtualized/dist/es/Grid';
import defaultRowRenderer from './defaultRowRenderer';
import {
  CellPosition,
  Node,
  NodeGetter,
  RenderedSection,
  RowMouseEventHandler,
  RowRendererParams,
} from './types';
import {defaultControlStyle, defaultRowStyle, NodeRecord, UpdateType} from './utils';

export {defaultRowRenderer};

export interface TreeProps {
  'aria-label'?: string,

  /**
   * Removes fixed height from the scrollingContainer so that the total height
   * of rows can stretch the window. Intended for use with WindowScroller
   */
  autoHeight?: boolean;

  /** Optional CSS class name */
  className?: string;

  /**
   * Optional CSS class to apply to all toggle controls.
   */
  controlClassName?: string;

  /**
   * Optional inline styles for all toggle controls.
   */
  controlStyle?: React.CSSProperties;

  /**
   * Used to estimate the total height of a List before all of its rows have actually been measured.
   * The estimated total height is adjusted as rows are rendered.
   */
  estimatedRowSize?: number;

  /** Height constraint for list (determines how many actual rows are rendered) */
  height: number;

  /** Custom HTML id */
  id?: string;

  /**
   * Callback responsible for returning nodes in flat format basing on their openness. It should
   * be a generator function that yields node information, receives info about node's openness
   * and basing on it returns children of current node or next sibling at the next iteration.
   * (): Generator<{
   *   childrenCount: number,
   *   id: string,
   *   isOpenedByDefault: boolean,
   *   nestingLevel: number,
   *   nodeData: any,
   * }>
   */
  nodeGetter: NodeGetter;

  /**
   * Multiplier for a margin that depends on node's nesting level. E.g. if multiplier is 10 and
   * nesting level for node is 2 then margin will be 20px, and for node with nesting level 3 it will be 30px.
   */
  nodeNestingMultiplier?: number;

  /** Optional renderer to be used in place of rows when tree is empty */
  noRowsRenderer?: () => React.ReactNode | null;

  /**
   * Callback invoked when a user clicks on a node.
   * ({event: Event, nodeData: any}): void
   */
  onRowClick?: RowMouseEventHandler;

  /**
   * Callback invoked when a user double-clicks on a node.
   * ({event: Event, nodeData: any}): void
   */
  onRowDoubleClick?: RowMouseEventHandler;

  /**
   * Callback invoked when the mouse leaves a node.
   * ({event: Event, nodeData: any}): void
   */
  onRowMouseOut?: RowMouseEventHandler;

  /**
   * Callback invoked when a user moves the mouse over a node.
   * ({event: Event, nodeData: any}): void
   */
  onRowMouseOver?: RowMouseEventHandler;

  /**
   * Callback invoked when a user right-clicks on a node.
   * ({event: Event, nodeData: any}): void
   */
  onRowRightClick?: RowMouseEventHandler;

  /** Callback invoked with information about the slice of rows that were just rendered. */
  onRowsRendered?: (info: IndexRange & OverscanIndexRange) => void;

  /**
   * Responsible for rendering a data received from NodeGetter:
   * Should implement the following interface: ({
   *   className?: string,
   *   deepLevel: number,
   *   index: number,
   *   isLeaf: boolean,
   *   isOpened: boolean,
   *   isScrolling: boolean,
   *   key: string,
   *   nodeData: any,
   *   onRowClick?: RowMouseEventHandler,
   *   onRowDoubleClick?: RowMouseEventHandler,
   *   onRowMouseOut?: RowMouseEventHandler,
   *   onRowMouseOver?: RowMouseEventHandler,
   *   onRowRightClick?: RowMouseEventHandler,
   *   onNodeToggle: () => void,
   *   style: React.CSSStyleDeclaration,
   * }): ReactElement<*>
   */
  rowRenderer?: (params: RowRendererParams) => React.ReactElement<any>;

  /**
   * Callback invoked whenever the scroll offset changes within the inner scrollable region.
   * This callback can be used to sync scrolling between lists, tables, or grids.
   */
  onScroll?: (params: ScrollEventData) => void;

  /** See Grid#overscanIndicesGetter */
  overscanIndicesGetter?: OverscanIndicesGetter;

  /**
   * Number of rows to render above/below the visible bounds of the list.
   * These rows can help for smoother scrolling on touch devices.
   */
  overscanRowCount?: number;

  /** Optional CSS class to apply to all rows */
  rowClassName?: string;

  /** Fixed row height */
  rowHeight: number;

  /** Optional inline styles for all rows */
  rowStyle?: React.CSSProperties;

  /** See Grid#scrollToAlignment */
  scrollToAlignment?: Alignment,

  /** Row index to ensure visible (by forcefully scrolling if necessary) */
  scrollToIndex?: number;

  /** Vertical offset. */
  scrollTop?: number;

  /** Optional inline style */
  style?: React.CSSProperties;

  /** Tab index for focus */
  tabIndex?: number;

  update?: UpdateType;

  /** Width of list */
  width: number;
}

export interface TreeState {
  order: string[];
  useDynamicRowHeight: boolean;
}

/**
 * This component renders a tree of elements using powerful virtualization technology to render
 * only visible elements to the HTML document.
 */
export default class Tree extends React.Component<TreeProps, TreeState> {
  public static defaultProps: Partial<TreeProps> = {
    autoHeight: false,
    estimatedRowSize: 30,
    noRowsRenderer: () => null,
    nodeNestingMultiplier: 10,
    onRowsRendered: () => undefined,
    onScroll: () => undefined,
    overscanIndicesGetter: accessibilityOverscanIndicesGetter,
    overscanRowCount: 10,
    rowRenderer: defaultRowRenderer,
    scrollToAlignment: 'auto',
    scrollToIndex: -1,
    style: {},
    update: UpdateType.None,
  };

  public state: TreeState = {
    order: [],
    useDynamicRowHeight: false,
  };

  private grid: Grid | undefined;
  private registry: {[key: string]: NodeRecord} = {};

  public async componentWillMount(): Promise<void> {
    await this.recomputeTree(UpdateType.NodesAndOpenness);
  }

  public async componentWillReceiveProps({update}: TreeProps): Promise<void> {
    if (update !== UpdateType.None) {
      await this.recomputeTree(update!);
    }
  }

  public forceUpdateGrid(callback?: () => any): void {
    if (this.grid) {
      this.grid.forceUpdate(callback);
    }
  }

  /** See Grid#getOffsetForCell */
  public getOffsetForRow({alignment, index}: {alignment: Alignment, index: number}): number {
    if (this.grid) {
      const {scrollTop} = this.grid.getOffsetForCell({
        alignment,
        columnIndex: 0,
        rowIndex: index,
      });

      return scrollTop;
    }

    return 0;
  }

  /** CellMeasurer compatibility */
  public invalidateCellSizeAfterRender({columnIndex, rowIndex}: CellPosition): void {
    if (this.grid) {
      this.grid.invalidateCellSizeAfterRender({
        columnIndex,
        rowIndex,
      });
    }
  }

  /** See Grid#measureAllCells */
  public measureAllRows(): void {
    if (this.grid) {
      this.grid.measureAllCells();
    }
  }

  /** CellMeasurer compatibility */
  public recomputeGridSize({columnIndex = 0, rowIndex = 0}: Partial<CellPosition> = {}): void {
    if (this.grid) {
      this.grid.recomputeGridSize({
        columnIndex,
        rowIndex,
      });
    }
  }

  /** See Grid#recomputeGridSize */
  public recomputeRowHeights(index: number = 0): void {
    if (this.grid) {
      this.grid.recomputeGridSize({
        columnIndex: 0,
        rowIndex: index,
      });
    }
  }

  /*
   * Converts complex tree to a flat array to display it with Grid using a `_nodeGetter` generator function.
   * Generator provides ability to inform user's algorithm about current node state: is it opened or closed.
   * Basing on this information generator can decide whether it is necessary to render children.
   */
  public async recomputeTree(update: UpdateType): Promise<{}> {
    interface IteratorValue {
      done: boolean;
      value: Node | string | null;
    }

    const {
      nodeGetter,
      rowHeight,
    } = this.props;

    const order: string[] = [];
    let useDynamicRowHeight = false;

    const refresh = update === UpdateType.Nodes || update === UpdateType.NodesAndOpenness;
    const ignoreInnerState = update === UpdateType.NodesAndOpenness;

    const g = nodeGetter(refresh);

    let isPreviousOpened = false;

    // tslint:disable-next-line:no-constant-condition
    while (true) {
      const {value, done}: IteratorValue = g.next(isPreviousOpened);

      if (done || !value) {
        break;
      }

      if (typeof value === 'string') {
        order.push(value);
        isPreviousOpened = this.registry[value].isOpened;
      } else {
        const {
          height,
          id,
          isOpenedByDefault,
        }: Node = value;
        const record = this.registry[id];

        if (!record) {
          this.registry[id] = new NodeRecord(
            value,
            isOpenedByDefault,
            this.finishNodeToggling,
          );
        } else {
          record.node = value;

          if (ignoreInnerState) {
            record.isOpened = isOpenedByDefault;
          }
        }

        order.push(id);
        isPreviousOpened = this.registry[id].isOpened;

        if (height && height !== rowHeight) {
          useDynamicRowHeight = true;
        }
      }
    }

    return new Promise((resolve) => {
      this.setState({
        order,
        useDynamicRowHeight,
      }, () => {
        if (useDynamicRowHeight) {
          this.recomputeGridSize();
          resolve();
        } else {
          this.forceUpdateGrid(resolve);
        }
      });
    });
  }

  public render(): JSX.Element {
    const {
      className,
      noRowsRenderer,
      onScroll,
      rowHeight,
      scrollToIndex,
      update,
      width,
      ...other // tslint:disable-line:trailing-comma
    } = this.props;

    const {
      order,
      useDynamicRowHeight,
    } = this.state;

    const classNames = cn('ReactVirtualized__Tree', className);

    return (
      <Grid
        autoContainerWidth
        cellRenderer={this.cellRenderer}
        className={classNames}
        columnWidth={width}
        columnCount={1}
        noContentRenderer={noRowsRenderer}
        onScroll={this.onScroll}
        onSectionRendered={this.onSectionRendered}
        ref={this.setRef}
        rowCount={order.length}
        rowHeight={
          useDynamicRowHeight
            ? this.getRowHeight
            : rowHeight
        }
        scrollToRow={scrollToIndex}
        width={width}
        {...other}
      />
    );
  }

  /** See Grid#scrollToPosition */
  public scrollToPosition(scrollTop: number = 0): void {
    if (this.grid) {
      this.grid.scrollToPosition({scrollTop} as any);
    }
  }

  /** See Grid#scrollToCell */
  public scrollToRow(index: number = 0): void {
    if (this.grid) {
      this.grid.scrollToCell({
        columnIndex: 0,
        rowIndex: index,
      });
    }
  }

  public shouldComponentUpdate({update, ...nextOther}: TreeProps, nextState: TreeState): boolean {
    const {update: _, ...other} = this.props;

    return !shallowEqual(other, nextOther)
      || !shallowEqual(this.state, nextState)
      || update !== UpdateType.None;
  }

  /**
   * Make specified node's openness opposite.
   * @param map object that contains nodes' ids as keys and boolean openness states as values.
   */
  public async toggleNodes(map: {[id: string]: boolean}): Promise<{}> {
    // tslint:disable-next-line:forin no-for-in
    for (const id in map) {
      this.registry[id].isOpened = map[id];
    }

    return this.recomputeTree(UpdateType.Nodes);
  }

  private getRowHeight = ({index}: Index): number => {
    const {rowHeight} = this.props;
    const {order} = this.state;
    const id = order[index];
    const {node} = this.registry[id];

    return node.height || rowHeight;
  };

  private cellRenderer = ({rowIndex, style, isScrolling, key}: GridCellProps) => {
    const {
      controlClassName,
      controlStyle,
      rowClassName,
      nodeNestingMultiplier,
      onRowClick,
      onRowDoubleClick,
      onRowMouseOver,
      onRowMouseOut,
      onRowRightClick,
      rowHeight,
      rowRenderer,
      rowStyle,
    } = this.props;

    const {order} = this.state;

    // TRICKY The style object is sometimes cached by Grid.
    // This prevents new style objects from bypassing shallowCompare().
    // However as of React 16, style props are auto-frozen (at least in dev mode)
    // Check to make sure we can still modify the style before proceeding.
    // https://github.com/facebook/react/commit/977357765b44af8ff0cfea327866861073095c12#commitcomment-20648713
    const {writable} = Object.getOwnPropertyDescriptor(style, 'width') as any;

    if (writable) {
      // By default, Tree cells should be 100% width.
      // This prevents them from flowing under a scrollbar (if present).
      style.width = '100%';
    }

    const id = order[rowIndex];
    const record = this.registry[id];

    const {
      node: {
        childrenCount,
        nestingLevel,
        nodeData,
        height,
        style: specificRowStyle,
      },
      isOpened,
      onNodeToggle,
    } = record;

    return rowRenderer!({
      childrenCount,
      className: rowClassName,
      controlClassName,
      controlStyle: {
        ...defaultControlStyle,
        ...controlStyle,
      },
      id,
      index: rowIndex,
      isOpened,
      isScrolling,
      key,
      nestingLevel,
      nodeData,
      onNodeToggle,
      onRowClick,
      onRowDoubleClick,
      onRowMouseOut,
      onRowMouseOver,
      onRowRightClick,
      style: {
        ...style,
        ...defaultRowStyle,
        ...rowStyle,
        ...specificRowStyle,
        height: height || rowHeight,
        marginLeft: nestingLevel * nodeNestingMultiplier!,
        overflow: 'hidden',
      },
    });
  };

  private finishNodeToggling = async () => {
    await this.recomputeTree(UpdateType.Nodes);
  };

  private onScroll = ({clientHeight, scrollHeight, scrollTop}: ScrollEventData): void => {
    const {onScroll} = this.props;

    onScroll!({clientHeight, scrollHeight, scrollTop});
  };

  private onSectionRendered = ({
    rowOverscanStartIndex,
    rowOverscanStopIndex,
    rowStartIndex,
    rowStopIndex,
  }: RenderedSection) => {
    const {onRowsRendered} = this.props;

    onRowsRendered!({
      overscanStartIndex: rowOverscanStartIndex,
      overscanStopIndex: rowOverscanStopIndex,
      startIndex: rowStartIndex,
      stopIndex: rowStopIndex,
    });
  };

  private setRef = (grid: Grid) => {
    this.grid = grid;
  };
}
