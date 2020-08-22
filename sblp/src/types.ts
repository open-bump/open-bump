import Router from "@koa/router";
import Koa from "koa";

export type CustomState = Koa.DefaultState;

export type CustomContext = Koa.ParameterizedContext<
  any,
  Router.RouterParamContext<any, {}>
> &
  Koa.ParameterizedContext<{}, Koa.DefaultContext> &
  Koa.DefaultContext &
  Koa.Context;
