import React, { Component } from 'react';
import { Route } from 'react-router-dom';
import darkBaseTheme from 'material-ui/styles/baseThemes/darkBaseTheme';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import { grey200, grey400, grey900 } from 'material-ui/styles/colors';
import Home from './Home';
import Project from './Project';
import 'prosemirror-view/style/prosemirror.css';
import 'prosemirror-menu/style/menu.css';
import 'prosemirror-example-setup/style/style.css';

export default class App extends Component {
  render() {
    return (
      <MuiThemeProvider muiTheme={getMuiTheme({
        ...darkBaseTheme,
        palette: {
          primary1Color: grey900
        },
        slider: {
          trackColor: grey400,
          trackColorSelected: grey400,
          handleColorZero: grey200,
          handleFillColor: grey200,
          selectionColor: grey200,
          rippleColor: grey400
        }
      })}>
        <div>
          <main>
            <Route exact path='/' component={Home} />
            <Route path='/:slug' component={Project} />
          </main>
        </div>
      </MuiThemeProvider>
    );
  }
}
