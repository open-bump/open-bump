import axios, { AxiosInstance } from "axios";

export default abstract class BaseApi {
  private base = "http://localhost:4100/";

  private instance = axios.create({
    baseURL: this.base,
    withCredentials: true
  });

  public login(redirect: string) {
    window.location.href = `${this.base}login?redirect=${encodeURIComponent(
      redirect
    )}`;
  }

  protected async get(...args: Parameters<AxiosInstance["get"]>) {
    try {
      return (await this.instance.get(...args)).data;
    } catch (error) {
      if (error?.response?.status === 401)
        return void this.login(window.location.href) || [];
      throw error;
    }
  }

  protected async patch(...args: Parameters<AxiosInstance["patch"]>) {
    try {
      return (await this.instance.patch(...args)).data;
    } catch (error) {
      if (error?.response?.status === 401)
        return void this.login(window.location.href) || [];
      throw error;
    }
  }

  protected async post(...args: Parameters<AxiosInstance["post"]>) {
    try {
      return (await this.instance.post(...args)).data;
    } catch (error) {
      if (error?.response?.status === 401)
        return void this.login(window.location.href) || [];
      throw error;
    }
  }
}
