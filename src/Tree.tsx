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
  noop,
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

export type TreeWalkerYieldingValue<
  TData extends NodeData,
  TMeta = any
> = Readonly<{
  data: TData;
  meta: TMeta;
}>;

export type OpennessStateOptions = Readonly<{
  open: boolean;
  useDefaultOpenness?: boolean;
}>;

export type NodeRecordPublic<T extends NodeData> = Readonly<{
  data: T;
  toggle: () => Promise<void>;
}> & {
  isOpen: boolean;
};

export type NodeRecord<
  TNodeRecordPublic extends NodeRecordPublic<any>
> = Readonly<{
  meta: any;
  public: TNodeRecordPublic;
}> & {
  child: NodeRecord<TNodeRecordPublic> | null;
  isShown: boolean;
  parent: NodeRecord<TNodeRecordPublic> | null;
  sibling: NodeRecord<TNodeRecordPublic> | null;
  visited: boolean;
};

export type NodeComponentProps<TData extends NodeData> = Readonly<
  Omit<ListChildComponentProps, 'data' | 'index'>
> &
  Pick<NodeRecordPublic<TData>, 'data' | 'isOpen' | 'toggle'> &
  Readonly<{
    treeData?: any;
  }>;

export type TreeWalker<TData extends NodeData, TMeta = any> = () => Generator<
  TreeWalkerYieldingValue<TData, TMeta> | undefined,
  void,
  TMeta
>;

export type TreeWalkerIteratorResult<
  TData extends NodeData,
  TMeta = any,
  TResult = never
> = IteratorResult<
  TreeWalkerYieldingValue<TData, TMeta> | TResult,
  TreeWalkerYieldingValue<TData, TMeta> | TResult
>;

export type OpennessState<T extends OpennessStateOptions> = Readonly<
  Record<string, T | boolean>
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
  TNodeRecordPublic extends NodeRecordPublic<TData>,
  TOpennessStateOptions extends OpennessStateOptions,
  TData extends NodeData
> = Readonly<{
  order?: Array<string | symbol>;
  computeTree: TreeComputer<
    TNodeComponentProps,
    TNodeRecordPublic,
    TOpennessStateOptions,
    TData,
    any,
    any
  >;
  records: ReadonlyMap<string | symbol, NodeRecord<TNodeRecordPublic>>;
  recomputeTree: (
    options: OpennessState<TOpennessStateOptions>,
  ) => Promise<void>;
  treeWalker: TreeWalker<TData>;

  // A simple hack to get over the PureComponent shallow comparison
  updateRequest: object;
}>;

export type TypedListChildComponentData<TData extends NodeData> = Readonly<{
  component: ComponentType<NodeComponentProps<TData>>;
  getRecordData: (index: number) => NodeRecordPublic<TData>;
  treeData: any;
}>;

export type TypedListChildComponentProps<TData extends NodeData> = Readonly<
  Omit<ListChildComponentProps, 'data'> & {
    data: TypedListChildComponentData<TData>;
  }
>;

// eslint-disable-next-line @typescript-eslint/naming-convention,@typescript-eslint/prefer-readonly-parameter-types
export const Row = <TData extends NodeData>({
  index,
  data: {component: Node, getRecordData, treeData},
  style,
  isScrolling,
}: PropsWithChildren<
  TypedListChildComponentProps<TData>
>): ReactElement | null => {
  const data = getRecordData(index);

  return (
    <Node
      isScrolling={isScrolling}
      style={style}
      treeData={treeData}
      {...data}
    />
  );
};

export type TreeCreatorOptions<
  TNodeComponentProps extends NodeComponentProps<TData>,
  TNodeRecordPublic extends NodeRecordPublic<TData>,
  TOpennessStateOptions extends OpennessStateOptions,
  TData extends NodeData,
  TState extends TreeState<
    TNodeComponentProps,
    TNodeRecordPublic,
    TOpennessStateOptions,
    TData
  >
> = Readonly<{
  createRecord: (
    value: TreeWalkerYieldingValue<TData>,
    state: TState,
    parent?: NodeRecord<TNodeRecordPublic> | null,
  ) => NodeRecord<TNodeRecordPublic>;
  updateRecord: (
    record: NodeRecord<TNodeRecordPublic>,
    id: string | symbol,
    options: TOpennessStateOptions,
  ) => void;
}>;

export type TreeComputerOptions<T extends OpennessStateOptions> = Readonly<{
  opennessState?: OpennessState<T>;
  refresh?: boolean;
}>;

export type TreeComputer<
  TNodeComponentProps extends NodeComponentProps<TData>,
  TNodeRecordPublic extends NodeRecordPublic<TData>,
  TOpennessStateOptions extends OpennessStateOptions,
  TData extends NodeData,
  TProps extends TreeProps<TNodeComponentProps, TData>,
  TState extends TreeState<
    TNodeComponentProps,
    TNodeRecordPublic,
    TOpennessStateOptions,
    TData
  >
> = (
  props: TProps,
  state: TState,
  options: TreeComputerOptions<TOpennessStateOptions>,
) => Pick<TState, 'order' | 'records'> & Partial<Pick<TState, 'updateRequest'>>;

export const createTreeComputer = <
  TNodeComponentProps extends NodeComponentProps<TData>,
  TNodeRecordPublic extends NodeRecordPublic<TData>,
  TOpennessStateOptions extends OpennessStateOptions,
  TData extends NodeData,
  TProps extends TreeProps<TNodeComponentProps, TData>,
  TState extends TreeState<
    TNodeComponentProps,
    TNodeRecordPublic,
    TOpennessStateOptions,
    TData
  >
