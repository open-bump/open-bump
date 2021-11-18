import BaseError from "./BaseError";

export default class ErrorFactory {
  public static unauthorized(user = false) {
    return new BaseError()
      .setStatus(401)
      .setCode("unauthorized")
      .setMessage(
        !user
          ? "The request is missing an `Authorization` header containing an application token."
          : "You need to be logged in to perform this request."
      );
  }

  public static forbidden() {
    return new BaseError()
      .setStatus(403)
      .setCode("forbidden")
      .setMessage(
        "Your application does not have sufficient permissions to access this resource."
      );
  }

  public static notFound(type = "object", id?: string) {
    return new BaseError()
      .setStatus(404)
      .setCode(`${type}_not_found`)
      .setMessage(`Could not find ${type}${id ? ` with id "${id}"` : ""}`);
  }

  public static missingParameters(
    code = "missing_parameters",
    parameters: Array<string> = []
  ) {
    return new BaseError()
      .setStatus(400)
      .setCode(code)
      .setMessage(
        `Request body is missing the following parameter${
          parameters.length !== 1 ? "s" : ""
        }: ${parameters.map((parameter) => `\`${parameter}\``).join(", ")}`
      );
  }
}
