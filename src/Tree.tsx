import {
  type Component,
  type ComponentType,
  createRef,
  type PropsWithChildren,
  PureComponent,
  type ReactElement,
  type ReactNode,
  type Ref,
  type RefObject,
} from 'react';
import { mergeRefs } from 'react-merge-refs';
import type {
  Align,
  FixedSizeList,
  ListChildComponentProps,
  ListProps,
  VariableSizeList,
} from 'react-window';
import {
  type DefaultTreeProps,
  type DefaultTreeState,
  noop,
  type RequestIdleCallbackDeadline,
} from './utils.ts';

export type NodeData = Readonly<{
  /**
   * Unique ID of the current node.
   */
  id: string;

  /**
   * Default node openness state. If the Tree component performs building a new
   * Tree and the preservePreviousState prop is not set, this value will be used
   * to set the openness state of the node.
   */
  isOpenByDefault: boolean;
}>;

export type TreeWalkerValue<TData extends NodeData, TMeta = {}> = Readonly<
  { data: TData } & TMeta
>;

export type OpennessStateUpdateRules<
  TData extends NodeData,
  TNodePublicState extends NodePublicState<TData>,
> = Readonly<{
  open: boolean;
  subtreeCallback?(node: TNodePublicState, ownerNode: TNodePublicState): void;
}>;

export type NodePublicState<TData extends NodeData> = Readonly<{
  data: TData;
  setOpen(state: boolean): Promise<void>;
}> & {
  isOpen: boolean;
};

