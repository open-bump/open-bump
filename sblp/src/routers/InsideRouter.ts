import Koa from "koa";
import Application from "../models/Application";
import BaseRouter from "./BaseRouter";

export default class InsideRouter extends BaseRouter {
  protected register() {
    this.router.post(
      "/start",
      this.requireAuthorization(),
      this.bumpStart.bind(this)
    );
    this.router.get(
      "/check",
      this.requireAuthorization(),
      this.bumpCheck.bind(this)
    );
  }

  /**
   * POST /start
   * @param ctx Context
   */
  public async bumpStart(ctx: Koa.Context, _next: Koa.Next) {
    const body = ctx.request.body;
    const application: Application = ctx.custom.application;
    await this.requireParameters(["guild", "channel", "user"])(ctx);
    const res = await this.instance.taskManager.start(application.id, body);
    ctx.body = res;
  }

  /**
   * GET /check
   * @param ctx Context
   */
  public async bumpCheck(ctx: Koa.Context, _next: Koa.Next) {
    const body = ctx.request.body;
    const application: Application = ctx.custom.application;
    await this.requireParameters(["id"])(ctx);
    ctx.body = this.instance.taskManager.check(application.id, body.id);
  }
}
