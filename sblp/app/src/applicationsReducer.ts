import { IApplication } from "./types";

export interface ApplicationsState {
  applications: IApplication[];
}

const initialState: ApplicationsState = {
  applications: []
};

type Action =
  | { type: "SET_APPLICATIONS"; payload: Array<IApplication> }
  | { type: "UPDATE_APPLICATION"; payload: IApplication };

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
    default:
      return state;
  }
};
