/* eslint-disable react/no-unused-state,@typescript-eslint/consistent-type-assertions,no-labels,max-depth,complexity */
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

export type TreeWalkerValue<TData extends NodeData, TMeta = {}> = Readonly<
  {data: TData} & TMeta
>;

export type OpennessStateOptions<
  TData extends NodeData,
  TNodeRecordPublic extends NodeRecordPublic<TData>
> = Readonly<{
  open: boolean;
  subtreeCallback?: (
    node: TNodeRecordPublic,
    rootNode: TNodeRecordPublic,
  ) => void;
}>;

export type NodeRecordPublic<TData extends NodeData> = Readonly<{
  data: TData;
  toggle: () => Promise<void>;
}> & {
  isOpen: boolean;
};

export type NodeRecord<
  TNodeRecordPublic extends NodeRecordPublic<any>
> = Readonly<{
  public: TNodeRecordPublic;
}> & {
  child: NodeRecord<TNodeRecordPublic> | null;
  isShown: boolean;
  parent: NodeRecord<TNodeRecordPublic> | null;
  sibling: NodeRecord<TNodeRecordPublic> | null;
  visited: boolean;
};

export type NodeComponentProps<
  TData extends NodeData,
  TNodeRecordPublic extends NodeRecordPublic<TData>
> = Readonly<
  Omit<ListChildComponentProps, 'data' | 'index'> &
    TNodeRecordPublic & {
      treeData?: any;
    }
>;

export type TreeWalker<TData extends NodeData, TMeta = {}> = () => Generator<
  TreeWalkerValue<TData, TMeta> | undefined,
  undefined,
  TreeWalkerValue<TData, TMeta>
>;

export type OpennessState<
  TData extends NodeData,
  TNodeRecordPublic extends NodeRecordPublic<TData>
> = Readonly<
  Record<string, OpennessStateOptions<TData, TNodeRecordPublic> | boolean>
>;

export type TreeProps<
  TData extends NodeData,
  TNodeRecordPublic extends NodeRecordPublic<TData>
> = Readonly<Omit<ListProps, 'children' | 'itemCount'>> &
  Readonly<{
    children: ComponentType<NodeComponentProps<TData, TNodeRecordPublic>>;
    rowComponent?: ComponentType<ListChildComponentProps>;
    treeWalker: TreeWalker<TData>;
  }>;

export type TreeState<
  TData extends NodeData,
  TNodeRecordPublic extends NodeRecordPublic<TData>
> = Readonly<{
  order?: Array<string | symbol>;
  computeTree: TreeComputer<any, any, any, any>;
  records: ReadonlyMap<string | symbol, NodeRecord<TNodeRecordPublic>>;
  recomputeTree: (
    options: OpennessState<TData, TNodeRecordPublic>,
  ) => Promise<void>;
  treeWalker: TreeWalker<TData>;

  // A simple hack to get over the PureComponent shallow comparison
  updateRequest: object;
}>;

export type TypedListChildComponentData<
  TData extends NodeData,
  TNodeRecordPublic extends NodeRecordPublic<TData>
> = Readonly<{
  component: ComponentType<NodeComponentProps<TData, TNodeRecordPublic>>;
  getRecordData: (index: number) => TNodeRecordPublic;
  treeData: any;
}>;

export type TypedListChildComponentProps<
  TData extends NodeData,
  TNodeRecordPublic extends NodeRecordPublic<TData>
> = Readonly<
  Omit<ListChildComponentProps, 'data'> & {
    data: TypedListChildComponentData<TData, TNodeRecordPublic>;
  }
>;

// eslint-disable-next-line @typescript-eslint/naming-convention,@typescript-eslint/prefer-readonly-parameter-types
export const Row = <
  TData extends NodeData,
  TNodeRecordPublic extends NodeRecordPublic<TData>
