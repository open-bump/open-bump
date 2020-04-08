export default abstract class Command {
  public abstract name: string;
  public abstract description: string;
  public aliases: Array<string> = [];

  public abstract async run(): Promise<void>;
}
