import Koa from "koa";
import ErrorFactory from "../errors/ErrorFactory";
import Utils from "../Utils";
import BaseRouter from "./BaseRouter";

export default class SBLPRouter extends BaseRouter {
  protected register() {
    this.router.post(
      "/request",
      this.requireAuthorization(["SBLP"]),
      this.bumpRequest.bind(this)
    );
  }

  /**
   * POST /sblp/request
   * @param ctx Context
   */
  public async bumpRequest(ctx: Koa.Context, _next: Koa.Next) {
    const body = ctx.request.body;
    await this.requireParameters(["guild", "channel", "user"])(ctx);
    const shardId = Utils.getShardId(
      body.guild,
      this.instance.shardManager.total
    );
    const shard = this.instance.shardManager.getShardById(shardId);
    if (!shard || !shard.ready) throw ErrorFactory.shardNotAvailable(shardId);
    const response = await shard.emitSBLPDirect(
      ctx.custom.application.id,
      body
    );
    ctx.body = response;
  }
}
