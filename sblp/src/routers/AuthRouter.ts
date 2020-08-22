import Koa from "koa";
import passport from "koa-passport";
import { Strategy as DiscordStrategy } from "passport-discord";
import config from "../config";
import User from "../models/User";
import { CustomContext } from "../types";
import BaseRouter from "./BaseRouter";

const scopes = ["identify", "email"];

passport.serializeUser((user: User, done) => {
  return void done(null, user.id);
});

passport.deserializeUser(async (id: string, done) => {
  const user = await User.findOne({ where: { id } });
  return void done(user ? void 0 : true, user || void 0);
});

passport.use(
  new DiscordStrategy(
    {
      clientID: config.auth.discord.clientId,
      clientSecret: config.auth.discord.clientSecret,
      callbackURL: `${config.settings.url}login`,
      scope: scopes
    },
    function (accessToken, refreshToken, profile, cb) {
      User.findOrCreate({
        where: { id: profile.id },
        defaults: { accessToken, refreshToken }
      })
        .then(([user]) => cb(void 0, user))
        .catch((err) => cb(err));
    }
  )
);

export default class AuthRouter extends BaseRouter {
  protected register() {
    this.router.get(
      "/login",
      this.redirectUser(),
      passport.authenticate("discord"),
      this.redirectUser()
    );
    this.router.get("/logout", this.logout.bind(this));
  }

  /**
   * GET /logout
   */
  public async logout(ctx: CustomContext, _next: Koa.Next) {
    ctx.logout();
    return void ctx.redirect("/");
  }
}
