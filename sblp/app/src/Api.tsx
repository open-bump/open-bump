import axios, { AxiosInstance } from "axios";
import { Application } from "./types";

export default class Api {
  private static base = "http://localhost:4100/";

  private static instance = axios.create({
    baseURL: Api.base,
    withCredentials: true
  });

  private static async get(...args: Parameters<AxiosInstance["get"]>) {
    try {
      return (await Api.instance.get(...args)).data;
    } catch (error) {
      if (error.response.status === 401)
        return void this.login(window.location.href) || [];
      throw error;
    }
  }

  public static async listApplications(): Promise<Array<Application>> {
    const res = await Api.get(`${Api.base}api/applications`);
    return res;
  }

  public static login(redirect: string) {
    window.location.href = `${Api.base}login?redirect=${encodeURIComponent(
      redirect
    )}`;
  }
}
