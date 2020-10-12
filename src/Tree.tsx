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
import {DefaultTreeProps, DefaultTreeState, noop} from './utils';

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

export type OpennessStateUpdateRules<
  TData extends NodeData,
  TNodePublicState extends NodePublicState<TData>
> = Readonly<{
  open: boolean;
  subtreeCallback?: (
    node: TNodePublicState,
    ownerNode: TNodePublicState,
  ) => void;
}>;

export type NodePublicState<TData extends NodeData> = Readonly<{
  data: TData;
  toggle: () => Promise<void>;
}> & {
  isOpen: boolean;
};

export type NodeRecord<
  TNodePublicState extends NodePublicState<any>
> = Readonly<{
  public: TNodePublicState;
}> & {
  child: NodeRecord<TNodePublicState> | null;
  isShown: boolean;
  parent: NodeRecord<TNodePublicState> | null;
  sibling: NodeRecord<TNodePublicState> | null;
  visited: boolean;
};

export type NodeComponentProps<
  TData extends NodeData,
  TNodePublicState extends NodePublicState<TData>
> = Readonly<
  Omit<ListChildComponentProps, 'data' | 'index'> &
    TNodePublicState & {
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
  TNodePublicState extends NodePublicState<TData>
> = Readonly<
  Record<string, OpennessStateUpdateRules<TData, TNodePublicState> | boolean>
>;

export type TreeProps<
  TData extends NodeData,
  TNodePublicState extends NodePublicState<TData>
> = Readonly<Omit<ListProps, 'children' | 'itemCount'>> &
  Readonly<{
    children: ComponentType<NodeComponentProps<TData, TNodePublicState>>;
    rowComponent?: ComponentType<ListChildComponentProps>;
    treeWalker: TreeWalker<TData>;
  }>;

export type TreeState<
  TData extends NodeData,
  TNodePublicState extends NodePublicState<TData>
> = Readonly<{
  order?: Array<string | symbol>;
  computeTree: TreeComputer<any, any, any, any>;
  records: ReadonlyMap<string | symbol, NodeRecord<TNodePublicState>>;
  recomputeTree: (
    options: OpennessState<TData, TNodePublicState>,
  ) => Promise<void>;
  treeWalker: TreeWalker<TData>;

  // A simple hack to get over the PureComponent shallow comparison
  updateRequest: object;
}>;

export type TypedListChildComponentData<
  TData extends NodeData,
  TNodePublicState extends NodePublicState<TData>
> = Readonly<{
  component: ComponentType<NodeComponentProps<TData, TNodePublicState>>;
  getRecordData: (index: number) => TNodePublicState;
  treeData: any;
}>;

export type TypedListChildComponentProps<
  TData extends NodeData,
  TNodePublicState extends NodePublicState<TData>
> = Readonly<
  Omit<ListChildComponentProps, 'data'> & {
    data: TypedListChildComponentData<TData, TNodePublicState>;
  }
>;

// eslint-disable-next-line @typescript-eslint/naming-convention,@typescript-eslint/prefer-readonly-parameter-types
export const Row = <
  TData extends NodeData,
  TNodePublicState extends NodePublicState<TData>
>({
  index,
  data: {component: Node, getRecordData, treeData},
  style,
  isScrolling,
}: PropsWithChildren<
  TypedListChildComponentProps<TData, TNodePublicState>
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
  TNodePublicState extends NodePublicState<TData>,
  TState extends TreeState<TData, TNodePublicState>
> = Readonly<{
  createRecord: (
    data: TData,
    state: TState,
    parent?: NodeRecord<TNodePublicState> | null,
  ) => NodeRecord<TNodePublicState>;
}>;

export type TreeComputerOptions<
  TData extends NodeData,
  TNodePublicState extends NodePublicState<TData>
> = Readonly<{
  opennessState?: OpennessState<TData, TNodePublicState>;
  refresh?: boolean;
}>;

export type TreeComputer<
  TData extends NodeData,
  TNodePublicState extends NodePublicState<TData>,
  TProps extends TreeProps<TData, TNodePublicState>,
  TState extends TreeState<TData, TNodePublicState>
> = (
  props: TProps,
  state: TState,
  options: TreeComputerOptions<TData, TNodePublicState>,
) =>
  | (Pick<TState, 'order' | 'records'> & Partial<Pick<TState, 'updateRequest'>>)
  | null;

const ROOTS_STAGE = {};
const TRANSITION_STAGE = {};
const CHILDREN_STAGE = {};

/* eslint-disable @typescript-eslint/prefer-nullish-coalescing */
// If refresh is required, we will run the TreeWalker. It will completely
// update all requests and reset every state to default.
const generateNewTree = <
  TData extends NodeData,
  TNodePublicState extends NodePublicState<TData>,
  TProps extends TreeProps<TData, TNodePublicState>,
  TState extends TreeState<TData, TNodePublicState>
>(
  {createRecord}: TreeCreatorOptions<TData, TNodePublicState, TState>,
  {treeWalker}: TProps,
  state: TState,
): ReturnType<TreeComputer<TData, TNodePublicState, TProps, TState>> => {
  const records = new Map<string | symbol, NodeRecord<TNodePublicState>>();

  const meta = new WeakMap<
    NodeRecord<TNodePublicState>,
    TreeWalkerValue<TData>
  >();

  const iter = treeWalker();
  const {value: root} = iter.next();

  // Each record has a link to a parent, the next sibling and the next child.
  // Having this info, we can perform a depth-first traverse.
  const rootRecord = createRecord(root!.data, state);
  records.set(rootRecord.public.data.id, rootRecord);
  meta.set(rootRecord, root!);

  const order: Array<string | symbol> = [];

  let currentRecord: NodeRecord<TNodePublicState> | null = rootRecord;
  let stage = ROOTS_STAGE;

  while (currentRecord !== null) {
    if (!currentRecord.visited) {
      let tempRecord: NodeRecord<TNodePublicState> | null = currentRecord;

      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition,no-constant-condition
      while (true) {
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
        const {value: child} = iter.next(meta.get(currentRecord)!);

        if (child === undefined) {
          if (stage === ROOTS_STAGE) {
            stage = TRANSITION_STAGE;
          }
          break;
        }

        const isChildrenStage = stage === CHILDREN_STAGE;

        const childRecord = createRecord(
          child.data,
          state,
          isChildrenStage ? currentRecord : undefined,
        );
        records.set(childRecord.public.data.id, childRecord);
        meta.set(childRecord, child);

        if (isChildrenStage && tempRecord === currentRecord) {
          tempRecord.child = childRecord;
        } else {
          tempRecord.sibling = childRecord;
        }

        tempRecord = childRecord;
      }

      if (stage === CHILDREN_STAGE) {
        if (currentRecord.isShown) {
          order.push(currentRecord.public.data.id);
        }

        currentRecord.visited = currentRecord.child !== null;
        currentRecord =
          currentRecord.child || currentRecord.sibling || currentRecord.parent;
      } else {
        stage = CHILDREN_STAGE;
      }
    } else {
      currentRecord.visited = false;
      currentRecord = currentRecord.sibling || currentRecord.parent;
    }
  }

  return {
    order,
    records,
  };
};

// If we need to perform only the update, treeWalker won't be used. Update will
// work internally, traversing only the subtree of elements that require
// update through the opennessState option.
const updateExistingTree = <
  TData extends NodeData,
  TNodePublicState extends NodePublicState<TData>,
  TProps extends TreeProps<TData, TNodePublicState>,
  TState extends TreeState<TData, TNodePublicState>
>(
  {order, records}: TState,
  {opennessState}: TreeComputerOptions<TData, TNodePublicState>,
): ReturnType<TreeComputer<TData, TNodePublicState, TProps, TState>> => {
  if (typeof opennessState !== 'object') {
    return null;
  }

  for (const id in opennessState) {
    if (!records.has(id)) {
      continue;
    }

    const opts = opennessState[id];
    const ownerRecord = records.get(id)!;

    // Here we unify the shape of openness state options
    const {
      open,
      subtreeCallback = noop,
    }: OpennessStateUpdateRules<TData, TNodePublicState> =
      typeof opts === 'boolean' ? {open: opts} : opts;

    let update: (record: NodeRecord<TNodePublicState>) => void = noop;
    let apply: () => void = noop;

    if (ownerRecord.isShown) {
      if (open && !ownerRecord.public.isOpen) {
        const orderPart: Array<string | symbol> = [];
        const index = order!.indexOf(id);

        update = (record: NodeRecord<TNodePublicState>) => {
          if (record.isShown) {
            orderPart.push(record.public.data.id);
          }
        };

        apply = () => {
          order!.splice(index + 1, 0, ...orderPart);
        };
      } else if (!open && ownerRecord.public.isOpen) {
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

    let currentRecord: NodeRecord<TNodePublicState> | null = ownerRecord;

    while (currentRecord !== null) {
      if (!currentRecord.visited) {
        currentRecord.public.isOpen =
          currentRecord === ownerRecord ? open : currentRecord.public.isOpen;

        subtreeCallback(currentRecord.public, ownerRecord.public);

        const {parent} = currentRecord;
        currentRecord.isShown = parent
          ? parent.public.isOpen && parent.isShown
          : true;

        if (currentRecord !== ownerRecord) {
          update(currentRecord);
        }

        currentRecord.visited = !!currentRecord.child;
        currentRecord =
          currentRecord.child || currentRecord.sibling || currentRecord.parent;
      } else {
        currentRecord.visited = false;
        currentRecord =
          currentRecord === ownerRecord
            ? null
            : currentRecord.sibling || currentRecord.parent;
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
/* eslint-enable @typescript-eslint/prefer-nullish-coalescing */

export const createTreeComputer = <
  TData extends NodeData,
  TNodePublicState extends NodePublicState<TData>,
  TProps extends TreeProps<TData, TNodePublicState>,
  TState extends TreeState<TData, TNodePublicState>
>(
  creatorOptions: TreeCreatorOptions<TData, TNodePublicState, TState>,
): TreeComputer<TData, TNodePublicState, TProps, TState> => (
  props,
  state,
  options,
) =>
  options.refresh
    ? generateNewTree(creatorOptions, props, state)
    : updateExistingTree(state, options);

class Tree<
  TData extends NodeData,
  TNodePublicState extends NodePublicState<TData>,
  TProps extends TreeProps<TData, TNodePublicState>,
  TState extends TreeState<TData, TNodePublicState>,
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
    TNodePublicState
  > {
    const {children: component, itemData: treeData} = this.props;

    return {
      component,
      // eslint-disable-next-line @typescript-eslint/unbound-method
      getRecordData: this.getRecordData,
      treeData,
    };
  }

  protected getRecordData(index: number): TNodePublicState {
    const {order, records} = this.state;

    return records.get(order![index])!.public;
  }

  public recomputeTree(
    state: OpennessState<TData, TNodePublicState>,
  ): Promise<void> {
    return new Promise((resolve) => {
      this.setState<never>(
        (prevState) =>
          prevState.computeTree(this.props, prevState, {
            opennessState: state,
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
