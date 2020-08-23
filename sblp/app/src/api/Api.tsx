import axios, { AxiosInstance } from "axios";
import store from "../store";
import { IApplication, IApplicationService } from "../types";

export default class Api {
  private base = "http://localhost:4100/";

  private instance = axios.create({
    baseURL: this.base,
    withCredentials: true
  });

  private async get(...args: Parameters<AxiosInstance["get"]>) {
    try {
      return (await this.instance.get(...args)).data;
    } catch (error) {
      if (error?.response?.status === 401)
        return void this.login(window.location.href) || [];
      throw error;
    }
  }

  private async patch(...args: Parameters<AxiosInstance["patch"]>) {
    try {
      return (await this.instance.patch(...args)).data;
    } catch (error) {
      if (error?.response?.status === 401)
        return void this.login(window.location.href) || [];
      throw error;
    }
  }

  private async post(...args: Parameters<AxiosInstance["post"]>) {
    try {
      return (await this.instance.post(...args)).data;
    } catch (error) {
      if (error?.response?.status === 401)
        return void this.login(window.location.href) || [];
      throw error;
    }
  }

  public async getApplications(): Promise<Array<IApplication>> {
    const res = await this.get(`${this.base}api/applications`);
    store.dispatch({ type: "SET_APPLICATIONS", payload: res });
    return res;
  }

  public async patchApplication(
    application: string,
    data: Partial<IApplication>
  ): Promise<Array<IApplication>> {
    const res = await this.patch(
      `${this.base}api/applications/${application}`,
      data
    );
    store.dispatch({ type: "UPDATE_APPLICATION", payload: res });
    return res;
  }

  public async getApplicationServices(
    application: string
  ): Promise<Array<IApplicationService>> {
    const res = await this.get(`${this.base}api/applications/${application}/services`);
    console.log('res', res);
    store.dispatch({
      type: "SET_SERVICES",
      payload: { application, services: res }
    });
    return res;
  }

  public async resetApplicationToken(
    application: string
  ): Promise<Array<IApplication>> {
    const res = await this.post(
      `${this.base}api/applications/${application}/token`
    );
    store.dispatch({ type: "UPDATE_APPLICATION", payload: res });
    return res;
  }

  public login(redirect: string) {
    window.location.href = `${this.base}login?redirect=${encodeURIComponent(
      redirect
    )}`;
  }
}
