import Koa from "koa";
import uuid from "uuid";
import ErrorFactory from "../errors/ErrorFactory";
import Application from "../models/Application";
import ApplicationService from "../models/ApplicationService";
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
    this.router.get(
      "/:application/services",
      this.requireUser(),
      this.viewApplicationServices.bind(this)
    );
    this.router.patch(
      "/:application/services/:service",
      this.requireUser(),
      this.updateApplicationService.bind(this)
    );
    this.router.post(
      "/:application/token",
      this.requireUser(),
      this.resetApplicationToken.bind(this)
    );
    this.router.post(
      "/:application/services/:service/token",
      this.requireUser(),
      this.resetApplicationServiceToken.bind(this)
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
    if (ctx.request.body.base) application.base = ctx.request.body.base;
    if (application.changed()) await application.save();
    ctx.body = application;
  }

  /**
   * GET /api/applications/:application/services
   */
  public async viewApplicationServices(ctx: CustomContext, _next: Koa.Next) {
    const user: User = ctx.state.user;
    const application = await Application.scope("full").findOne({
      where: { id: ctx.params.application, userId: user.id }
    });
    if (!application)
      throw ErrorFactory.notFound("application", ctx.params.application);
    ctx.body = application.applicationServices;
  }

  /**
   * PATCH /api/applications/:application/services/:service
   */
  public async updateApplicationService(ctx: CustomContext, _next: Koa.Next) {
    const user: User = ctx.state.user;
    const service = await ApplicationService.findOne({
      where: { id: ctx.params.service },
      include: [
        {
          model: Application,
          as: "application",
          where: { id: ctx.params.application, userId: user.id }
        },
        {
          model: Application,
          as: "target"
        }
      ]
    });
    if (!service) throw ErrorFactory.notFound("service", ctx.params.service);
    if (ctx.request.body.authorization)
      service.authorization = ctx.request.body.authorization;
    if (service.changed()) await service.save();
    ctx.body = service;
  }

  /**
   * POST /api/applications/:application/token
   */
  public async resetApplicationToken(ctx: CustomContext, _next: Koa.Next) {
    const user: User = ctx.state.user;
    const application = await Application.findOne({
      where: { id: ctx.params.application, userId: user.id }
    });
    if (!application)
      throw ErrorFactory.notFound("application", ctx.params.application);
    application.token = uuid.v4();
    if (application.changed()) await application.save();
    ctx.body = application;
  }

  /**
   * POST /api/applications/:application/services/:service/token
   */
  public async resetApplicationServiceToken(
    ctx: CustomContext,
    _next: Koa.Next
  ) {
    const user: User = ctx.state.user;
    const service = await ApplicationService.findOne({
      where: { id: ctx.params.service },
      include: [
        {
          model: Application,
          as: "application",
          where: { id: ctx.params.application, userId: user.id }
        },
        {
          model: Application,
          as: "target"
        }
      ]
    });
    if (!service) throw ErrorFactory.notFound("service", ctx.params.service);
    service.token = uuid.v4();
    if (service.changed()) await service.save();
    ctx.body = service;
  }
}