>({
  index,
  data: {component: Node, getRecordData, treeData},
  style,
  isScrolling,
}: PropsWithChildren<
  TypedListChildComponentProps<TData, TNodeRecordPublic>
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
  TData extends NodeData,
  TNodeRecordPublic extends NodeRecordPublic<TData>,
  TState extends TreeState<TData, TNodeRecordPublic>
> = Readonly<{
  createRecord: (
    data: TData,
    state: TState,
    parent?: NodeRecord<TNodeRecordPublic> | null,
  ) => NodeRecord<TNodeRecordPublic>;
}>;

export type TreeComputerOptions<
  TData extends NodeData,
  TNodeRecordPublic extends NodeRecordPublic<TData>
> = Readonly<{
  opennessState?: OpennessState<TData, TNodeRecordPublic>;
  refresh?: boolean;
}>;

export type TreeComputer<
  TData extends NodeData,
  TNodeRecordPublic extends NodeRecordPublic<TData>,
  TProps extends TreeProps<TData, TNodeRecordPublic>,
  TState extends TreeState<TData, TNodeRecordPublic>
> = (
  props: TProps,
  state: TState,
  options: TreeComputerOptions<TData, TNodeRecordPublic>,
) =>
  | (Pick<TState, 'order' | 'records'> & Partial<Pick<TState, 'updateRequest'>>)
  | null;

// If refresh is required, we will run the TreeWalker. It will completely
// update all requests and reset every state to default.
const generateNewTree = <
  TData extends NodeData,
  TNodeRecordPublic extends NodeRecordPublic<TData>,
  TProps extends TreeProps<TData, TNodeRecordPublic>,
  TState extends TreeState<TData, TNodeRecordPublic>
>(
  {createRecord}: TreeCreatorOptions<TData, TNodeRecordPublic, TState>,
  {treeWalker}: TProps,
  state: TState,
): ReturnType<TreeComputer<TData, TNodeRecordPublic, TProps, TState>> => {
  const records = new Map<string | symbol, NodeRecord<TNodeRecordPublic>>();

  // This WeakMap will preserve iterations result; they will be used for sending
  // the node info back to the treeWalker. Also, we have to preserve the whole
  // iterator result to avoid unnecessary GC.
  const meta = new WeakMap<
    NodeRecord<TNodeRecordPublic>,
    IteratorResult<TreeWalkerValue<TData> | undefined>
  >();

  const iter = treeWalker();
  let iteration = iter.next();

  // Each record has a link to a parent, the next sibling and the next child.
  // Having this info, we can perform a depth-first traverse.
  const rootRecord = createRecord(iteration.value!.data, state);
  records.set(rootRecord.public.data.id, rootRecord);
  meta.set(rootRecord, iteration);

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
        iteration = iter.next(meta.get(currentRecord)!.value);

        if (!iteration.value) {
          break;
        }

        const childRecord = createRecord(
          iteration.value.data,
          state,
          currentRecord,
        );
        records.set(childRecord.public.data.id, childRecord);
        meta.set(childRecord, iteration);

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
};

const updateRecord = <
  TData extends NodeData,
  TNodeRecordPublic extends NodeRecordPublic<TData>
>(
  record: NodeRecord<TNodeRecordPublic>,
  rootRecord: NodeRecord<TNodeRecordPublic>,
  {
    open,
    subtreeCallback = noop,
  }: OpennessStateOptions<TData, TNodeRecordPublic>,
) => {
  record.public.isOpen = record === rootRecord ? open : record.public.isOpen;

  subtreeCallback(record.public, rootRecord.public);

  const {parent} = record;
  record.isShown = parent ? parent.public.isOpen && parent.isShown : true;
};

// If we need to perform only the update, treeWalker won't be used. Update will
// work internally, traversing only the subtree of elements that require
// update through the opennessState option.
const updateExistingTree = <
  TData extends NodeData,
  TNodeRecordPublic extends NodeRecordPublic<TData>,
  TProps extends TreeProps<TData, TNodeRecordPublic>,
  TState extends TreeState<TData, TNodeRecordPublic>
>(
  {order, records}: TState,
  {opennessState}: TreeComputerOptions<TData, TNodeRecordPublic>,
): ReturnType<TreeComputer<TData, TNodeRecordPublic, TProps, TState>> => {
  if (typeof opennessState !== 'object') {
    return null;
  }

  for (const id in opennessState) {
    if (!records.has(id)) {
      continue;
    }

    const opts = opennessState[id];
    const rootRecord = records.get(id)!;

    // Here we unify the shape of openness state options
    const recordState: OpennessStateOptions<TData, TNodeRecordPublic> =
      typeof opts === 'boolean' ? {open: opts} : opts;

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
        updateRecord(currentRecord, rootRecord, recordState);

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

export const createTreeComputer = <
  TData extends NodeData,
  TNodeRecordPublic extends NodeRecordPublic<TData>,
  TProps extends TreeProps<TData, TNodeRecordPublic>,
  TState extends TreeState<TData, TNodeRecordPublic>
>(
  creatorOptions: TreeCreatorOptions<TData, TNodeRecordPublic, TState>,
): TreeComputer<TData, TNodeRecordPublic, TProps, TState> => (
  props,
  state,
  options,
) =>
  options.refresh
    ? generateNewTree(creatorOptions, props, state)
    : updateExistingTree(state, options);

class Tree<
  TData extends NodeData,
  TNodeRecordPublic extends NodeRecordPublic<TData>,
  TProps extends TreeProps<TData, TNodeRecordPublic>,
  TState extends TreeState<TData, TNodeRecordPublic>,
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

  protected getItemData(): TypedListChildComponentData<
    TData,
    TNodeRecordPublic
  > {
    const {children: component, itemData: treeData} = this.props;

    return {
      component,
      // eslint-disable-next-line @typescript-eslint/unbound-method
      getRecordData: this.getRecordData,
      treeData,
    };
  }

  protected getRecordData(index: number): TNodeRecordPublic {
    const {order, records} = this.state;

    return records.get(order![index])!.public;
  }

  public recomputeTree(
    options: OpennessState<TData, TNodeRecordPublic>,
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
