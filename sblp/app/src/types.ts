export interface IApplication {
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

export interface IApplicationService {
  id: string;
  applicationId: string;
  targetId: string;
  token: string;
  authorization: string;
  createdAt: string;
  updatedAt: string;
  target: {
    id: string;
    name: string;
    host: string | null;
    userId: string;
    bot: string;
    base: string;
    token: string;
    authorization: string | null;
    createdAt: string;
    updatedAt: string;
  };
}
