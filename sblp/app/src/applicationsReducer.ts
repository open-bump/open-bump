import { IApplication, IApplicationService } from "./types";

export interface ApplicationsState {
  applications: IApplication[];
}

const initialState: ApplicationsState = {
  applications: []
};

type Action =
  | { type: "SET_APPLICATIONS"; payload: Array<IApplication> }
  | { type: "UPDATE_APPLICATION"; payload: IApplication }
  | {
      type: "SET_SERVICES";
      payload: { application: string; services: Array<IApplicationService> };
    }
  | {
      type: "UPDATE_SERVICE";
      payload: {
        application: string;
        service: IApplicationService;
      };
    }
  | {
      type: "DELETE_SERVICE";
      payload: {
        application: string;
        service: string;
      };
    };

export default (state = initialState, action: Action) => {
  switch (action.type) {
    case "SET_APPLICATIONS":
      return {
        ...state,
        applications: action.payload
      };
    case "UPDATE_APPLICATION":
      return {
        ...state,
        applications: state.applications.map((application) =>
          application.id === action.payload.id
            ? { ...application, ...action.payload }
            : application
        )
      };
    case "SET_SERVICES":
      return {
        ...state,
        applications: state.applications.map((application) =>
          application.id === action.payload.application
            ? { ...application, services: action.payload.services }
            : application
        )
      };
    case "UPDATE_SERVICE":
      return {
        ...state,
        applications: state.applications.map((application) =>
          application.id === action.payload.application
            ? {
                ...application,
                services: application.services?.find(
                  ({ id }) => id === action.payload.service.id
                )
                  ? application.services?.map((service) =>
                      service.id === action.payload.service.id
                        ? action.payload.service
                        : service
                    )
                  : [...(application.services || []), action.payload.service]
              }
            : application
        )
      };
    case "DELETE_SERVICE":
      return {
        ...state,
        applications: state.applications.map((application) =>
          application.id === action.payload.application
            ? {
                ...application,
                services: application.services?.filter(
                  (service) => service.id !== action.payload.service
                )
              }
            : application
        )
      };
    default:
      return state;
  }
};
