import Router from "@koa/router";
import Koa from "koa";
import ErrorFactory from "../errors/ErrorFactory";
import Hub from "../Hub";
import Application from "../models/Application";

export default abstract class BaseRouter {
  public router: Router;

  constructor(protected instance: Hub) {
    this.router = new Router();
    this.register();
  }

  protected abstract register(): void;

  protected requireAuthorization(features: Array<string> = []) {
    return async (ctx: Koa.Context, next?: Koa.Next) => {
      if (!ctx.custom) ctx.custom = {};
      const token = ctx.headers["authorization"];
      if (!token) throw ErrorFactory.unauthorized();
      const application =
        token && (await Application.findOne({ where: { token } }));
      if (!application) throw ErrorFactory.forbidden();
      const appFeatures = application.getFeatures();
      for (const feature of features)
        if (!appFeatures.includes(feature)) throw ErrorFactory.forbidden();

      ctx.custom.application = application;
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
