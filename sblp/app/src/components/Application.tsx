import { Button, Fab, Zoom } from "@material-ui/core";
import Grid from "@material-ui/core/Grid";
import Paper from "@material-ui/core/Paper";
import { makeStyles } from "@material-ui/core/styles";
import TextField from "@material-ui/core/TextField";
import Typography from "@material-ui/core/Typography";
import SaveIcon from "@material-ui/icons/Save";
import Alert from "@material-ui/lab/Alert";
import React, { FormEvent, useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { RouteComponentProps, withRouter } from "react-router-dom";
import { api } from "../App";
import { ApplicationsState } from "../applicationsReducer";
import ApplicationService, {
  IApplicationServiceState
} from "./partials/ApplicationService";
import ConfirmDialog from "./utils/dialog/ConfirmDialog";
import CopyDialog from "./utils/dialog/CopyDialog";

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
    position: "fixed",
    bottom: theme.spacing(3),
    right: theme.spacing(3)
  },
  nested: {
    paddingLeft: theme.spacing(4)
  }
}));

function Application(props: RouteComponentProps<{ application: string }>) {
  const classes = useStyles();

  const [open, setOpen] = useState(false);
  const [copy, setCopy] = useState(false);
  const [applicationId, setApplicationId] = useState("");

  const application = useSelector<
    ApplicationsState,
    ApplicationsState["applications"][0] | undefined
  >((state) =>
    state.applications.find(({ id }) => id === props.match.params.application)
  );

  if (application?.id && application.id !== applicationId)
    setApplicationId(application.id);

  const defaultApplicationState = useMemo(
    () => ({
      name: application?.name || "",
      host: application?.host || "",
      authorization: application?.authorization || ""
    }),
    [application]
  );

  const defaultServicesState = useMemo<{
    [id: string]: IApplicationServiceState;
  }>(() => ({}), []);
  const [applicationState, setApplicationState] = useState(
    defaultApplicationState
  );
  const [initialApplicationState, setInitialApplicationState] = useState(
    defaultApplicationState
  );
  const [servicesState, setServicesState] = useState(defaultServicesState);
  const [initialServicesState, setInitialServicesState] = useState(
    defaultServicesState
  );

  const services = application?.services;

  useEffect(() => {
    setApplicationState(defaultApplicationState);
    setInitialApplicationState(defaultApplicationState);
    const servicesState = { ...defaultServicesState };
    if (services)
      for (const service of services)
        servicesState[service.id] = { authorization: service.authorization };
    setServicesState(servicesState);
    setInitialServicesState(servicesState);
  }, [defaultApplicationState, defaultServicesState, services]);

  useEffect(() => {
    if (applicationId) api.getApplicationServices(applicationId);
  }, [applicationId]);

  const hasChanged = () =>
    JSON.stringify(applicationState) !==
      JSON.stringify(initialApplicationState) ||
    JSON.stringify(servicesState) !== JSON.stringify(initialServicesState);

  const handleSave = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!application || !services) return;
    api.patchApplication(application.id, applicationState);
    for (const service of services)
      api.patchApplicationService(
        application.id,
        service.id,
        servicesState[service.id]
      );
  };

  const handleReset = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    e.preventDefault();
    if (!application) return;
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleConfirm = () => {
    handleClose();
    if (!application) return;
    api.resetApplicationToken(application.id);
  };

  const handleCopy = () => {
    if (!application) return;
    setCopy(true);
  };

  return (
    <>
      <form onSubmit={handleSave}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Paper className={classes.paper}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Typography variant="h6" component="h1">
                    Bot Information
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Name"
                    helperText="This is the name of your bot. It is only for informational purposes on this dashboard, other bots will use your bot's ID to retrieve it's name."
                    fullWidth
                    value={applicationState.name}
                    onChange={(e) =>
                      setApplicationState({
                        ...applicationState,
                        name: e.target.value
                      })
                    }
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Bot ID"
                    helperText="This is the ID of your bot. You can't change this."
                    fullWidth
                    value={application?.bot || ""}
                    disabled
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Domain"
                    helperText={
                      'This is the domain other bots use as base when requesting bumps from your bot. Example: "openbump.bot.discord.one"'
                    }
                    fullWidth
                    value={applicationState.host}
                    onChange={(e) =>
                      setApplicationState({
                        ...applicationState,
                        host: e.target.value
                      })
                    }
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Token"
                    helperText="This is the token your bot will need to pass in the `Authorization` header to make requests to SBLP Centralized."
                    fullWidth
                    value={application?.token || "Not set"}
                    disabled
                    InputProps={{
                      endAdornment: (
                        <>
                          <Button color="primary" onClick={handleCopy}>
                            Copy
                          </Button>
                          <Button color="primary" onClick={handleReset}>
                            Reset
                          </Button>
                        </>
                      )
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Authorization"
                    helperText="SBLP Centralized will provide this in the `Authorization` header when making requests to your server. Use this to verify the authenticity of SBLP Centralized."
                    fullWidth
                    value={applicationState.authorization}
                    onChange={(e) =>
                      setApplicationState({
                        ...applicationState,
                        authorization: e.target.value
                      })
                    }
                  />
                </Grid>
              </Grid>
            </Paper>
          </Grid>
          <Grid item xs={12}>
            <Paper className={classes.paper}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Typography variant="h6" component="h2">
                    Services
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Alert variant="outlined" severity="warning">
                    This is a dangerous section. Changing service tokens might
                    break your bot's connection to other bots.
                  </Alert>
                </Grid>
                <Grid item xs={12}>
                  {application?.services?.map((service) => (
                    <ApplicationService
                      key={service.id}
                      application={application}
                      state={
                        servicesState[service.id] || {
                          authorization: service.authorization
                        }
                      }
                      setState={(state: IApplicationServiceState) => {
                        setServicesState({
                          ...servicesState,
                          [service.id]: state
                        });
                      }}
                      service={service}
                    />
                  ))}
                </Grid>
              </Grid>
            </Paper>
          </Grid>
        </Grid>
        <Zoom in={hasChanged()} unmountOnExit>
          <Fab
            aria-label={"Save"}
            className={classes.fab}
            color="primary"
            type="submit"
          >
            <SaveIcon />
          </Fab>
        </Zoom>
      </form>
      <ConfirmDialog
        open={open}
        onClose={handleClose}
        onConfirm={handleConfirm}
      />
      <CopyDialog
        open={copy}
        value={application?.token || ""}
        onClose={() => setCopy(false)}
      />
    </>
  );
}

export default withRouter(Application);
