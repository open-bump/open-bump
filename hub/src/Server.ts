import Router from "@koa/router";
import Koa from "koa";
import bodyParser from "koa-bodyparser";
import config from "./config";
import BaseError from "./errors/BaseError";
import Hub from "./Hub";
import GuildsRouter from "./routers/GuildsRouter";
import SBLPRouter from "./routers/SBLPRouter";

export default class Server {
  private app: Koa;
  private router: Router;

  private sblpRouter?: SBLPRouter;
  private guildsRouter?: GuildsRouter;

  constructor(private instance: Hub) {
    this.app = new Koa();
    this.router = new Router();

    this.app.use(bodyParser());

    this.registerRoutes();

    this.app.use(async (ctx: Koa.Context, next: Koa.Next) => {
      try {
        return await next();
      } catch (error) {
        const baseError = BaseError.from(error);
        ctx.body = baseError.dispatch();
        ctx.status = baseError.status;
      }
    });

    this.app.use(this.router.routes());
    this.app.use(this.router.allowedMethods());
  }

  private registerRoutes() {
    this.sblpRouter = new SBLPRouter(this.instance);
    this.guildsRouter = new GuildsRouter(this.instance);

    this.router.use("/sblp", this.sblpRouter.router.routes());
    this.router.use("/guilds", this.guildsRouter.router.routes());
  }

  public async init() {
    const port = config.settings.httpPort;
    this.app.listen(port);
    console.log(`HTTPs listening on *:${port}`);
  }
}
