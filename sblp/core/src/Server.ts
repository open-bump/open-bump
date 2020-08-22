import Router from "@koa/router";
import Koa from "koa";
import bodyParser from "koa-bodyparser";
import passport from "koa-passport";
import send from "koa-send";
import session from "koa-session";
import serve from "koa-static";
import path from "path";
import { env } from "process";
import config from "./config";
import BaseError from "./errors/BaseError";
import ApplicationRouter from "./routers/ApplicationRouter";
import AuthRouter from "./routers/AuthRouter";
import InsideRouter from "./routers/InsideRouter";
import OutsideRouter from "./routers/OutsideRouter";
import Hub from "./SBLP";
import { CustomContext, CustomState } from "./types";

export default class Server {
  private app: Koa<CustomState, CustomContext>;
  private router: Router<CustomState, CustomContext>;

  private applicationRouter?: ApplicationRouter;
  private authRouter?: AuthRouter;
  private insideRouter?: InsideRouter;
  private outsideRouter?: OutsideRouter;

  constructor(private instance: Hub) {
    this.app = new Koa();
    this.router = new Router();

    // body parser
    this.app.use(bodyParser());

    // sessions
    this.app.keys = [config.auth.key];
    this.app.use(session({}, (this.app as unknown) as Koa));

    // authentication
    this.app.use(passport.initialize());
    this.app.use(passport.session());

    // cors
    if (env.NODE_ENV === "development")
      this.app.use(async (ctx: Koa.Context, next: Koa.Next) => {
        ctx.set("Access-Control-Allow-Origin", config.settings.app);
        ctx.set("Access-Control-Allow-Credentials", "true");
        return await next();
      });

    // error handling
    this.app.use(async (ctx: Koa.Context, next: Koa.Next) => {
      try {
        return await next();
      } catch (error) {
        const baseError = BaseError.from(error);
        ctx.body = baseError.dispatch();
        ctx.status = baseError.status;
      }
    });

    // routes
    this.registerRoutes();
    this.app.use(this.router.routes());
    this.app.use(this.router.allowedMethods());

    // static
    this.app.use(serve(path.join(__dirname, "public")));
    this.app.use(
      async (ctx) =>
        await send(ctx, path.join("public", "index.html"), { root: __dirname })
    );
  }

  private registerRoutes() {
    this.applicationRouter = new ApplicationRouter(this.instance);
    this.authRouter = new AuthRouter(this.instance);
    this.insideRouter = new InsideRouter(this.instance);
    this.outsideRouter = new OutsideRouter(this.instance);

    this.router.use(
      "/api/applications",
      this.applicationRouter.router.routes()
    );
    this.router.use(this.authRouter.router.routes());
    this.router.use("/sblp", this.insideRouter.router.routes());
    this.router.use("/sblp", this.outsideRouter.router.routes());
  }

  public async init() {
    const port = config.settings.port;
    this.app.listen(port);
    console.log(`HTTPs listening on *:${port}`);
  }
}
