import * as React from 'react';
import {Align, VariableSizeList, VariableSizeListProps} from 'react-window';
import {
  CommonNodeComponentProps,
  CommonNodeMetadata,
  CommonNodeRecord,
  CommonUpdateOptions,
  Row,
  TreeProps,
  TreeState,
} from './utils';

export interface VariableSizeUpdateOptions extends CommonUpdateOptions {
  readonly useDefaultHeight?: boolean;
}

export interface VariableSizeNodeMetadata extends CommonNodeMetadata {
  /** Default node height. Can be used only with VariableSizeTree */
  readonly defaultHeight: number;
}

export interface VariableSizeNodeComponentProps
  extends CommonNodeComponentProps {
  readonly height: number;
  readonly resize: (height: number, shouldForceUpdate?: boolean) => void;
}

export interface VariableSizeNodeRecord extends CommonNodeRecord {
  height: number;
  metadata: VariableSizeNodeMetadata;
  readonly resize: (height: number) => void;
}

export interface VariableSizeTreeProps
  extends TreeProps<VariableSizeNodeMetadata>,
    Omit<VariableSizeListProps, 'children' | 'itemCount' | 'itemSize'> {
  readonly children: React.ComponentType<VariableSizeNodeComponentProps>;
  readonly itemSize?: VariableSizeListProps['itemSize'];
}

export type VariableSizeTreeState = TreeState<VariableSizeNodeRecord>;

export default class VariableSizeTree extends React.PureComponent<
  VariableSizeTreeProps,
  VariableSizeTreeState
> {
  public static defaultProps: Partial<VariableSizeTreeProps> = {
    rowComponent: Row,
  };

  public static getDerivedStateFromProps({
    children: component,
    itemData: data,
  }: VariableSizeTreeProps): Partial<VariableSizeTreeState> {
    return {
      component,
      data,
    };
  }

  private readonly list: React.RefObject<VariableSizeList> = React.createRef();

  public constructor(props: VariableSizeTreeProps, context: any) {
    super(props, context);

    this.getItemSize = this.getItemSize.bind(this);

    const initialState: VariableSizeTreeState = {
      component: props.children,
      order: [],
      records: {},
    };

    this.state = {
      ...initialState,
      ...this.computeTree({refreshNodes: true}, props, initialState),
    };
  }

  public async recomputeTree(
    options: VariableSizeUpdateOptions,
  ): Promise<void> {
    return new Promise(resolve => {
      this.setState<never>(
        prevState => this.computeTree(options, this.props, prevState),
        () => {
          if (options.useDefaultHeight) {
            this.resetAfterIndex(0, true);
          }

          resolve();
        },
      );
    });
  }

  public resetAfterIndex(
    index: number,
    shouldForceUpdate: boolean = false,
  ): void {
    if (this.list.current) {
      this.list.current.resetAfterIndex(index, shouldForceUpdate);
    }
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
    const {children, itemSize, rowComponent, treeWalker, ...rest} = this.props;

    return (
      <VariableSizeList
        {...rest}
        itemData={this.state}
        itemCount={this.state.order.length}
        // tslint:disable-next-line:no-unbound-method
        itemSize={itemSize || this.getItemSize}
        ref={this.list}
      >
        {rowComponent!}
      </VariableSizeList>
    );
  }

  private computeTree(
    {
      refreshNodes = false,
      useDefaultHeight = false,
      useDefaultOpenness = false,
    }: VariableSizeUpdateOptions,
    {treeWalker}: VariableSizeTreeProps,
    {records: prevRecords}: VariableSizeTreeState,
  ): Pick<VariableSizeTreeState, 'order' | 'records'> {
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

        if (useDefaultHeight) {
          records[id as string].height =
            records[id as string].metadata.defaultHeight;
        }
      } else {
        ({id} = value);
        const {defaultHeight, isOpenByDefault} = value;
        const record = records[id as string];

        if (!record) {
          records[id as string] = this.createNodeRecord(value);
        } else {
          record.metadata = value;

          if (useDefaultOpenness) {
            record.isOpen = isOpenByDefault;
          }

          if (useDefaultHeight) {
            record.height = defaultHeight;
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
    metadata: VariableSizeNodeMetadata,
  ): VariableSizeNodeRecord {
    const record: VariableSizeNodeRecord = {
      height: metadata.defaultHeight,
      isOpen: metadata.isOpenByDefault,
      metadata,
      resize: (height: number, shouldForceUpdate?: boolean) => {
        record.height = height;
        this.resetAfterIndex(
          this.state.order.indexOf(record.metadata.id),
          shouldForceUpdate,
        );
      },
      toggle: async () => {
        record.isOpen = !record.isOpen;
        await this.recomputeTree({
          refreshNodes: record.isOpen,
          useDefaultHeight: true,
        });
      },
    };

    return record;
  }

  private getItemSize(index: number): number {
    const {order, records} = this.state;

    return records[order[index] as string].height;
  }
}
