import { APIModel } from "./api/BaseApi";

export interface IApplication extends APIModel<IApplication> {
  id: string;
  name: string;
  host: string | null;
  userId: string;
  bot: string;
  base: string;
  token: string | null;
  authorization: string | null;
  createdAt: string;
  updatedAt: string;
  services?: Array<IApplicationService>;
}

export interface IApplicationService extends APIModel<IApplicationService> {
  id: string;
  applicationId: string;
  targetId: string;
  token: string | null;
  authorization: string | null;
  createdAt: string;
  updatedAt: string;
  target: IApplication;
}
