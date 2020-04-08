import OpenBump from "./OpenBump";

export default abstract class Event {
  public abstract name: string;

  constructor(protected instance: OpenBump) {}

  public abstract async run(...args: any): Promise<void>;
}
