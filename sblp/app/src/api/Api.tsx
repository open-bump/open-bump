import store from "../store";
import { IApplication, IApplicationService } from "../types";
import BaseApi, { APIModel } from "./BaseApi";

export default class Api extends BaseApi {
  public async getApplications() {
    const res: Array<IApplication> = await this.get(`/api/applications`);
    const ret = res.map((app) => ({
      ...this.buildModel(app),
      services: app.services?.map(this.buildModel)
    }));
    store.dispatch({ type: "SET_APPLICATIONS", payload: ret });
    return ret;
  }

  public async patchApplication(
    application: string,
    data: Partial<IApplication> & APIModel<IApplication>
  ) {
    const res: IApplication = await this.patch(
      `/api/applications/${application}`,
      data.rebuild(data).raw()
    );
    const ret = this.buildModel(res);
    store.dispatch({
      type: "UPDATE_APPLICATION",
      payload: ret
    });
    return ret;
  }

  public async getApplicationServices(application: string) {
    const res: Array<IApplicationService> = await this.get(
      `/api/applications/${application}/services`
    );
    const ret = res.map(this.buildModel);
    store.dispatch({
      type: "SET_SERVICES",
      payload: { application, services: ret }
    });
    return ret;
  }

  public async patchApplicationService(
    application: string,
    service: string,
    data: Partial<IApplicationService>
  ) {
    delete data._previousDataValues;
    const res: IApplicationService = await this.patch(
      `/api/applications/${application}/services/${service}`,
      data
    );
    const ret = this.buildModel(res);
    store.dispatch({
      type: "UPDATE_SERVICE",
      payload: { application, service: ret }
    });
    return ret;
  }

  public async resetApplicationToken(application: string) {
    const res: IApplication = await this.post(
      `/api/applications/${application}/token`
    );
    const ret = this.buildModel(res);
    store.dispatch({
      type: "UPDATE_APPLICATION",
      payload: ret
    });
    return ret;
  }

  public async resetApplicationServiceToken(
    application: string,
    service: string
  ) {
    const res: IApplicationService = await this.post(
      `/api/applications/${application}/services/${service}/token`
    );
    const ret = this.buildModel(res);
    store.dispatch({
      type: "UPDATE_SERVICE",
      payload: { application, service: ret }
    });
    return ret;
  }
}
