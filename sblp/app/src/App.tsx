import { createMuiTheme, makeStyles, ThemeProvider } from "@material-ui/core";
import CssBaseline from "@material-ui/core/CssBaseline";
import React, { useEffect } from "react";
import { BrowserRouter, Route, Switch } from "react-router-dom";
import Api from "./Api";
import Application from "./components/Application";
import Home from "./components/Home";
import Layout from "./components/Layout";
import { IApplication } from "./types";

const useStyles = makeStyles((theme) => ({
  root: {
    display: "flex"
  }
}));

function App() {
  const theme = createMuiTheme({
    palette: {
      type: "dark",
      primary: {
        main: "#90caf9"
      }
    }
  });
  const classes = useStyles();

  const [applications, setApplications] = React.useState<Array<IApplication>>(
    []
  );
  useEffect(() => {
    Api.listApplications().then((applications) =>
      setApplications(applications)
    );
  }, []);

  return (
    <div className={classes.root}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <BrowserRouter>
          <Layout applications={applications}>
            <Switch>
              <Route path="/applications/:application">
                <Application applications={applications} />
              </Route>
              <Route path="/" exact>
                <Home />
              </Route>
            </Switch>
          </Layout>
        </BrowserRouter>
      </ThemeProvider>
    </div>
  );
}

export default App;
