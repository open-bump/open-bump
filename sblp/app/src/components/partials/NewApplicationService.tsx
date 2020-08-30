import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormHelperText,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography
} from "@material-ui/core";
import Alert from "@material-ui/lab/Alert";
import React, { useEffect, useState } from "react";
import { api } from "../../App";
import { IApplication } from "../../types";

export interface INewApplicationServiceState {
  target: string | null;
  authorization: string;
}

interface INewApplicationServiceProps {
  application: IApplication;
  open: boolean;
  onClose: () => void;
  onConfirm: (state: INewApplicationServiceState) => void;
}

export default function NewApplicationService(
  props: INewApplicationServiceProps
) {
  const defaultState: INewApplicationServiceState = {
    target: null,
    authorization: ""
  };
  const [state, setState] = useState<INewApplicationServiceState>(defaultState);

  const [data, setData] = useState<Array<IApplication> | null>(null);

  const reloadServices = async (application: string) =>
    await api
      .getAvailableServices(application)
      .then((services) => setData(services));

  useEffect(() => {
    reloadServices(props.application.id);
  }, [props.application.id]);

  const handleStateChange = (field: keyof NonNullable<typeof state>) => (
    event: React.ChangeEvent<{ value: unknown }>
  ) => {
    if (state) setState({ ...state, [field]: event.target.value });
  };

  const handleClose = (event?: any) => {
    if (typeof event?.preventDefault === "function") event.preventDefault();
    props.onClose();
  };

  const handleAdd = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!state.target) return;
    api
      .postApplicationService(
        props.application.id,
        state.target,
        state.authorization
      )
      .then(() => props.onClose())
      .then(() => setState(defaultState))
      .then(() => reloadServices(props.application.id));
  };

  return (
    <Dialog open={props.open} onClose={handleClose}>
      <form onSubmit={handleAdd}>
        <DialogTitle id="form-dialog-title">Add New Service</DialogTitle>
        <DialogContent>
          <Grid container spacing={2}>
            {data && data.length === 0 && (
              <Grid item xs={12}>
                <Alert variant="outlined" severity="warning">
                  Your bot already is using all services and you can not add
                  more.
                </Alert>
              </Grid>
            )}
            <Grid item xs={12}>
              <Typography>
                If you add a new service, SBLP Centralized will start sending
                your bot's bump requests to the new bot. You will also be
                provided a token, which you need to hand over to the other bot's
                administrator.
              </Typography>
            </Grid>
            {!data ||
              (data.length !== 0 && (
                <>
                  <Grid item xs={12}>
                    <FormControl fullWidth>
                      <InputLabel id="select-application-label">
                        Application
                      </InputLabel>
                      <Select
                        labelId="select-application-label"
                        id="select-application"
                        value={state.target || ""}
                        onChange={handleStateChange("target")}
                      >
                        {data.map((application) => (
                          <MenuItem value={application.id} key={application.id}>
                            {application.name}
                          </MenuItem>
                        ))}
                      </Select>
                      <FormHelperText>
                        You can only add bots known to SBLP Centralized. If
                        you're missing a bot, please ask an admin.
                      </FormHelperText>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      label="Authorization"
                      helperText="This token is used to make requests to other bots. Insert the other bot's `Token` in here."
                      fullWidth
                      value={state.authorization}
                      onChange={handleStateChange("authorization")}
                    />
                  </Grid>
                </>
              ))}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} color="primary">
            Cancel
          </Button>
          <Button
            color="primary"
            type="submit"
            disabled={!state.target || !state.authorization}
          >
            Add
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
