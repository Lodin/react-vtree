import {CSSProperties} from 'react';
import {SectionRenderedParams} from 'react-virtualized';

/**
 * Single node metadata "nodeGetter" prop yields.
 */
export interface Node<T = any> {
  /** Number of current node children */
  childrenCount: number;

  /** Unique ID of current node. Used to identify node inside Tree component */
  id: string;

  /** Current node height. Specify only if you want your tree to have nodes with different heights */
  height?: number;

  /**
   * Current node openness state. Will set node openness state on first rendering or if :update is set to
   * Update.NodeAndOpenness.
   */
  isOpenedByDefault: boolean;

  /** Current node nesting level (how deep it is placed relative to tree root) */
  nestingLevel: number;

  /** Node data to be rendered. Will be sent as is to "rowRenderer" callback */
  nodeData: T;

  /** Specific styles for row contains current node */
  style?: CSSProperties;
}

export type NodeGetter = (refresh: boolean) => IterableIterator<Node | string | null>;

export type RowMouseEventHandler = (params: {
  event: Event;
  nodeData: any;
}) => void;

/**
 * Params "rowRenderer" callback receives.
 */
export interface RowRendererParams<T = any> {
  /** Number of children current node has */
  childrenCount: number;

  /** Optional CSS class name (a "rowClassName" property set in Tree component) */
  className?: string;

  /** Optional CSS class name for toggle control (a "controlClassName" property set in Tree component) */
  controlClassName?: string;

  /**
   * Inline styles for toggle control. Contains two styles:
   * 1) a "controlStyle" property set in Tree component and.
   * 2) default styles necessary for displaying control
   */
  controlStyle: CSSProperties;

  /** Optional HTML id. It will be an "id" property set in Tree component */
  id: string;

  /** Current row index in the list of all rows */
  index: number;

  /** Current node openness state */
  isOpened: boolean;

  /** Current row scrolling state */
  isScrolling: boolean;

  /** Unique key to specify current row. Should be sent to row container to avoid re-rendering issues */
  key: string;

  /** Current node nesting level (how deep it is placed relative to tree root) */
  nestingLevel: number;

  /** Node data to be rendered */
  nodeData: T;

  /**
   * Callback to control node toggling. Should be sent to control element (e.g. <button>) to show and hide node
   * children.
   */
  onNodeToggle: () => void;

  /** Callback invoked when a user clicks on a node (a "onRowClick" property set in Tree component) */
  onRowClick?: RowMouseEventHandler;

  /** Callback invoked when a user double-clicks on a node (a "onRowDoubleClick" property set in Tree component) */
  onRowDoubleClick?: RowMouseEventHandler;

  /** Callback invoked when the mouse leaves a node (a "onRowMouseOut" property set in Tree component) */
  onRowMouseOut?: RowMouseEventHandler;

  /** Callback invoked when a user moves the mouse over a node (a "onRowMouseOver" property set in Tree component) */
  onRowMouseOver?: RowMouseEventHandler;

  /** Callback invoked when a user right-clicks on a node (a "onRowRightClick" property set in Tree component) */
  onRowRightClick?: RowMouseEventHandler;

  /**
   * Inline styles for row container. Should be sent to a row container to display tree structure property.
   * Contains tree styles:
   * 1) Styles provided by Grid necessary to display row as an element of Grid.
   * 2) Default row styles provided by Tree component.
   * 3) Row styles provided by "rowStyle" prop from Tree component.
   * 4) Row styles provided by "style" property of metadata gotten from "nodeGetter".
   */
  style: CSSProperties;
}

export interface CellPosition {
  columnIndex: number;
  rowIndex: number;
}

export interface RenderedSection extends SectionRenderedParams {
  columnOverscanStartIndex: number;
  columnOverscanStopIndex: number;
  rowOverscanStartIndex: number;
  rowOverscanStopIndex: number;
}
