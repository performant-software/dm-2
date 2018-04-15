import React, { Component } from 'react';
import { Route} from 'react-router-dom';
import Home from './Home';
import Project from './Project';
import 'prosemirror-view/style/prosemirror.css';
import 'prosemirror-menu/style/menu.css';
import 'prosemirror-example-setup/style/style.css';

export default class App extends Component {
  render() {
    return (
      <div>
        <main>
          <Route exact path='/' component={Home} />
          <Route exact path='/project' component={Project} />
        </main>
      </div>
    );
  }
}
