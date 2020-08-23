import Grid from "@material-ui/core/Grid";
import IconButton from "@material-ui/core/IconButton";
import InputBase from "@material-ui/core/InputBase";
import Paper from "@material-ui/core/Paper";
import { makeStyles } from "@material-ui/core/styles";
import TextField from "@material-ui/core/TextField";
import SearchIcon from "@material-ui/icons/Search";
import MaterialTable from "material-table";
import React from "react";

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
  }
}));

export default function Home(props: React.Props<{}>) {
  const classes = useStyles();

  const [state, setState] = React.useState({
    columns: [
      { title: "Name", field: "name" },
      { title: "Surname", field: "surname" },
      {
        title: "Feature",
        field: "feature",
        lookup: { 34: "Autobump", 63: "Prefix" }
      }
    ],
    data: [
      { name: "Mehmet", surname: "Baran", feature: 63 },
      {
        name: "Zerya Betül",
        surname: "Baran",
        feature: 34
      }
    ]
  });

  const handleSubmit = (event: React.FormEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  return (
    <>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper
            component="form"
            className={classes.search}
            onSubmit={handleSubmit}
          >
            <InputBase
              className={classes.input}
              placeholder="Search Servers"
              inputProps={{ "aria-label": "search guilds" }}
            />
            <IconButton
              type="submit"
              className={classes.iconButton}
              aria-label="search"
            >
              <SearchIcon />
            </IconButton>
          </Paper>
        </Grid>
        <Grid item xs={6}>
          <Paper className={classes.paper}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  label="Name"
                  variant="outlined"
                  fullWidth
                  disabled
                  value="Open Advertisements"
                />
              </Grid>
            </Grid>
          </Paper>
        </Grid>
        <Grid item xs={6}>
          {/* <Paper className={classes.paper}> */}
          <MaterialTable
            title="Example"
            columns={state.columns}
            data={state.data}
            options={{ search: false, actionsColumnIndex: -1 }}
            editable={{
              onRowDelete: (oldData) =>
                new Promise((resolve) => {
                  setTimeout(() => {
                    resolve();
                    setState((prevState) => {
                      const data = [...prevState.data];
                      data.splice(data.indexOf(oldData), 1);
                      return { ...prevState, data };
                    });
                  }, 600);
                })
            }}
          />
          {/* </Paper> */}
        </Grid>
      </Grid>
    </>
  );
}
