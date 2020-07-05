import OpenBump from "./OpenBump";
import { ClientEvents } from "discord.js";

export default abstract class Event {
  public abstract name: keyof ClientEvents;

  constructor(protected instance: OpenBump) {}

  public abstract async run(...args: any): Promise<void>;
}
