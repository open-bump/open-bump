import {
  Accordion,
  AccordionSummary,
  Grid,
  makeStyles,
  TextField
} from "@material-ui/core";
import AccordionDetails from "@material-ui/core/AccordionDetails";
import Button from "@material-ui/core/Button";
import Typography from "@material-ui/core/Typography";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import React, { useState } from "react";
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

interface IApplicationServiceProps {
  application: IApplication;
  service: IApplicationService;
}

export default function ApplicationService(props: IApplicationServiceProps) {
  const classes = useStyles();

  const [open, setOpen] = useState(false);
  const [copy, setCopy] = useState(false);

  const handleReset = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    e.preventDefault();
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleConfirm = () => {
    handleClose();
    // api.resetApplicationServiceToken(props.service.id);
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
            <Typography className={classes.heading}>
              {props.service.target.name}
            </Typography>
          </div>
        </AccordionSummary>
        <AccordionDetails className={classes.details}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                label="Token"
                helperText={`This is the token other bots need to pass in the \`Authorization\` header when making requests to https://${
                  props.application.host || "yourbot.bot.discord.one"
                }/.`}
                fullWidth
                value={props.service.token}
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
                value={props.service.authorization}
              />
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>
      <ConfirmDialog
        open={open}
        onClose={handleClose}
        onConfirm={handleConfirm}
      />
      <CopyDialog
        open={copy}
        value={props.service.token || ""}
        onClose={() => setCopy(false)}
      />
    </>
  );
}
