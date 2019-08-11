// tslint:disable:no-bitwise naming-convention
import * as React from 'react';
import {ListChildComponentProps} from 'react-window';

export interface CommonNodeMetadata<T = any> {
  /** Number of children of the current node  */
  readonly childrenCount: number;

  /**
   * CSS class name. Will be sent as is to the Node component
   */
  readonly className?: string;

  /** Data of the node. Will be sent as it to the Node component */
  readonly data?: T;

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

  /**
   * Current node nesting level (how deep it is placed relatively to the tree
   * root).
   */
  readonly nestingLevel: number;

  /**
   * CSS styles. Will be sent as is to the Node component
   */
  readonly style?: React.CSSProperties;
}

export interface CommonUpdateOptions {
  readonly refreshNodes?: boolean;
  readonly useDefaultOpenness?: boolean;
}

export interface CommonNodeRecord {
  isOpen: boolean;
  metadata: CommonNodeMetadata;
  readonly toggle: () => Promise<void>;
}

export interface CommonNodeComponentProps
  extends Omit<ListChildComponentProps, 'index'> {
  readonly isOpen: boolean;
  readonly metadata: CommonNodeMetadata;
  readonly toggle: () => void;
}

export interface TreeProps<TMetadata extends CommonNodeMetadata> {
  readonly rowComponent?: React.ComponentType<ListChildComponentProps>;
  readonly treeWalker: (
    refresh: boolean,
  ) => IterableIterator<TMetadata | string | symbol>;
}

export interface TreeState<T extends CommonNodeRecord> {
  readonly component: React.ComponentType<CommonNodeComponentProps>;
  readonly data?: any;
  readonly order: ReadonlyArray<string | symbol>;
  readonly records: Record<string, T>;
}

export const Row: React.FunctionComponent<ListChildComponentProps> = ({
  index,
  data: {component: Node, data, order, records}, // tslint:disable-line:naming-convention
  style,
  isScrolling,
}: ListChildComponentProps) => (
  <Node
    {...records[order[index]]}
    data={data}
    style={style}
    isScrolling={isScrolling}
  />
);
