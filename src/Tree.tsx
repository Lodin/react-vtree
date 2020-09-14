/* eslint-disable react/no-unused-state,@typescript-eslint/consistent-type-assertions,no-labels,max-depth */
import React, {
  ComponentType,
  PropsWithChildren,
  PureComponent,
  ReactElement,
} from 'react';
import {
  Align,
  FixedSizeList,
  ListChildComponentProps,
  ListProps,
  VariableSizeList,
} from 'react-window';
import {
  DefaultTreeProps,
  DefaultTreeState,
  revisitRecord,
  visitRecord,
} from './utils';

export type NodeData = Readonly<{
  /**
   * Unique ID of the current node. Will be used to identify the node to change
   * its internal state.
   */
  id: string | symbol;

  /**
   * Default node openness state. If the Tree component performs rendering at
   * the first time or the "updateOpenness" property is provided, this value
   * will be used to set the internal openness state of the node.
   */
  isOpenByDefault: boolean;
}>;

export type TreeWalkerNext<TData extends NodeData, TNode = any> = Readonly<{
  data: TData;
  node: TNode;
}>;

export type UpdateOptions = Readonly<{
  opennessState?: Readonly<Record<string, boolean>>;
  refreshNodes?: boolean;
  useDefaultOpenness?: boolean;
}>;

export type NodeRecordConnections<T extends NodeRecord<any>> = {
  child: T | null;
  parent: T | null;
  sibling: T | null;
  visited: boolean;
};

export type NodeRecord<TData extends NodeData> = {
  connections: NodeRecordConnections<NodeRecord<TData>>;
  readonly data: TData;
  isOpen: boolean;
  isShown: boolean;
  readonly node: any;
  readonly toggle: () => Promise<void>;
};

export type NodeComponentProps<TData extends NodeData> = Readonly<
  Omit<ListChildComponentProps, 'data' | 'index'>
> &
  Pick<NodeRecord<TData>, 'data' | 'isOpen' | 'toggle'> &
  Readonly<{
    treeData?: any;
  }>;

export type TreeWalker<TData extends NodeData, TNode = any> = () => Generator<
  TreeWalkerNext<TData, TNode> | undefined,
  void,
  TNode
>;

export type TreeWalkerIteratorResult<
  TData extends NodeData,
  TNode = any,
  TResult = never
> = IteratorResult<
  TreeWalkerNext<TData, TNode> | TResult,
  TreeWalkerNext<TData, TNode> | TResult
>;

export type TreeProps<
  TNodeComponentProps extends NodeComponentProps<TData>,
  TData extends NodeData
> = Readonly<Omit<ListProps, 'children' | 'itemCount'>> &
  Readonly<{
    children: ComponentType<TNodeComponentProps>;
    rowComponent?: ComponentType<ListChildComponentProps>;
    treeWalker: TreeWalker<TData>;
  }>;

export type TreeState<
  TNodeComponentProps extends NodeComponentProps<TData>,
  TNodeRecord extends NodeRecord<TData>,
  TUpdateOptions extends UpdateOptions,
  TData extends NodeData
> = Readonly<{
  component: ComponentType<TNodeComponentProps>;
  order?: ReadonlyArray<string | symbol>;
  computeTree: TreeComputer<
    TNodeComponentProps,
    TNodeRecord,
    TUpdateOptions,
    TData,
    any,
    any
  >;
  records: ReadonlyMap<string | symbol, TNodeRecord>;
  rootId: string | symbol;
  treeData?: any;
  recomputeTree: (options?: TUpdateOptions) => Promise<void>;
  treeWalker: TreeWalker<TData>;
}>;

export type TypedListChildComponentProps<TData extends NodeData> = Readonly<
  Omit<ListChildComponentProps, 'data'> & {
    data: Pick<
      TreeState<
        NodeComponentProps<TData>,
        NodeRecord<TData>,
        UpdateOptions,
        TData
      >,
      'component' | 'order' | 'records' | 'treeData'
    >;
  }
>;

// eslint-disable-next-line @typescript-eslint/naming-convention,@typescript-eslint/prefer-readonly-parameter-types
export const Row = <TData extends NodeData>({
  index,
  data: {component: Node, treeData, order, records},
  style,
  isScrolling,
}: PropsWithChildren<
  TypedListChildComponentProps<TData>
>): ReactElement | null => {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  const {connections: _c, isShown: _s, ...other} = records.get(order![index])!;

  return (
    <Node
      isScrolling={isScrolling}
      style={style}
      treeData={treeData}
      {...other}
    />
  );
};

export type TreeCreatorOptions<
  TNodeComponentProps extends NodeComponentProps<TData>,
  TNodeRecord extends NodeRecord<TData>,
  TUpdateOptions extends UpdateOptions,
  TData extends NodeData,
  TState extends TreeState<
    TNodeComponentProps,
    TNodeRecord,
    TUpdateOptions,
    TData
  >
> = Readonly<{
  createRecord: (
    value: TreeWalkerNext<TData>,
    state: TState,
    parent?: TNodeRecord | null,
  ) => TNodeRecord;
  updateRecord: (record: TNodeRecord, options: TUpdateOptions) => void;
}>;

