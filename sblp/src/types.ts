import Router from "@koa/router";
import Koa from "koa";
import User from "./models/User";

export type CustomState = Koa.DefaultState & {
  user: User;
};

export type CustomContext = Koa.ParameterizedContext<
  any,
  Router.RouterParamContext<any, {}>
> &
  Koa.ParameterizedContext<{}, Koa.DefaultContext> &
  Koa.DefaultContext &
  Koa.Context & {
    state: CustomState
  };
