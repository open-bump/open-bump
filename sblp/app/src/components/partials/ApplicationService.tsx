import {
  Accordion,
  AccordionActions,
  AccordionSummary,
  Divider,
  Grid,
  makeStyles,
  TextField
} from "@material-ui/core";
import AccordionDetails from "@material-ui/core/AccordionDetails";
import Button from "@material-ui/core/Button";
import Typography from "@material-ui/core/Typography";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import React, { useState } from "react";
import { api } from "../../App";
import { IApplication, IApplicationService } from "../../types";
import ConfirmDialog from "../utils/dialog/ConfirmDialog";
import CopyDialog from "../utils/dialog/CopyDialog";

const useStyles = makeStyles((theme) => ({
  root: {
    width: "100%"
  },
  heading: {
    fontSize: theme.typography.pxToRem(15)
  },
  secondaryHeading: {
    fontSize: theme.typography.pxToRem(15),
    color: theme.palette.text.secondary
  },
  icon: {
    verticalAlign: "bottom",
    height: 20,
    width: 20
  },
  details: {
    alignItems: "center"
  },
  column: {
    flexBasis: "33.33%"
  },
  helper: {
    borderLeft: `2px solid ${theme.palette.divider}`,
    padding: theme.spacing(1, 2)
  },
  link: {
    color: theme.palette.primary.main,
    textDecoration: "none",
    "&:hover": {
      textDecoration: "underline"
    }
  }
}));

export interface IApplicationServiceState {
  authorization: string;
}

interface IApplicationServiceProps {
  application: IApplication;
  state: IApplicationService;
  setState: (state: IApplicationService) => void;
}

export default function ApplicationService(props: IApplicationServiceProps) {
  const classes = useStyles();

  const { application, state, setState } = props;

  const [open, setOpen] = useState<false | "reset" | "delete">(false);
  const [copy, setCopy] = useState(false);

  const handleReset = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    e.preventDefault();
    setOpen("reset");
  };

  const handleDelete = () => {
    setOpen("delete");
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleConfirmReset = () => {
    handleClose();
    api.resetApplicationServiceToken(application.id, state.id);
  };

  const handleConfirmDelete = () => {
    handleClose();
    api
      .deleteApplicationService(application.id, state.id)
      .then(() => api.getAvailableServices(application.id));
  };

  const handleCopy = () => {
    setCopy(true);
  };

  return (
    <>
      <Accordion>
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls="panel1c-content"
        >
          <div className={classes.column}>
            <Typography className={classes.heading} component="h3">
              {state.target.name}
            </Typography>
          </div>
        </AccordionSummary>
        <AccordionDetails className={classes.details}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                label="Token"
                helperText={`This is the token other bots need to pass in the \`Authorization\` header when making requests to https://${
                  application.host || "yourbot.bot.discord.one"
                }/.`}
                fullWidth
                value={state.token}
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
                helperText="SBLP Centralized will pass this token when making requests to other bots. If the other bot uses SBLP Centralized too, you need to insert it's service's `Token` here."
                fullWidth
                value={state.authorization}
                onChange={(e) =>
                  setState({ ...state, authorization: e.target.value })
                }
              />
            </Grid>
          </Grid>
        </AccordionDetails>
        <Divider />
        <AccordionActions>
          <Button size="small" color="secondary" onClick={handleDelete}>
            Delete
          </Button>
        </AccordionActions>
      </Accordion>
      <ConfirmDialog
        open={open === "reset"}
        onClose={handleClose}
        onConfirm={handleConfirmReset}
      />
      <ConfirmDialog
        open={open === "delete"}
        title="Delete Service?"
        content="The service will be deleted immediately and you'll need to add it again to restore functionality."
        onClose={handleClose}
        onConfirm={handleConfirmDelete}
      />
      <CopyDialog
        open={copy}
        value={state.token || ""}
        onClose={() => setCopy(false)}
      />
    </>
  );
}
