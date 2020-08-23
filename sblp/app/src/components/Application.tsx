import { Button, Fab } from "@material-ui/core";
import Grid from "@material-ui/core/Grid";
import Paper from "@material-ui/core/Paper";
import { makeStyles } from "@material-ui/core/styles";
import TextField from "@material-ui/core/TextField";
import Typography from "@material-ui/core/Typography";
import SaveIcon from "@material-ui/icons/Save";
import React from "react";
import { RouteComponentProps, withRouter } from "react-router-dom";
import Api from "../Api";
import { IApplication } from "../types";

const useStyles = makeStyles((theme) => ({
  search: {
    padding: "2px 4px",
    display: "flex",
    alignItems: "center"
  },
  input: {
    marginLeft: theme.spacing(1),
    flex: 1
  },
  iconButton: {
    padding: 10
  },
  paper: {
    padding: theme.spacing(2),
    color: theme.palette.text.secondary
  },
  icon: {
    width: theme.spacing(25),
    height: theme.spacing(25)
  },
  actions: {
    marginTop: theme.spacing(1)
  },
  fab: {
    position: "absolute",
    bottom: theme.spacing(3),
    right: theme.spacing(3)
  }
}));

interface IApplicationProps
  extends RouteComponentProps<{ application: string }> {
  applications: Array<IApplication>;
}

function Application(props: IApplicationProps) {
  const classes = useStyles();

  const application = props.applications.find(
    ({ id }) => id === props.match.params.application
  );

  const [state, setState] = React.useState({
    name: application?.name || "",
    authorization: application?.authorization || ""
  });

  React.useEffect(
    () =>
      setState({
        name: application?.name || "",
        authorization: application?.authorization || ""
      }),
    [application]
  );

  const handleSave = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    e.preventDefault();
    if (!application) return;
    Api.updateApplication(application?.id, state);
  };

  return (
    <form>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper className={classes.paper}>
            <Typography variant="h6" component="h1">
              Bot Information
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  label="Name"
                  fullWidth
                  value={state.name}
                  onChange={(e) => setState({ ...state, name: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Token"
                  helperText="This is the token your bot will need to pass in the `Authorization` header to make requests to SBLP."
                  fullWidth
                  value={application?.token || "Not set"}
                  disabled
                  InputProps={{
                    endAdornment: (
                      <>
                        <Button color="primary">Copy</Button>
                        <Button color="primary">Reset</Button>
                      </>
                    )
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Authorization"
                  helperText="SBLP will provide this in the `Authorization` header when making requests to your server. Use this to verify the authenticity of the SBLP."
                  fullWidth
                  value={state.authorization}
                  onChange={(e) =>
                    setState({ ...state, authorization: e.target.value })
                  }
                />
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
      <Fab
        aria-label={"Save"}
        className={classes.fab}
        color="primary"
        type="submit"
        onClick={handleSave}
      >
        <SaveIcon />
      </Fab>
    </form>
  );
}

export default withRouter(Application);