export type NodeRecord<TNodePublicState extends NodePublicState<any>> =
  Readonly<{
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
  TNodePublicState extends NodePublicState<TData>,
> = Readonly<
  Omit<ListChildComponentProps, 'data' | 'index'> &
    TNodePublicState & {
      /**
       * The data provided by user via `itemData` Tree component property.
       */
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
  TNodePublicState extends NodePublicState<TData>,
> = Readonly<
  Record<string, OpennessStateUpdateRules<TData, TNodePublicState> | boolean>
>;

export type TreeComputerProps<TData extends NodeData> = Readonly<{
  async?: boolean;
  buildingTaskTimeout?: number;
  placeholder?: ReactNode;
  treeWalker: TreeWalker<TData>;
}>;

export type TreeComputerState<
  TData extends NodeData,
  TNodePublicState extends NodePublicState<TData>,
> = Readonly<{
  order?: string[];
  records: ReadonlyMap<string | symbol, NodeRecord<TNodePublicState>>;
  setState: Component<
    any,
    TreeComputerState<TData, TNodePublicState>
  >['setState'];
  // A simple hack to get over the PureComponent shallow comparison
  updateRequest: object;
}>;

export type TreeProps<
  TData extends NodeData,
  TNodePublicState extends NodePublicState<TData>,
  TListComponent extends FixedSizeList | VariableSizeList,
> = Readonly<Omit<ListProps, 'children' | 'itemCount' | 'itemKey'>> &
  TreeComputerProps<TData> &
  Readonly<{
    children: ComponentType<NodeComponentProps<TData, TNodePublicState>>;
    listRef?: Ref<TListComponent>;
    rowComponent?: ComponentType<ListChildComponentProps>;
  }>;

export type TreeState<
  TData extends NodeData,
  TNodePublicState extends NodePublicState<TData>,
  TListComponent extends FixedSizeList | VariableSizeList,
> = TreeComputerState<TData, TNodePublicState> &
  Readonly<{
    attachRefs: Ref<TListComponent>;
    computeTree: TreeComputer<any, any, any, any>;
    list: RefObject<TListComponent | null>;
    recomputeTree(
      options: OpennessState<TData, TNodePublicState>,
    ): Promise<void>;
    treeWalker: TreeWalker<TData>;
  }>;

export type TypedListChildComponentData<
  TData extends NodeData,
  TNodePublicState extends NodePublicState<TData>,
> = Readonly<{
  /**
   * The Node component provided by the user.
   */
  component: ComponentType<NodeComponentProps<TData, TNodePublicState>>;

  /**
   * The function that returns public data from visible records by index.
   *
   * @param index
   */
  getRecordData(index: number): TNodePublicState;

  /**
   * @see NodeComponentProps#treeData
   */
  treeData: any;
}>;

export type TypedListChildComponentProps<
  TData extends NodeData,
  TNodePublicState extends NodePublicState<TData>,
> = Readonly<
  Omit<ListChildComponentProps, 'data'> & {
    data: TypedListChildComponentData<TData, TNodePublicState>;
  }
>;

export const Row = <
  TData extends NodeData,
  TNodePublicState extends NodePublicState<TData>,
>({
  index,
  data: { component: Node, getRecordData, treeData },
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
  TState extends TreeComputerState<TData, TNodePublicState>,
> = Readonly<{
  createRecord(
    data: TData,
    state: TState,
    parent?: NodeRecord<TNodePublicState> | null,
    previousRecord?: NodeRecord<TNodePublicState>,
  ): NodeRecord<TNodePublicState>;
}>;

export type TreeComputerOptions<
  TData extends NodeData,
  TNodePublicState extends NodePublicState<TData>,
> = Readonly<{
  opennessState?: OpennessState<TData, TNodePublicState>;
  refresh?: boolean;
}>;

export type TreeComputer<
  TData extends NodeData,
  TNodePublicState extends NodePublicState<TData>,
  TProps extends TreeComputerProps<TData>,
  TState extends TreeComputerState<TData, TNodePublicState>,
> = (
  props: TProps,
  state: TState,
  options: TreeComputerOptions<TData, TNodePublicState>,
) =>
  | (Pick<TState, 'order' | 'records'> & Partial<Pick<TState, 'updateRequest'>>)
  | null;

const defaultDeadline: RequestIdleCallbackDeadline = {
  didTimeout: false,
  timeRemaining: () => 1,
};

// If refresh is required, we will run the TreeWalker. It will completely
// update all requests and reset every state to default.
const generateNewTree = <
  TData extends NodeData,
  TNodePublicState extends NodePublicState<TData>,
  TProps extends TreeComputerProps<TData>,
  TState extends TreeComputerState<TData, TNodePublicState>,
>(
  { createRecord }: TreeCreatorOptions<TData, TNodePublicState, TState>,
  { buildingTaskTimeout, placeholder, async, treeWalker }: TProps,
  state: TState,
): ReturnType<TreeComputer<TData, TNodePublicState, TProps, TState>> => {
  const shouldPreservePreviousState = async && state.records !== undefined;
  const { records: previousRecords } = state;

  const order: string[] = [];
  const records = new Map<string | symbol, NodeRecord<TNodePublicState>>();
  const requestIdleCallbackOptions = buildingTaskTimeout
    ? { timeout: buildingTaskTimeout }
    : undefined;

  const meta = new WeakMap<
    NodeRecord<TNodePublicState>,
    TreeWalkerValue<TData>
  >();

  const iter = treeWalker();
  const { value: root } = iter.next();

  if (!root) {
    throw new Error(
      'TreeWalker must yield at least one root node on the first iteration.',
    );
  }

  // Each record has a link to a parent, the next sibling and the next child.
  // Having this info, we can perform a depth-first traverse.
  const rootRecord = createRecord(
    root.data,
    state,
    undefined,
    shouldPreservePreviousState ? previousRecords.get(root.data.id) : undefined,
  );
  records.set(rootRecord.public.data.id, rootRecord);
  meta.set(rootRecord, root);

  let currentRecord: NodeRecord<TNodePublicState> | null = rootRecord;
  let isTraversingRoot = true;
  let tempRecord: NodeRecord<TNodePublicState> | null = rootRecord;

  const useIdleCallback =
    typeof requestIdleCallback !== 'undefined' &&
    placeholder !== undefined &&
    // If placeholder is set to null and this is the first build, idle callback
    // won't be used. It is necessary for trees with async data which can be
    // extremely complex but the first build is quite easy. During the following
    // idle callbacks the old tree will be shown.
    !(placeholder === null && !state.order);

  const task = (deadline: RequestIdleCallbackDeadline = defaultDeadline) => {
    while (currentRecord !== null) {
      if (deadline.timeRemaining() <= 0) {
        requestIdleCallback(task, requestIdleCallbackOptions);

        return;
      }

      if (!currentRecord.visited) {
        const { value: child } = iter.next(meta.get(currentRecord)!);

        // When the generator returns the undefined value we consider that all
        // children are already sent and we need to select the new parent
        // element to get its children.
        if (child === undefined) {
          if (isTraversingRoot) {
            isTraversingRoot = false;
          } else {
            if (currentRecord.isShown) {
              order.push(currentRecord.public.data.id);
            }

            currentRecord.visited = currentRecord.child !== null;

            currentRecord =
              currentRecord.child ??
              currentRecord.sibling ??
              currentRecord.parent;
          }

          tempRecord = currentRecord;
          continue;
        }

        const childRecord = createRecord(
          child.data,
          state,
          isTraversingRoot ? undefined : currentRecord,
          shouldPreservePreviousState
            ? previousRecords.get(child.data.id)
            : undefined,
        );
        records.set(childRecord.public.data.id, childRecord);
        meta.set(childRecord, child);

        if (!isTraversingRoot && tempRecord === currentRecord) {
          tempRecord.child = childRecord;
        } else {
          // `tempRecord` is the last record that was linked while traversing the
          // current DFS branch. At this point we are still inside
          // `while (currentRecord !== null)`, so the traversal has not been
          // exhausted, and the only way to reach this `else` branch is after at
          // least one record has already been established as the previous node
          // for the sibling we are about to attach:
          //
          // - initially `tempRecord` is `rootRecord`;
          // - after finishing a node we copy `currentRecord` into `tempRecord`;
          // - after creating any child record we immediately assign that child
          //   back to `tempRecord`.
          //
          // In other words, `tempRecord` only becomes `null` when the traversal
          // itself has already fallen off the tree, and that state cannot
          // coincide with creating a fresh `childRecord` to append here. This is
          // therefore an internal invariant of the traversal state machine, not
          // user input validation, so we keep the hot path branch-free and
          // assert it locally with `!`.
          tempRecord!.sibling = childRecord;
        }

        tempRecord = childRecord;
      } else {
        currentRecord.visited = false;
        currentRecord = currentRecord.sibling ?? currentRecord.parent;
        tempRecord = currentRecord;
      }
    }

    if (useIdleCallback) {
      state.setState({
        order,
        records,
        updateRequest: {},
      });
    }
  };

  if (useIdleCallback) {
    requestIdleCallback(task, requestIdleCallbackOptions);
  } else {
    task();
  }

  // If we want to preserve the previous state and use the requestIdleCallback,
  // we need to return the old state.
  return placeholder !== undefined && async && state.order
    ? state
    : { order, records };
};

const MAX_FUNCTION_ARGUMENTS = 32768;
const SPLICE_DEFAULT_ARGUMENTS_NUMBER = 2;

// If we need to perform only the update, treeWalker won't be used. Update will
// work internally, traversing only the subtree of elements that require
// update through the opennessState option.
const updateExistingTree = <
  TData extends NodeData,
  TNodePublicState extends NodePublicState<TData>,
  TProps extends TreeComputerProps<TData>,
  TState extends TreeComputerState<TData, TNodePublicState>,
>(
  { order, records }: TState,
  { opennessState }: TreeComputerOptions<TData, TNodePublicState>,
): ReturnType<TreeComputer<TData, TNodePublicState, TProps, TState>> => {
  if (typeof opennessState !== 'object') {
    return null;
  }

  // Recompute/update only makes sense after the first successful tree build.
  // If it is requested earlier, fall back to a no-op and let the normal
  // refresh path populate `order`.
  if (!order) {
    return null;
  }

  for (const id in opennessState) {
    if (!records.has(id)) {
      continue;
    }

    // Safe after the membership check above: we only process ids that are
    // present both in the update payload and in the current records map.
    const opts = opennessState[id]!;
    const ownerRecord = records.get(id)!;

    // Here we unify the shape of openness state options
    const {
      open,
      subtreeCallback = () => {},
    }: OpennessStateUpdateRules<TData, TNodePublicState> =
      typeof opts === 'boolean' ? { open: opts } : opts;

    let update: (record: NodeRecord<TNodePublicState>) => void = noop;
    let apply: () => void = noop;

    if (ownerRecord.isShown) {
      if (open) {
        // If received rules require us to open the subtree, we have 2 cases:
        // 1. The node is not opened yet. In this case we simply have to
        // calculate and add new ids.
        // 2. The node is opened already. In this case we have to remove all
        // existing ids and replace them with new ids.

        const index = order.indexOf(id);

        // Here we calculate a count of visible subtree nodes to remove from
        // `order`. Then we will replace the gap with the updated list of
        // subtree nodes.
        let recordNextToSubtree: NodeRecord<TNodePublicState> | null =
          ownerRecord;

        while (recordNextToSubtree !== null) {
          if (recordNextToSubtree.sibling !== null) {
            recordNextToSubtree = recordNextToSubtree.sibling;
            break;
          }

          recordNextToSubtree = recordNextToSubtree.parent;
        }

        const countToRemove =
          recordNextToSubtree === null
            ? order.length - 1 - index
            : order.indexOf(recordNextToSubtree.public.data.id) - 1 - index;

        const orderParts: Array<Array<number | string | symbol>> = [
          [index + 1, countToRemove],
        ];

        // Unfortunately, splice cannot work with big arrays. If array exceeds
        // some length it may fire an exception. The length is specific for
        // each engine; e.g., MDN says about 65536 for Webkit. So, to avoid this
        // overflow, I split `order` parts to chunks by 32768 elements in each
        // one. These chunks will be sent as arguments to the `splice` method.
        //
        // To avoid array concatenations which may cause Major GC, I set two
        // first arguments as `splice`'s `start` and `deleteCount` arguments.
        update = (record: NodeRecord<TNodePublicState>) => {
          // We have to consider only the newly shown elements that are not in
          // the order list yet. We should do it AFTER the visibility update
          // happens because otherwise we won't be able to distinguish if the
          // element should be included in the order list.

          // Update record visibility
          record.isShown = record.parent
            ? record.parent.public.isOpen && record.parent.isShown
            : true;

          if (record.isShown) {
            const currentOrderPart = orderParts[orderParts.length - 1]!;
            currentOrderPart.push(record.public.data.id);

            if (
              currentOrderPart.length ===
              MAX_FUNCTION_ARGUMENTS + SPLICE_DEFAULT_ARGUMENTS_NUMBER
            ) {
              orderParts.push([
                index + 1 + MAX_FUNCTION_ARGUMENTS * orderParts.length,
                0,
              ]);
            }
          }
        };

        apply = () => {
          for (let i = 0; i < orderParts.length; i++) {
            // @ts-expect-error: too generic for TS
            order.splice(...orderParts[i]);
          }
        };
      } else if (ownerRecord.public.isOpen) {
        // If received rules require us to close the subtree, we have to remove
        // all subtree ids from the order list.

        const index = order.indexOf(id);

        let count = 0;

        update = (record) => {
          // We have to consider only currently visible subtree nodes BEFORE
          // their visibility is updated. Otherwise we will have incorrect
          // number of items to remove: we cannot remove elements that are not
          // in the order list.
          //
          // If we do it after the visibility update, we will be unable to
          // understand if the element is still in the order list.
          if (record.isShown) {
            count += 1;
          }

          // Update record visibility
          record.isShown = record.parent
            ? record.parent.public.isOpen && record.parent.isShown
            : true;
        };

        apply = () => {
          // Remove data after element with index
          order.splice(index + 1, count);
        };
      }
    }

    let currentRecord: NodeRecord<TNodePublicState> | null = ownerRecord;

    while (currentRecord !== null) {
      if (!currentRecord.visited) {
        currentRecord.public.isOpen =
          currentRecord === ownerRecord ? open : currentRecord.public.isOpen;

        subtreeCallback(currentRecord.public, ownerRecord.public);

        if (currentRecord !== ownerRecord) {
          update(currentRecord);
        }

        currentRecord.visited = currentRecord.child !== null;

        // This algorithm is a bit different from the visit algorithm in the
        // tree generator. We are restricted with the bounds of a subtree and
        // shouldn't go over it. So we cannot search for the ownerRecord's
        // parent or sibling because it will lead us out of the subtree.
        currentRecord =
          // Look for child in any case
          currentRecord.child ?? // Stop looking for next element if currentRecord is root.
          (currentRecord === ownerRecord
            ? null
            : // Otherwise, look for sibling or parent
              (currentRecord.sibling ?? currentRecord.parent));
      } else {
        currentRecord.visited = false;
        currentRecord =
          currentRecord === ownerRecord
            ? null
            : (currentRecord.sibling ?? currentRecord.parent);
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

export const createTreeComputer =
  <
    TData extends NodeData,
    TNodePublicState extends NodePublicState<TData>,
    TProps extends TreeComputerProps<TData>,
    TState extends TreeComputerState<TData, TNodePublicState>,
  >(
    creatorOptions: TreeCreatorOptions<TData, TNodePublicState, TState>,
  ): TreeComputer<TData, TNodePublicState, TProps, TState> =>
  (props, state, options) =>
    options.refresh
      ? generateNewTree(creatorOptions, props, state)
      : updateExistingTree(state, options);

class Tree<
  TData extends NodeData,
  TNodePublicState extends NodePublicState<TData>,
  TProps extends TreeProps<TData, TNodePublicState, TListComponent>,
  TState extends TreeState<TData, TNodePublicState, TListComponent>,
  TListComponent extends FixedSizeList | VariableSizeList,
> extends PureComponent<TProps, TState> {
  static defaultProps: Partial<DefaultTreeProps> = {
    rowComponent: Row,
  };

  static getDerivedStateFromProps(
    props: DefaultTreeProps,
    state: DefaultTreeState,
  ): Partial<DefaultTreeState> | null {
    const { listRef, treeWalker } = props;
    const { computeTree, list, order, treeWalker: oldTreeWalker } = state;

    return {
      attachRefs: mergeRefs([list, listRef]),
      ...(treeWalker !== oldTreeWalker || !order
        ? computeTree(props, state, { refresh: true })
        : null),
      treeWalker,
    };
  }

  constructor(props: TProps, context: any) {
    super(props, context);

    this.getRecordData = this.getRecordData.bind(this);

    // oxlint-disable-next-line typescript/no-unsafe-type-assertion,typescript/consistent-type-assertions
    this.state = {
      list: createRef(),
      recomputeTree: this.recomputeTree.bind(this),
      setState: this.setState.bind(this),
    } as TState;
  }

  protected getItemData(): TypedListChildComponentData<
    TData,
    TNodePublicState
  > {
    const { children: component, itemData: treeData } = this.props;

    return {
      component,

      getRecordData: this.getRecordData,
      treeData,
    };
  }

  protected getRecordData(index: number): TNodePublicState {
    const { order, records } = this.state;
    // `react-window` requests rows only within the advertised `itemCount`,
    // which is derived from `order.length` by the concrete tree components.
    return records.get(order![index]!)!.public;
  }

  async recomputeTree(
    state: OpennessState<TData, TNodePublicState>,
  ): Promise<void> {
    return await new Promise((resolve) => {
      this.setState<never>(
        (prevState) =>
          prevState.computeTree(this.props, prevState, {
            opennessState: state,
          }),
        resolve,
      );
    });
  }

  scrollTo(scrollOffset: number): void {
    this.state.list.current?.scrollTo(scrollOffset);
  }

  scrollToItem(id: string, align?: Align): void {
    const { order } = this.state;

    if (!order) {
      return;
    }

    this.state.list.current?.scrollToItem(order.indexOf(id), align);
  }
}

export default Tree;
