import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import { ConnectedRouter } from 'react-router-redux';
import store, { history } from './store';
import { verifyCredentials } from './modules/redux-token-auth-config';
import './index.css';
import App from './App';
import unregister from './registerServiceWorker';

verifyCredentials(store);

ReactDOM.render(
  <Provider store={store}>
    <ConnectedRouter history={history}>
      <div>
        <App />
      </div>
    </ConnectedRouter>
  </Provider>,
  document.getElementById('root')
);

unregister();
// TODO perhaps enable this later.
//registerServiceWorker();
