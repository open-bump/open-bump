import {
  Box,
  Button,
  Chip,
  Fab,
  Grid,
  makeStyles,
  Paper,
  TextField,
  Typography,
  Zoom
} from "@material-ui/core";
import SaveIcon from "@material-ui/icons/Save";
import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { RouteComponentProps, withRouter } from "react-router-dom";
import { api } from "../App";
import { ApplicationsState } from "../applicationsReducer";
import { IApplicationService } from "../types";
import ApplicationService from "./partials/ApplicationService";
import NewApplicationService, { INewApplicationServiceState } from "./partials/NewApplicationService";
import NotFound from "./partials/NotFound";
import ConfirmDialog from "./utils/dialog/ConfirmDialog";
import CopyDialog from "./utils/dialog/CopyDialog";

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
  const [openAddNewService, setOpenAddNewService] = useState(false);

  const [openConfirm, setOpenConfirm] = useState(false);
  const [openCopy, setOpenCopy] = useState("");

  const handleReset = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    e.preventDefault();
    setOpenConfirm(true);
  };

  const handleClose = () => {
    setOpenConfirm(false);
  };

  const handleConfirm = () => {
    handleClose();
    if (!data) return;
    api.resetApplicationToken(data.id);
  };

  const handleCopy = (value: string) => {
    setOpenCopy(value);
  };

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
        <>
          <form onSubmit={handleSave}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Paper className={classes.paper}>
                  <Grid container spacing={3}>
                    <Grid item xs={12}>
                      <Box display="flex">
                        <Box>
                          <Typography variant="h6" component="h1">
                            Bot Information
                          </Typography>
                        </Box>
                        <Box ml={1}>
                          {data.external ? (
                            <Chip label="External" color="secondary" />
                          ) : (
                            <Chip label="SBLP Centralized" color="primary" />
                          )}
                        </Box>
                      </Box>
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
                    {data.external ? (
                      <>
                        <Grid item xs={12}>
                          <TextField
                            label="Base URL"
                            helperText={
                              "This is the base url used when SBLP Centralized makes requests to this application. Base URLs do not include the `/sblp/request` suffix."
                            }
                            placeholder="https://yourbot.bot.discord.one/"
                            fullWidth
                            value={data.base || ""}
                            onChange={handleFieldChange("base")}
                          />
                        </Grid>
                      </>
                    ) : (
                      <>
                        <Grid item xs={12}>
                          <TextField
                            label="Private Base URL"
                            helperText={
                              "This is the base url used when SBLP Centralized forwards other bots' requests to your bot. Base URLs do not include the `/sblp/request` suffix."
                            }
                            placeholder="http://203.0.113.124/"
                            fullWidth
                            value={data.base || ""}
                            onChange={handleFieldChange("base")}
                          />
                        </Grid>
                        <Grid item xs={12}>
                          <TextField
                            label="Public Base URL"
                            helperText={
                              "This is the base url other bots use to request bumps from your bot. Base URLs do not include the `/sblp/request` suffix."
                            }
                            fullWidth
                            value={data.publicBase || ""}
                            disabled
                            InputProps={{
                              endAdornment: (
                                <>
                                  <Button
                                    color="primary"
                                    onClick={() =>
                                      handleCopy(data.publicBase || "")
                                    }
                                  >
                                    Copy
                                  </Button>
                                </>
                              )
                            }}
                          />
                        </Grid>
                        <Grid item xs={12}>
                          <TextField
                            label="Token"
                            helperText={`This is the token other bots need to pass in the \`Authorization\` header when making requests to https://${
                              data.host || "yourbot.bot.discord.one"
                            }/.`}
                            fullWidth
                            value={data.token}
                            disabled
                            InputProps={{
                              endAdornment: (
                                <>
                                  <Button
                                    color="primary"
                                    onClick={() => handleCopy(data.token || "")}
                                  >
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
                            helperText="SBLP Centralized will pass this token when making requests to your bot. You can use it to verify the authenticity of SBLP Centralized."
                            fullWidth
                            value={data.authorization}
                            onChange={handleFieldChange("authorization")}
                          />
                        </Grid>
                      </>
                    )}
                  </Grid>
                </Paper>
              </Grid>
              {data.services && !data.external && (
                <Grid item xs={12}>
                  <Paper className={classes.paper}>
                    <Grid container spacing={3}>
                      <Grid item xs={12}>
                        <Box display="flex" alignContent="space-between">
                          <Box flex={1}>
                            <Typography variant="h6" component="h2">
                              Services
                            </Typography>
                          </Box>
                          <Box>
                            <Button
                              color="primary"
                              variant="outlined"
                              onClick={() => setOpenAddNewService(true)}
                            >
                              Create New
                            </Button>
                          </Box>
                        </Box>
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
          <ConfirmDialog
            open={openConfirm}
            onClose={handleClose}
            onConfirm={handleConfirm}
          />
          <CopyDialog
            open={Boolean(openCopy)}
            value={openCopy || ""}
            onClose={() => setOpenCopy("")}
          />
          <NewApplicationService
          application={data}
            open={openAddNewService}
            onClose={() => {
              setOpenAddNewService(false);
            }}
            onConfirm={(data: INewApplicationServiceState) =>
              setOpenAddNewService(false)
            }
          />
        </>
      ) : (
        <NotFound />
      )}
    </>
  );
}

export default withRouter(Application);
