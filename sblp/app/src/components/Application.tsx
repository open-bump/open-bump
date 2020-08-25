import {
  Fab,
  Grid,
  makeStyles,
  Paper,
  TextField,
  Typography,
  Zoom
} from "@material-ui/core";
import SaveIcon from "@material-ui/icons/Save";
import Alert from "@material-ui/lab/Alert";
import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { RouteComponentProps, withRouter } from "react-router-dom";
import { api } from "../App";
import { ApplicationsState } from "../applicationsReducer";
import { IApplicationService } from "../types";
import ApplicationService from "./partials/ApplicationService";
import NotFound from "./partials/NotFound";

const useStyles = makeStyles((theme) => ({
  paper: { padding: theme.spacing(2) },
  fab: {
    position: "fixed",
    bottom: theme.spacing(3),
    right: theme.spacing(3)
  }
}));

function Application(props: RouteComponentProps<{ application: string }>) {
  const classes = useStyles();

  const application = useSelector<
    ApplicationsState,
    ApplicationsState["applications"][0] | undefined
  >((state) =>
    state.applications.find(({ id }) => id === props.match.params.application)
  );

  const [id, setId] = useState("");
  const [data, setData] = useState(application);

  useEffect(() => {
    if (application) setData(application);
    setId(application?.id || "");
  }, [application]);

  useEffect(() => {
    if (id) api.getApplicationServices(id);
  }, [id]);

  const hasChanged = (() => {
    if (!data) return false;
    return Boolean(
      data.rebuild(data).changed() ||
        data.services?.find((service) => service.rebuild(service).changed())
    );
  })();

  const handleFieldChange = (field: keyof NonNullable<typeof data>) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    if (data) setData({ ...data, [field]: event.target.value });
  };

  const handleSave = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    return new Promise(async () => {
      console.log(1);
      if (!data || !data.services) return;
      console.log(2);
      if (data.rebuild(data).changed()) {
        console.log(3);
        await api.patchApplication(data.id, data);
        console.log(4);
      }
      for (const service of data.services) {
        console.log(5);
        if (service.rebuild(service).changed()) {
          console.log(6);
          await api.patchApplicationService(data.id, service.id, service);
          console.log(7);
        }
        console.log(8);
      }
    });
  };

  return (
    <>
      {data ? (
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
                      value={data.name}
                      onChange={handleFieldChange("name")}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      label="Domain"
                      helperText={
                        "This is the domain other bots use as base when requesting bumps from your bot. It can only be changed by an SBLP Centralized administrator."
                      }
                      fullWidth
                      value={data.host || ""}
                      disabled
                    />
                  </Grid>
                </Grid>
              </Paper>
            </Grid>
            {data.services && (
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
                        This is a dangerous section. Changing service tokens
                        might break your bot's connection to other bots.
                      </Alert>
                    </Grid>
                    <Grid item xs={12}>
                      {data.services.map((service) => (
                        <ApplicationService
                          key={service.id}
                          application={data}
                          state={service}
                          setState={(state: IApplicationService) =>
                            setData({
                              ...data,
                              services: data.services?.map((service) =>
                                service.id === state.id ? state : service
                              )
                            })
                          }
                        />
                      ))}
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>
            )}
          </Grid>
          <Zoom in={hasChanged} unmountOnExit>
            <Fab
              aria-label="Save"
              className={classes.fab}
              color="primary"
              type="submit"
            >
              <SaveIcon />
            </Fab>
          </Zoom>
        </form>
      ) : (
        <NotFound />
      )}
    </>
  );
}

export default withRouter(Application);
