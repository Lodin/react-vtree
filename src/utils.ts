import {CSSProperties} from 'react';
import {Node} from './types';

export const defaultControlStyle: CSSProperties = {
  width: 35,
};

export const defaultRowStyle: CSSProperties = {
  alignItems: 'center',
  display: 'flex',
};

export class NodeRecord {
  public constructor(
    public node: Node,
    public isOpened: boolean,
    private finish: () => void,
  ) {}

  public onNodeToggle = (): void => {
    this.isOpened = !this.isOpened;
    this.finish();
  };
}
