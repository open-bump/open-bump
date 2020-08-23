import { Typography } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import React from "react";

const useStyles = makeStyles((theme) => ({
  typography: {
    marginBottom: theme.spacing(1)
  }
}));

export default function Home() {
  const classes = useStyles();

  return (
    <>
      <Typography variant="h3" component="h1" className={classes.typography}>
        Home
      </Typography>
      <Typography className={classes.typography}>
        While SBLP can work very well in it's initial HTTP version, this
        centralized service aims to provide an easier and more secure way for
        developers to implement and offer SBLP functionality to their users.
        SBLP Centralized keeps track of all compatible applications and offers a
        bridge between them.
      </Typography>
      <Typography className={classes.typography}>
        It allows developers to use a single endpoint to broadcast their bump
        requests to all bots, and allows them to always receive bump requests by
        the same client with the same authorization header, removing the
        requirement for developers to keep track of other bots completely.
      </Typography>
      <Typography className={classes.typography}>
        To get access to SBLP Centralized or find out more about it, please
        contact Looat#0001 on Discord.
      </Typography>
    </>
  );
}
