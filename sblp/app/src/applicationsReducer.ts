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
    default:
      return state;
  }
};