export type TreeComputer<
  TNodeComponentProps extends NodeComponentProps<TData>,
  TNodeRecord extends NodeRecord<TData>,
  TUpdateOptions extends UpdateOptions,
  TData extends NodeData,
  TProps extends TreeProps<TNodeComponentProps, TData>,
  TState extends TreeState<
    TNodeComponentProps,
    TNodeRecord,
    TUpdateOptions,
    TData
  >
> = (
  props: TProps,
  state: TState,
  options?: TUpdateOptions,
) => Pick<TState, 'order' | 'records'>;

export const createTreeComputer = <
  TNodeComponentProps extends NodeComponentProps<TData>,
  TNodeRecord extends NodeRecord<TData>,
  TUpdateOptions extends UpdateOptions,
  TData extends NodeData,
  TProps extends TreeProps<TNodeComponentProps, TData>,
  TState extends TreeState<
    TNodeComponentProps,
    TNodeRecord,
    TUpdateOptions,
    TData
  >
>({
  createRecord,
  updateRecord,
}: TreeCreatorOptions<
  TNodeComponentProps,
  TNodeRecord,
  TUpdateOptions,
  TData,
  TState
>): TreeComputer<
  TNodeComponentProps,
  TNodeRecord,
  TUpdateOptions,
  TData,
  TProps,
  TState
> => (
  {treeWalker},
  state,
  options = {} as TUpdateOptions,
): Pick<TreeState<any, any, any, any>, 'order' | 'records' | 'rootId'> => {
  const isRefreshing = options.refreshNodes ?? false;

  if (isRefreshing) {
    const records = new Map<string | symbol, TNodeRecord>();
    const iter = treeWalker();
    const {value: root} = iter.next() as TreeWalkerIteratorResult<TData>;

    const rootRecord = createRecord(root, state);
    records.set(rootRecord.data.id, rootRecord);

    const order: Array<string | symbol> = [];

    let currentRecord: TNodeRecord | null = rootRecord;

    iter.next();

    // Vertical traverse
    do {
      if (!currentRecord.connections.visited) {
        if (currentRecord.isShown) {
          order.push(currentRecord.data.id);
        }

        let tempRecord: TNodeRecord | null = currentRecord;

        // Horizontal traverse
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition,no-constant-condition
        while (true) {
          const {value: child} = iter.next(
            currentRecord.node,
          ) as TreeWalkerIteratorResult<TData, any, undefined>;

          if (!child) {
            break;
          }

          const childRecord = createRecord(child, state, currentRecord);
          records.set(childRecord.data.id, childRecord);

          if (tempRecord === currentRecord) {
            tempRecord.connections.child = childRecord;
          } else {
            tempRecord.connections.sibling = childRecord;
          }

          tempRecord = childRecord;
        }

        currentRecord = visitRecord(currentRecord);
      } else {
        currentRecord = revisitRecord(currentRecord);
      }
    } while (currentRecord !== null);

    return {
      order,
      records,
      rootId: rootRecord.data.id,
    };
  }

  const {records, rootId} = state;
  const order: Array<string | symbol> = [];

  let currentRecord: TNodeRecord | null = records.get(rootId)!;

  do {
    if (!currentRecord.connections.visited) {
      updateRecord(currentRecord, options);

      if (currentRecord.isShown) {
        order.push(currentRecord.data.id);
      }

      currentRecord = visitRecord(currentRecord);
    } else {
      currentRecord = revisitRecord(currentRecord);
    }
  } while (currentRecord !== null);

  return {
    order,
    records,
    rootId,
  };
};

class Tree<
  TNodeComponentProps extends NodeComponentProps<TData>,
  TNodeRecord extends NodeRecord<TData>,
  TUpdateOptions extends UpdateOptions,
  TData extends NodeData,
  TProps extends TreeProps<TNodeComponentProps, TData>,
  TState extends TreeState<
    TNodeComponentProps,
    TNodeRecord,
    TUpdateOptions,
    TData
  >,
  TListComponent extends FixedSizeList | VariableSizeList
> extends PureComponent<TProps, TState> {
  public static defaultProps: Partial<DefaultTreeProps> = {
    rowComponent: Row,
  };

  public static getDerivedStateFromProps(
    props: DefaultTreeProps,
    state: DefaultTreeState,
  ): Partial<DefaultTreeState> {
    const {children: component, itemData: treeData, treeWalker} = props;
    const {computeTree, order, treeWalker: oldTreeWalker} = state;

    return {
      component,
      treeData,
      ...(treeWalker !== oldTreeWalker || !order
        ? computeTree(props, state, {refreshNodes: true})
        : null),
    };
  }

  protected readonly list: React.RefObject<TListComponent> = React.createRef();

  public constructor(props: TProps, context: any) {
    super(props, context);

    this.state = {
      component: props.children,
      recomputeTree: this.recomputeTree.bind(this),
      records: {},
      treeWalker: props.treeWalker,
    } as TState;
  }

  public recomputeTree(options?: TUpdateOptions): Promise<void> {
    return new Promise((resolve) => {
      this.setState<never>(
        (prevState) => prevState.computeTree(this.props, prevState, options),
        resolve,
      );
    });
  }

  public scrollTo(scrollOffset: number): void {
    this.list.current?.scrollTo(scrollOffset);
  }

  public scrollToItem(id: string | symbol, align?: Align): void {
    // eslint-disable-next-line react/destructuring-assignment
    this.list.current?.scrollToItem(this.state.order!.indexOf(id), align);
  }
}

export default Tree;
