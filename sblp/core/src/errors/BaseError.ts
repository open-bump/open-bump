export default class BaseError extends Error {
  status: number = 500;
  code: string = "server_error";
  error?: Error;

  public static from(error: Error) {
    if (error instanceof BaseError) return error;
    return new BaseError().setMessage(error?.message).setError(error);
  }

  setStatus(status: number) {
    this.status = status;
    return this;
  }

  setCode(code: string) {
    this.code = code;
    return this;
  }

  setMessage(message: string) {
    this.message = message;
    return this;
  }

  setError(error: Error) {
    this.error = error;
    return this;
  }

  public dispatch() {
    return {
      error: true,
      status: this.status,
      code: this.code,
      message: this.message || void 0
    };
  }
}
