import Koa from "koa";
import { Op } from "sequelize";
import uuid from "uuid";
import ErrorFactory from "../errors/ErrorFactory";
import Application from "../models/Application";
import ApplicationService from "../models/ApplicationService";
import User from "../models/User";
import { CustomContext } from "../types";
import BaseRouter from "./BaseRouter";

export default class ApplicationRouter extends BaseRouter {
  protected register() {
    this.router.get("/", this.requireUser(), this.getApplications.bind(this));
    this.router.get(
      "/:application",
      this.requireUser(),
      this.getApplication.bind(this)
    );
    this.router.patch(
      "/:application",
      this.requireUser(),
      this.patchApplication.bind(this)
    );
    this.router.get(
      "/:application/services",
      this.requireUser(),
      this.getApplicationServices.bind(this)
    );
    this.router.post(
      "/:application/services",
      this.requireUser(),
      this.postApplicationService.bind(this)
    );
    this.router.patch(
      "/:application/services/:service",
      this.requireUser(),
      this.patchApplicationService.bind(this)
    );
    this.router.delete(
      "/:application/services/:service",
      this.requireUser(),
      this.deleteApplicationService.bind(this)
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
  public async getApplications(ctx: CustomContext, _next: Koa.Next) {
    const user: User = ctx.state.user;
    const applications = await Application.findAll({
      where: { userId: user.id }
    });
    ctx.body = applications;
  }

  /**
   * GET /api/applications/:application
   */
  public async getApplication(ctx: CustomContext, _next: Koa.Next) {
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
  public async patchApplication(ctx: CustomContext, _next: Koa.Next) {
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
  public async getApplicationServices(ctx: CustomContext, _next: Koa.Next) {
    const user: User = ctx.state.user;
    const application = await Application.scope("full").findOne({
      where: { id: ctx.params.application, userId: user.id }
    });
    if (!application)
      throw ErrorFactory.notFound("application", ctx.params.application);
    if (!ctx.request.query.available)
      ctx.body = application.applicationServices;
    else {
      const applications = await Application.scope("sanitized").findAll({
        where: {
          id: {
            [Op.notIn]: [
              ...application.applicationServices.map(
                ({ target: { id } }) => id
              ),
              application.id
            ]
          }
        }
      });
      ctx.body = applications;
    }
  }

  /**
   * POST /api/applications/:application/services
   */
  public async postApplicationService(ctx: CustomContext, _next: Koa.Next) {
    const user: User = ctx.state.user;
    await this.requireParameters(["target", "authorization"])(ctx);
    const application = await Application.scope("full").findOne({
      where: { id: ctx.params.application, userId: user.id }
    });
    if (!application)
      throw ErrorFactory.notFound("application", ctx.params.application);
    let service = await ApplicationService.scope("withTarget").create({
      applicationId: application.id,
      targetId: ctx.request.body.target,
      token: uuid.v4(),
      authorization: ctx.request.body.authorization
    });
    await service.reload({
      include: [
        {
          model: Application,
          as: "target",
          attributes: {
            exclude: [
              "token",
              "authorization",
              "host",
              "base",
              "userId",
              "bot",
              "publicBase"
            ]
          }
        }
      ]
    });
    ctx.body = service;
  }

  /**
   * PATCH /api/applications/:application/services/:service
   */
  public async patchApplicationService(ctx: CustomContext, _next: Koa.Next) {
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
   * DELETE /api/applications/:application/services/:service
   */
  public async deleteApplicationService(ctx: CustomContext, _next: Koa.Next) {
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
    await service.destroy();
    ctx.status = 204;
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
