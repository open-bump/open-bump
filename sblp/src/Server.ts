import Router from "@koa/router";
import Koa from "koa";
import bodyParser from "koa-bodyparser";
import config from "./config";
import BaseError from "./errors/BaseError";
import InsideRouter from "./routers/InsideRouter";
import OutsideRouter from "./routers/OutsideRouter";
import Hub from "./SBLP";

export default class Server {
  private app: Koa;
  private router: Router;

  private insideRouter?: InsideRouter;
  private outsideRouter?: OutsideRouter;

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
    this.insideRouter = new InsideRouter(this.instance);
    this.outsideRouter = new OutsideRouter(this.instance);

    this.router.use(this.insideRouter.router.routes());
    this.router.use("/sblp", this.outsideRouter.router.routes());
  }

  public async init() {
    const port = config.settings.port;
    this.app.listen(port);
    console.log(`HTTPs listening on *:${port}`);
  }
}
