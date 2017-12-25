import {Node} from './types';

export default class NodeRecord {
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
