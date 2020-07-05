import Router from "@koa/router";
import Koa from "koa";
import ErrorFactory from "../errors/ErrorFactory";
import Application from "../models/Application";

export default abstract class BaseRouter {
  public router: Router;

  constructor() {
    this.router = new Router();
    this.register();
  }

  protected abstract register(): void;

  protected requireAuthorization(features: Array<string> = []) {
    return async (ctx: Koa.Context, next: Koa.Next) => {
      if (!ctx.custom) ctx.custom = {};
      const token = ctx.headers["authorization"];
      if (!token) throw ErrorFactory.unauthorized();
      const application =
        token && (await Application.findOne({ where: { token } }));
      if (!application) throw ErrorFactory.forbidden();
      for (const feature of features)
        if (
          !application.features.map(({ feature }) => feature).includes(feature)
        )
          throw ErrorFactory.forbidden();

      ctx.custom.application = application;
      return await next();
    };
  }
}
