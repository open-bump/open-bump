import Koa from "koa";
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
    ctx.body = "request";
  }
}
