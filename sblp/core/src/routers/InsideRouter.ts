import Koa from "koa";
import Application from "../models/Application";
import { CustomContext } from "../types";
import BaseRouter from "./BaseRouter";

export default class InsideRouter extends BaseRouter {
  protected register() {
    this.router.post(
      "/tasks",
      this.requireAuthorization(),
      this.taskCreate.bind(this)
    );
    this.router.get(
      "/tasks/:task",
      this.requireAuthorization(),
      this.taskCheck.bind(this)
    );
  }

  /**
   * POST /sblp/tasks
   */
  public async taskCreate(ctx: CustomContext, _next: Koa.Next) {
    const application: Application = ctx.state.application;
    const body = ctx.request.body;
    await this.requireParameters(["guild", "channel", "user"])(ctx);
    const res = await this.instance.taskManager.start(application.id, body);
    ctx.body = res;
  }

  /**
   * GET /sblp/tasks/:task
   */
  public async taskCheck(ctx: CustomContext, _next: Koa.Next) {
    const application: Application = ctx.state.application;
    const task = ctx.params.task;
    ctx.body = this.instance.taskManager.check(application.id, task);
  }
}
