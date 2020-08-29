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
import React, { useState } from "react";

export interface INewApplicationServiceState {
  authorization: string;
}

interface INewApplicationServiceProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (state: INewApplicationServiceState) => void;
}

export default function NewApplicationService(
  props: INewApplicationServiceProps
) {
  const [state, setState] = useState({ authorization: "" });

  const handleClose = (event?: any) => {
    if (event) event.preventDefault();
    props.onClose();
  };

  return (
    <Dialog open={props.open} onClose={handleClose}>
      <DialogTitle id="form-dialog-title">Add New Service</DialogTitle>
      <DialogContent>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Typography>
              If you add a new service, SBLP Centralized will start sending your
              bot's bump requests to the new bot. You will also be provided a
              token, which you need to hand over to the other bot's
              administrator.
            </Typography>
          </Grid>
          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel id="select-application-label">Application</InputLabel>
              <Select
                labelId="select-application-label"
                id="select-application"
              >
                <MenuItem value={"jfakls2df"}>Beta Bump</MenuItem>
                <MenuItem value={"2389ujdks"}>Test Portal</MenuItem>
                <MenuItem value={"dj832lk9s"}>Test Bump</MenuItem>
              </Select>
              <FormHelperText>
                You can only add bots known to SBLP Centralized. If you're
                missing a bot, please ask an admin.
              </FormHelperText>
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <TextField
              label="Authorization"
              helperText="This token is used to make requests to other bots. Insert the other bot's `Token` in here."
              fullWidth
              value={state.authorization}
              onChange={(e) =>
                setState({ ...state, authorization: e.target.value })
              }
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} color="primary">
          Cancel
        </Button>
        <Button onClick={handleClose} color="primary">
          Subscribe
        </Button>
      </DialogActions>
    </Dialog>
  );
}
