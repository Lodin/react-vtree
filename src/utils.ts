import {CSSProperties} from 'react';
import {Node} from './types';

export enum Update {
  None,
  Order,
  Nodes,
  NodesAndOpenness,
}

export const defaultControlStyle: CSSProperties = {
  width: 35,
};

export const defaultRowStyle: CSSProperties = {
  alignItems: 'center',
  display: 'flex',
};

export class NodeRecord {
  public node: Node;
  public isOpened: boolean;
  private finish: () => void;

  public constructor(node: Node, isOpened: boolean, finish: () => void) {
    this.node = node;
    this.isOpened = isOpened;
    this.finish = finish;
  }

  public onNodeToggle = (): void => {
    this.isOpened = !this.isOpened;
    this.finish();
  };
}
