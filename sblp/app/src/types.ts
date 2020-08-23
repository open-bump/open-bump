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
}
