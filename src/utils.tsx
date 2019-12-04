// tslint:disable:no-bitwise naming-convention
import * as React from 'react';
import {ListChildComponentProps} from 'react-window';

export type CommonNodeData<T> = {
  /**
   * Unique ID of the current node. Will be used to identify the node to change
   * its internal state.
   */
  readonly id: string | symbol;

  /**
   * Default node openness state. If the Tree component performs rendering at
   * the first time or the "updateOpenness" property is provided, this value
   * will be used to set the internal openness state of the node.
   */
  readonly isOpenByDefault: boolean;
} & {
  readonly [P in keyof T]: T[P];
};

export type CommonUpdateOptions = {
  readonly refreshNodes?: boolean;
  readonly useDefaultOpenness?: boolean;
};

export type CommonNodeRecord<TData extends CommonNodeData<T>, T> = {
  data: TData;
  isOpen: boolean;
  readonly toggle: () => Promise<void>;
};

export type CommonNodeComponentProps<TData extends CommonNodeData<T>, T> = Omit<
  ListChildComponentProps,
  'index'
> & {
  readonly data: TData;
  readonly isOpen: boolean;
  readonly toggle: () => void;
  readonly treeData?: any;
};

export type TreeProps<TData extends CommonNodeData<T>, T> = {
  readonly rowComponent?: React.ComponentType<ListChildComponentProps>;
  readonly treeWalker: (
    refresh: boolean,
  ) => Generator<TData | string | symbol, void, boolean>;
};

export type TreeState<
  TNodeComponentProps extends CommonNodeComponentProps<TData, T>,
  TNodeRecord extends CommonNodeRecord<TData, T>,
  TData extends CommonNodeData<T>,
  T
> = {
  readonly component: React.ComponentType<TNodeComponentProps>;
  readonly order: ReadonlyArray<string | symbol>;
  readonly records: Record<string, TNodeRecord>;
  readonly treeData?: any;
};

export const Row: React.FunctionComponent<ListChildComponentProps> = ({
  index,
  data: {component: Node, treeData, order, records}, // tslint:disable-line:naming-convention
  style,
  isScrolling,
}: ListChildComponentProps) => (
  <Node
    {...records[order[index]]}
    style={style}
    isScrolling={isScrolling}
    treeData={treeData}
  />
);
