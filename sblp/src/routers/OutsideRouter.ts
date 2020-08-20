import Koa from "koa";
import Application from "../models/Application";
import BaseRouter from "./BaseRouter";

export default class OutsideRouter extends BaseRouter {
  protected register() {
    this.router.post(
      "/request",
      this.requireProvider(),
      this.requireAuthorization(true),
      this.bumpRequest.bind(this)
    );
  }

  /**
   * POST /sblp/request
   * @param ctx Context
   */
  public async bumpRequest(ctx: Koa.Context, _next: Koa.Next) {
    const body = ctx.request.body;
    const provider: Application = ctx.custom.provider;
    const application: Application = ctx.custom.application;
    await this.requireParameters(["guild", "channel", "user"])(ctx);
    console.log('provider', provider.name);
    console.log('application', application.name);
  }
}
