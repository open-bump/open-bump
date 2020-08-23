import Koa from "koa";
import ErrorFactory from "../errors/ErrorFactory";
import Application from "../models/Application";
import User from "../models/User";
import { CustomContext } from "../types";
import BaseRouter from "./BaseRouter";

export default class ApplicationRouter extends BaseRouter {
  protected register() {
    this.router.get("/", this.requireUser(), this.listApplications.bind(this));
    this.router.get(
      "/:application",
      this.requireUser(),
      this.viewApplication.bind(this)
    );
    this.router.patch(
      "/:application",
      this.requireUser(),
      this.updateApplication.bind(this)
    );
  }

  /**
   * GET /api/applications
   */
  public async listApplications(ctx: CustomContext, _next: Koa.Next) {
    const user: User = ctx.state.user;
    const applications = await Application.findAll({
      where: { userId: user.id }
    });
    ctx.body = applications;
  }

  /**
   * GET /api/applications/:application
   */
  public async viewApplication(ctx: CustomContext, _next: Koa.Next) {
    const user: User = ctx.state.user;
    const application = await Application.findOne({
      where: { id: ctx.params.application, userId: user.id }
    });
    if (!application)
      throw ErrorFactory.notFound("application", ctx.params.application);
    ctx.body = application;
  }

  /**
   * PATCH /api/applications/:application
   */
  public async updateApplication(ctx: CustomContext, _next: Koa.Next) {
    const user: User = ctx.state.user;
    const application = await Application.findOne({
      where: { id: ctx.params.application, userId: user.id }
    });
    if (!application)
      throw ErrorFactory.notFound("application", ctx.params.application);
    if (ctx.request.body.name) application.name = ctx.request.body.name;
    if (ctx.request.body.authorization)
      application.authorization = ctx.request.body.authorization;
    if (application.changed()) await application.save();
    ctx.body = application;
  }
}
