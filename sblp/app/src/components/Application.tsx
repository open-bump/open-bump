import {
  Grid,
  makeStyles,
  Paper,
  TextField,
  Typography
} from "@material-ui/core";
import Alert from "@material-ui/lab/Alert";
import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { RouteComponentProps } from "react-router-dom";
import { ApplicationsState } from "../applicationsReducer";
import ApplicationService from "./partials/ApplicationService";
import NotFound from "./partials/NotFound";

const useStyles = makeStyles((theme) => ({
  paper: { padding: theme.spacing(2) }
}));

interface IDataState {
  name: string;
  authorization: string;
  services: Array<{
    id: string;
    authorization: string;
  }>;
}

function Application(props: RouteComponentProps<{ application: string }>) {
  const classes = useStyles();

  const application = useSelector<
    ApplicationsState,
    ApplicationsState["applications"][0] | undefined
  >((state) =>
    state.applications.find(({ id }) => id === props.match.params.application)
  );

  const [data, setData] = useState<IDataState>({ name: "", authorization: "" });

  useEffect(() => {
    if (application)
      setData({
        name: application.name,
        authorization: application.authorization || "",
        services: (application.services || []).map((service) => ({
          id: service.id,
          authorization: service.authorization || ""
        }))
      });
  }, [application]);

  const handleFieldChange = (field: keyof IDataState) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setData({ ...data, [field]: event.target.value });
  };

  return (
    <>
      {application ? (
        <form>
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
                      value={application.host}
                      disabled
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
                    {data.services.map((service, index) => (
                      <ApplicationService
                        key={service.id}
                        state={service}
                        onChange={handleFieldChange("services")}
                      />
                    ))}
                  </Grid>
                </Grid>
              </Paper>
            </Grid>
          </Grid>
        </form>
      ) : (
        <NotFound />
      )}
    </>
  );
}

export default withRouter(Application);
