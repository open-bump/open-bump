import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
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
            <Typography >
              If you add a new service, SBLP Centralized will start sending your
              bot's bump requests to the new bot too. Also, you will be provided
              a token which you need to hand over to the other bot's
              administrator.
            </Typography>
          </Grid>
          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel id="demo-simple-select-label">Age</InputLabel>
              <Select
                labelId="demo-simple-select-label"
                id="demo-simple-select"
              >
                <MenuItem value={10}>Ten</MenuItem>
                <MenuItem value={20}>Twenty</MenuItem>
                <MenuItem value={30}>Thirty</MenuItem>
              </Select>
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
