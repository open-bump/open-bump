import Koa from "koa";
import fetch from "node-fetch";
import config from "../config";
import ErrorFactory from "../errors/ErrorFactory";
import Application from "../models/Application";
import ApplicationService from "../models/ApplicationService";
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
    const service = await ApplicationService.findOne({
      where: { applicationId: provider.id, targetId: application.id }
    });
    if (!service) throw ErrorFactory.forbidden();
    await this.requireParameters(["guild", "channel", "user"])(ctx);

    const payload = {
      ...body,
      application: application.id,
      bot: application.bot,
      verified: ["application", "bot"]
    };

    const url = `${provider.getBase()}sblp/request`;
    console.log(`[DEBUG] URL: ${url}`);

    try {
      const res: object = await fetch("https://proxy.discord.one/", {
        method: "POST",
        headers: {
          "x-target": url,
          authorization: service.token,
          "content-type": "application/json",
          "x-proxy-auth": config.settings.proxyAuth
        },
        body: JSON.stringify(payload)
      }).then((res) => res.json());
      console.log(
        `Successfully received response from provider ${provider.name} (${provider.id}) for application ${application.name} (${application.id})`
      );
      ctx.body = res;
    } catch (error) {
      console.error(
        `Error during receiving of response from target ${provider.name} (${provider.id}) for application ${application.id} (${application.id})`,
        error
      );
      ctx.status = 502;
      ctx.body = {
        type: "ERROR",
        code: "OTHER",
        message: "HTTP Error"
      };
    }
  }
}
