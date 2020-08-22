import { createMuiTheme, makeStyles, ThemeProvider } from "@material-ui/core";
import CssBaseline from "@material-ui/core/CssBaseline";
import React from "react";
import { BrowserRouter } from "react-router-dom";
import Home from "./components/Home";
import Layout from "./components/Layout";

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

  return (
    <div className={classes.root}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <BrowserRouter>
          <Layout>
            <Home />
          </Layout>
        </BrowserRouter>
      </ThemeProvider>
    </div>
  );
}

export default App;
