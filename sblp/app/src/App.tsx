import { createMuiTheme, makeStyles, ThemeProvider } from "@material-ui/core";
import CssBaseline from "@material-ui/core/CssBaseline";
import React, { useEffect } from "react";
import { BrowserRouter, Route, Switch } from "react-router-dom";
import Api from "./api/Api";
import Application from "./components/Application";
import Home from "./components/Home";
import Layout from "./components/Layout";

export const api = new Api();

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

  useEffect(() => {
    api.getApplications();
  }, []);

  return (
    <div className={classes.root}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <BrowserRouter>
          <Layout>
            <Switch>
              <Route path="/applications/:application">
                <Application />
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
