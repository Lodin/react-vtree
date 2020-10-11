/* eslint-disable react/no-unused-state,@typescript-eslint/consistent-type-assertions */
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
import {DefaultTreeProps, DefaultTreeState} from './utils';

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

export type UpdateOptions = Readonly<{
  opennessState?: Readonly<Record<string, boolean>>;
  refreshNodes?: boolean;
  useDefaultOpenness?: boolean;
}>;

export type NodeRecord<TData extends NodeData> = {
  data: TData;
  isOpen: boolean;
  readonly toggle: () => Promise<void>;
};

export type NodeComponentProps<TData extends NodeData> = Readonly<
  Omit<ListChildComponentProps, 'data' | 'index'>
> &
  Readonly<{
    data: TData;
    isOpen: boolean;
    toggle: () => void;
    treeData?: any;
  }>;

export type TreeWalker<T> = (
  refresh: boolean,
) => Generator<T | string | symbol, void, boolean>;

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
  records: Readonly<Record<string, TNodeRecord | undefined>>;
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
>): ReactElement | null => (
  <Node
    {...records[order![index] as string]!}
    style={style}
    isScrolling={isScrolling}
    treeData={treeData}
  />
);

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
    data: TData,
    options: TUpdateOptions,
    state: TState,
  ) => TNodeRecord;
  shouldUpdateRecords: (options: TUpdateOptions) => boolean;
  updateRecord: (
    record: TNodeRecord,
    recordId: string | symbol,
    options: TUpdateOptions,
  ) => void;
  updateRecordOnNewData: (record: TNodeRecord, options: TUpdateOptions) => void;
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
  shouldUpdateRecords,
  updateRecord,
  updateRecordOnNewData,
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
): Pick<TreeState<any, any, any, any>, 'order' | 'records'> => {
  const order: Array<string | symbol> = [];
  const records = {...state.records};
  const iter = treeWalker(options.refreshNodes ?? false);

  // Here we are updating all records to the provided openness state described
  // in UpdateOptions. It should be done before the tree re-calculation
  // because tree walker omits closed nodes while update is required for all
  // of them.
  if (shouldUpdateRecords(options)) {
    for (const id in records) {
      updateRecord(records[id]!, id, options);
    }
  }

  let isPreviousOpened = false;

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition,no-constant-condition
  while (true) {
    const {done, value} = iter.next(isPreviousOpened);

    if (done || !value) {
      break;
    }

    let id: string | symbol;

    if (typeof value === 'string' || typeof value === 'symbol') {
      id = value;
    } else {
      ({id} = value);
      const record = records[id as string];

      if (!record) {
        records[id as string] = createRecord(value, options, state);
      } else {
        record.data = value;
        updateRecordOnNewData(record, options);
      }
    }

    if (records[id as string]) {
      order.push(id);
      isPreviousOpened = records[id as string]!.isOpen;
    } else if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.error(`No record with id ${String(id)} found.`);
    }
  }

  return {
    order,
    records,
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
