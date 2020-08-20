import Router from "@koa/router";
import Koa from "koa";
import ErrorFactory from "../errors/ErrorFactory";
import Application from "../models/Application";
import ApplicationService from "../models/ApplicationService";
import Hub from "../SBLP";

export default abstract class BaseRouter {
  public router: Router;

  constructor(protected instance: Hub) {
    this.router = new Router();
    this.register();
  }

  protected abstract register(): void;

  protected requireAuthorization(service = false) {
    return async (ctx: Koa.Context, next?: Koa.Next) => {
      if (!ctx.custom) ctx.custom = {};
      const token = ctx.headers["authorization"];
      if (!token) throw ErrorFactory.unauthorized();
      const application = await Application.findOne({
        include: service
          ? [{ model: ApplicationService, as: "services", where: { token } }]
          : void 0,
        where: !service ? { token } : void 0
      });
      if (!application) throw ErrorFactory.forbidden();

      ctx.custom.application = application;
      if (next) return await next();
    };
  }

  protected requireProvider() {
    return async (ctx: Koa.Context, next?: Koa.Next) => {
      if (!ctx.custom) ctx.custom = {};
      const host = ctx.headers["host"];
      if (!host) return;
      const application = await Application.findOne({ where: { host } });
      if (!application) return;

      ctx.custom.provider = application;
      if (next) return await next();
    };
  }

  protected requireParameters(parameters: Array<string>) {
    return async (ctx: Koa.Context, next?: Koa.Next) => {
      const missing: Array<string> = [];
      for (const parameter of parameters) {
        if (
          ctx.request.body[parameter] === void 0 ||
          ctx.request.body[parameter] === null
        ) {
          missing.push(parameter);
          continue;
        }
      }
      if (missing.length) throw ErrorFactory.missingParameters(void 0, missing);
      if (next) return await next();
    };
  }

  protected pick<T, K extends keyof T>(
    object: T,
    parameters: Array<K>
  ): Pick<T, K> {
    return parameters.reduce((obj, param) => {
      obj[param] = object[param];
      return obj;
    }, {} as Pick<T, K>);
  }
}
