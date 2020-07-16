import Koa from "koa";
import ErrorFactory from "../errors/ErrorFactory";
import Guild from "../models/Guild";
import BaseRouter from "./BaseRouter";

export default class GuildsRouter extends BaseRouter {
  protected register() {
    this.router.get(
      "/:guild",
      this.requireAuthorization(["GUILDS"]),
      this.getGuild.bind(this)
    );
  }

  /**
   * GET /guilds/:guild
   * @param ctx Context
   */
  public async getGuild(ctx: Koa.Context, _next: Koa.Next) {
    const guild = await Guild.scope("default").findOne({
      where: { id: ctx.params.guild }
    });
    if (guild) {
      ctx.body = {
        ...this.pick(guild, ["id"]),
        bumpData: this.pick(guild.bumpData, [
          "description",
          "invite",
          "banner",
          "color",
          "updatedAt"
        ])
      };
    } else throw ErrorFactory.notFound("guild", ctx.params.guild);
  }
}
