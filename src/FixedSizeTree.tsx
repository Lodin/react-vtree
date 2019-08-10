import * as React from 'react';
import {Align, FixedSizeList, FixedSizeListProps} from 'react-window';
import {
  CommonNodeComponentProps,
  CommonNodeMetadata,
  CommonNodeRecord,
  CommonUpdateOptions,
  Row,
  TreeProps,
  TreeState,
} from './utils';

export type FixedSizeUpdateOptions = CommonUpdateOptions;
export type FixedSizeNodeMetadata = CommonNodeMetadata;
export type FixedSizeNodeComponentProps = CommonNodeComponentProps;
export type FixedSizeNodeRecord = CommonNodeRecord;

export interface FixedSizeTreeProps
  extends TreeProps<FixedSizeNodeMetadata>,
    Omit<FixedSizeListProps, 'children' | 'itemCount'> {
  readonly children: React.ComponentType<FixedSizeNodeComponentProps>;
}

export type FixedSizeTreeState = TreeState<FixedSizeNodeRecord>;

export default class FixedSizeTree extends React.PureComponent<
  FixedSizeTreeProps,
  FixedSizeTreeState
> {
  public static defaultProps: Partial<FixedSizeTreeProps> = {
    rowComponent: Row,
  };

  public static getDerivedStateFromProps({
    children: component,
    itemData: data,
  }: FixedSizeTreeProps): Partial<FixedSizeTreeState> {
    return {
      component,
      data,
    };
  }

  private readonly list: React.RefObject<FixedSizeList> = React.createRef();

  public constructor(props: FixedSizeTreeProps, context: any) {
    super(props, context);

    this.createNodeRecord = this.createNodeRecord.bind(this);

    const initialState: FixedSizeTreeState = {
      component: props.children,
      order: [],
      records: {},
    };

    this.state = {
      ...initialState,
      ...this.computeTree({refreshNodes: true}, props, initialState),
    };
  }

  public async recomputeTree(options: FixedSizeUpdateOptions): Promise<void> {
    return new Promise(resolve => {
      this.setState<never>(
        prevState => this.computeTree(options, this.props, prevState),
        resolve,
      );
    });
  }

  public scrollTo(scrollOffset: number): void {
    if (this.list.current) {
      this.list.current.scrollTo(scrollOffset);
    }
  }

  public scrollToItem(id: string | symbol, align?: Align): void {
    if (this.list.current) {
      this.list.current.scrollToItem(this.state.order.indexOf(id) || 0, align);
    }
  }

  public render(): React.ReactNode {
    const {children, treeWalker, rowComponent, ...rest} = this.props;

    return (
      <FixedSizeList
        {...rest}
        itemData={this.state}
        itemCount={this.state.order.length}
        ref={this.list}
      >
        {rowComponent!}
      </FixedSizeList>
    );
  }

  private computeTree(
    {refreshNodes = false, useDefaultOpenness = false}: FixedSizeUpdateOptions,
    {treeWalker}: FixedSizeTreeProps,
    {records: prevRecords}: FixedSizeTreeState,
  ): Pick<FixedSizeTreeState, 'order' | 'records'> {
    const order: Array<string | symbol> = [];
    const records = {...prevRecords};
    const iter = treeWalker(refreshNodes);

    let isPreviousOpened = false;

    while (true) {
      const {done, value} = iter.next(isPreviousOpened);

      if (done || !value) {
        break;
      }

      let id: string | symbol;

      if (typeof value === 'string' || typeof value === 'symbol') {
        id = value;

        if (useDefaultOpenness) {
          records[id as string].isOpen =
            records[id as string].metadata.isOpenByDefault;
        }
      } else {
        ({id} = value);
        const {isOpenByDefault} = value;
        const record = records[id as string];

        if (!record) {
          records[id as string] = this.createNodeRecord(value);
        } else {
          record.metadata = value;

          if (useDefaultOpenness) {
            record.isOpen = isOpenByDefault;
          }
        }
      }

      order.push(id);
      isPreviousOpened = records[id as string].isOpen;
    }

    return {
      order,
      records,
    };
  }

  private createNodeRecord(
    metadata: FixedSizeNodeMetadata,
  ): FixedSizeNodeRecord {
    const record: FixedSizeNodeRecord = {
      isOpen: metadata.isOpenByDefault,
      metadata,
      toggle: async () => {
        record.isOpen = !record.isOpen;
        await this.recomputeTree({refreshNodes: record.isOpen});
      },
    };

    return record;
  }
}
