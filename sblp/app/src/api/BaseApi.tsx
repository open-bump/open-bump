import axios, { AxiosInstance } from "axios";

export interface APIModel<T extends APIModel<T>> {
  _previousDataValues: Partial<T>;
  api: BaseApi;
  rebuild: BaseApi["modelFunctions"]["rebuild"];
  changed: BaseApi["modelFunctions"]["changed"];
  raw: BaseApi["modelFunctions"]["raw"];
}

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

  protected async delete(...args: Parameters<AxiosInstance["delete"]>) {
    try {
      return (await this.instance.delete(...args)).data;
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

  public hasChanged<T>(obj: T, old?: T) {
    if (!old) return false;
    let changed = false;
    for (const k of Object.keys(obj)) {
      const key = k as keyof T;
      if (key === "updatedAt") continue;
      else if (typeof obj[key] === "function") continue;
      else if (typeof obj[key] === "object") continue;
      changed = changed || obj[key] !== old[key];
    }
    return changed;
  }

  public modelFunctions = {
    rebuild: function <T extends APIModel<T>>(instance: T) {
      instance.changed = this.changed.bind(instance);
      instance.raw = this.raw.bind(
        instance
      ) as BaseApi["modelFunctions"]["raw"];
      return instance;
    },
    changed: function <T extends APIModel<T>>(this: T) {
      return this.api.hasChanged(this, this._previousDataValues);
    },
    raw: function <T extends APIModel<T>>(this: T) {
      const obj: Partial<T> = {};
      for (const k of Object.keys(this)) {
        const key = k as keyof typeof this;
        const value = this[key];
        if (typeof value === "object" || typeof value === "function") continue;
        obj[key] = value;
      }
      return obj;
    }
  };

  protected buildModel = <T extends APIModel<T>>(raw: T) => {
    delete raw._previousDataValues;
    raw.api = this;
    raw.rebuild = this.modelFunctions.rebuild.bind(this.modelFunctions);
    raw.rebuild(raw);
    raw._previousDataValues = raw.raw();
    return raw;
  };
}
