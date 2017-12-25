import {CSSProperties} from 'react';
import {SectionRenderedParams} from 'react-virtualized';

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

export interface Node {
  childrenCount: number;
  id: string;
  height?: number;
  isOpenedByDefault: boolean;
  nestingLevel: number;
  nodeData: any;
  style?: CSSProperties;
}

export type NodeGetter = (refresh: boolean) => IterableIterator<Node | string>;

export type RowMouseEventHandler = (params: {
  event: Event;
  nodeData: any;
}) => void;

export interface RowRendererParams<T = any> {
  childrenCount: number;
  className?: string;
  controlClassName?: string;
  controlStyle?: CSSProperties;
  id: string;
  index: number;
  isOpened: boolean;
  isScrolling: boolean;
  key: string;
  nestingLevel: number;
  nodeData: T;
  onNodeToggle: () => void;
  onRowClick?: RowMouseEventHandler;
  onRowDoubleClick?: RowMouseEventHandler;
  onRowMouseOut?: RowMouseEventHandler;
  onRowMouseOver?: RowMouseEventHandler;
  onRowRightClick?: RowMouseEventHandler;
  style: CSSProperties;
}