>({
  createRecord,
  updateRecord,
}: TreeCreatorOptions<
  TNodeComponentProps,
  TNodeRecordPublic,
  TOpennessStateOptions,
  TData,
  TState
>): TreeComputer<
  TNodeComponentProps,
  TNodeRecordPublic,
  TOpennessStateOptions,
  TData,
  TProps,
  TState
> => ({treeWalker}, state, {opennessState, refresh}) => {
  // If refresh is required, we will run the TreeWalker. It will completely
  // update all requests and reset every state to default.
  if (refresh) {
    const records = new Map<string | symbol, NodeRecord<TNodeRecordPublic>>();
    const iter = treeWalker();
    const {value: root} = iter.next() as TreeWalkerIteratorResult<TData>;

    // Each record has a link to a parent, the next sibling and the next child.
    // Having this info, we can perform a depth-first traverse.
    const rootRecord = createRecord(root, state);
    records.set(rootRecord.public.data.id, rootRecord);

    const order: Array<string | symbol> = [];

    let currentRecord: NodeRecord<TNodeRecordPublic> | null = rootRecord;

    iter.next();

    while (currentRecord !== null) {
      if (!currentRecord.visited) {
        if (currentRecord.isShown) {
          order.push(currentRecord.public.data.id);
        }

        let tempRecord: NodeRecord<TNodeRecordPublic> | null = currentRecord;

        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition,no-constant-condition
        while (true) {
          const {value: child} = iter.next(
            currentRecord.meta,
          ) as TreeWalkerIteratorResult<TData, any, undefined>;

          if (!child) {
            break;
          }

          const childRecord = createRecord(child, state, currentRecord);
          records.set(childRecord.public.data.id, childRecord);

          if (tempRecord === currentRecord) {
            tempRecord.child = childRecord;
          } else {
            tempRecord.sibling = childRecord;
          }

          tempRecord = childRecord;
        }

        currentRecord = visitRecord(currentRecord);
      } else {
        currentRecord = revisitRecord(currentRecord);
      }
    }

    return {
      order,
      records,
    };
  }

  // If we need to perform only the update, treeWalker won't be used. It will
  // work internally, traversing only the subtree of elements that require
  // update through the opennessState option.
  const {order, records} = state;

  for (const id in opennessState) {
    if (!records.has(id)) {
      continue;
    }

    const opts = opennessState[id];
    const rootRecord = records.get(id)!;

    // Here we unify the shape of openness state options
    const recordState =
      typeof opts === 'boolean'
        ? ({open: opts} as TOpennessStateOptions)
        : opts;

    let update: (record: NodeRecord<TNodeRecordPublic>) => void = noop;
    let apply: () => void = noop;

    if (rootRecord.isShown) {
      if (recordState.open && !rootRecord.public.isOpen) {
        const orderPart: Array<string | symbol> = [];
        const index = order!.indexOf(id);

        update = (record: NodeRecord<TNodeRecordPublic>) => {
          if (record.isShown) {
            orderPart.push(record.public.data.id);
          }
        };

        apply = () => {
          order!.splice(index + 1, 0, ...orderPart);
        };
      } else if (!recordState.open && rootRecord.public.isOpen) {
        const index = order!.indexOf(id);

        let count = 0;

        update = () => {
          count += 1;
        };

        apply = () => {
          // Remove data after element with index
          order!.splice(index + 1, count);
        };
      }
    }

    let currentRecord: NodeRecord<TNodeRecordPublic> | null = rootRecord;

    while (currentRecord) {
      if (!currentRecord.visited) {
        updateRecord(currentRecord, id, recordState);

        if (currentRecord !== rootRecord) {
          update(currentRecord);
        }

        currentRecord = visitRecord(currentRecord);
      } else if (currentRecord !== rootRecord) {
        currentRecord = revisitRecord(currentRecord);
      } else {
        revisitRecord(currentRecord);
        currentRecord = null;
      }
    }

    apply();
  }

  return {
    order,
    records,
    updateRequest: {},
  };
};

class Tree<
  TNodeComponentProps extends NodeComponentProps<TData>,
  TNodeRecordPublic extends NodeRecordPublic<TData>,
  TOpennessStateOptions extends OpennessStateOptions,
  TData extends NodeData,
  TProps extends TreeProps<TNodeComponentProps, TData>,
  TState extends TreeState<
    TNodeComponentProps,
    TNodeRecordPublic,
    TOpennessStateOptions,
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
  ): Partial<DefaultTreeState> | null {
    const {treeWalker} = props;
    const {computeTree, order, treeWalker: oldTreeWalker} = state;

    return treeWalker !== oldTreeWalker || !order
      ? computeTree(props, state, {refresh: true})
      : null;
  }

  protected readonly list: React.RefObject<TListComponent> = React.createRef();

  public constructor(props: TProps, context: any) {
    super(props, context);

    this.getRecordData = this.getRecordData.bind(this);

    this.state = {
      recomputeTree: this.recomputeTree.bind(this),
      treeWalker: props.treeWalker,
    } as TState;
  }

  protected getItemData(): TypedListChildComponentData<TData> {
    const {children: component, itemData: treeData} = this.props;

    return {
      component,
      // eslint-disable-next-line @typescript-eslint/unbound-method
      getRecordData: this.getRecordData,
      treeData,
    } as TypedListChildComponentData<TData>;
  }

  protected getRecordData(index: number): TNodeRecordPublic {
    const {order, records} = this.state;

    return records.get(order![index])!.public;
  }

  public recomputeTree(
    options: OpennessState<TOpennessStateOptions>,
  ): Promise<void> {
    return new Promise((resolve) => {
      this.setState<never>(
        (prevState) =>
          prevState.computeTree(this.props, prevState, {
            opennessState: options,
          }),
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
