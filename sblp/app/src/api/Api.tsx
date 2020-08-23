import store from "../store";
import { IApplication, IApplicationService } from "../types";
import BaseApi from "./BaseApi";

export default class Api extends BaseApi {
  public async getApplications(): Promise<Array<IApplication>> {
    const res = await this.get(`/api/applications`);
    store.dispatch({ type: "SET_APPLICATIONS", payload: res });
    return res;
  }

  public async patchApplication(
    application: string,
    data: Partial<IApplication>
  ): Promise<Array<IApplication>> {
    const res = await this.patch(`/api/applications/${application}`, data);
    store.dispatch({ type: "UPDATE_APPLICATION", payload: res });
    return res;
  }

  public async getApplicationServices(
    application: string
  ): Promise<Array<IApplicationService>> {
    const res = await this.get(`/api/applications/${application}/services`);
    store.dispatch({
      type: "SET_SERVICES",
      payload: { application, services: res }
    });
    return res;
  }

  public async patchApplicationService(
    application: string,
    service: string,
    data: Partial<IApplication>
  ): Promise<Array<IApplication>> {
    const res = await this.patch(
      `/api/applications/${application}/services/${service}`,
      data
    );
    store.dispatch({
      type: "UPDATE_SERVICE",
      payload: { application, service: res }
    });
    return res;
  }

  public async resetApplicationToken(
    application: string
  ): Promise<Array<IApplication>> {
    const res = await this.post(`/api/applications/${application}/token`);
    store.dispatch({ type: "UPDATE_APPLICATION", payload: res });
    return res;
  }

  public async resetApplicationServiceToken(
    application: string,
    service: string
  ): Promise<Array<IApplication>> {
    const res = await this.post(
      `/api/applications/${application}/services/${service}/token`
    );
    store.dispatch({
      type: "UPDATE_SERVICE",
      payload: { application, service: res }
    });
    return res;
  }
}
