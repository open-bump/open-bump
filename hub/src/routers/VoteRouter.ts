import Koa from "koa";
import ErrorFactory from "../errors/ErrorFactory";
import User from "../models/User";
import BaseRouter from "./BaseRouter";

export default class VoteRouter extends BaseRouter {
  protected register() {
    this.router.post(
      "/",
      this.requireAuthorization(["VOTE"]),
      this.postVote.bind(this)
    );
  }

  /**
   * POST /vote
   * @param ctx Context
   */
  public async postVote(ctx: Koa.Context, _next: Koa.Next) {
    const body = ctx.request.body;
    const user = await User.findOne({ where: { id: body.user } });
    if (user) {
      user.lastVotedAt = new Date();
      await user.save();
      ctx.body = {
        success: true
      };
    } else throw ErrorFactory.notFound("user", ctx.params.user);
  }
}
