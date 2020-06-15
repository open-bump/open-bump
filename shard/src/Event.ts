import { ClientEvents } from "discord.js";
import OpenBump from "./OpenBump";

export default abstract class Event<T extends keyof ClientEvents> {
  constructor(protected instance: OpenBump, public name: T) {}

  public abstract async run(...args: ClientEvents[T]): Promise<void>;
}
