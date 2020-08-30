import querystring from "querystring";
import store from "../store";
import { IApplication, IApplicationService } from "../types";
import BaseApi, { APIModel } from "./BaseApi";

export default class Api extends BaseApi {
  /**
   * GET /api/applications
   */
  public async getApplications() {
    const res: Array<IApplication> = await this.get(`/api/applications`);
    const ret = res.map((app) => ({
      ...this.buildModel(app),
      services: app.services?.map(this.buildModel)
    }));
    store.dispatch({ type: "SET_APPLICATIONS", payload: ret });
    return ret;
  }

  /**
   * PATCH /api/applications/:application
   */
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

  /**
   * GET /api/applications/:application/services
   */
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

  /**
   * GET /api/applications/:application/services?available=true
   */
  public async getAvailableServices(application: string) {
    const res: Array<IApplication> = await this.get(
      `/api/applications/${application}/services?${querystring.stringify({
        available: true
      })}`
    );
    const ret = res.map(this.buildModel);
    return ret;
  }

  /**
   * POST /api/applications/:application/services/:service
   */
  public async postApplicationService(
    application: string,
    target: string,
    authorization: string
  ) {
    const res: IApplicationService = await this.post(
      `/api/applications/${application}/services`,
      { target, authorization }
    );
    const ret = this.buildModel(res);
    store.dispatch({
      type: "UPDATE_SERVICE",
      payload: { application, service: ret }
    });
    return ret;
  }

  /**
   * PATCH /api/applications/:application/services/:service
   */
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

  /**
   * DELETE /api/applications/:application/services/:service
   */
  public async deleteApplicationService(application: string, service: string) {
    await this.delete(`/api/applications/${application}/services/${service}`);
    store.dispatch({
      type: "DELETE_SERVICE",
      payload: { application, service }
    });
  }

  /**
   * POST /api/applications/:application/token
   */
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

  /**
   * POST /api/applications/:application/services/:service/token
   */
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
