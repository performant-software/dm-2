import { combineReducers } from 'redux';
import { routerReducer } from 'react-router-redux';
import { reduxTokenAuthReducer } from 'redux-token-auth';
import home from './home';
import project from './project';
import folders from './folders';
import documentGrid from './documentGrid';
import annotationViewer from './annotationViewer';
import textEditor from './textEditor';
import canvasEditor from './canvasEditor';
import search from './search';

export default combineReducers({
  routing: routerReducer,
  reduxTokenAuth: reduxTokenAuthReducer,
  home,
  project,
  folders,
  documentGrid,
  annotationViewer,
  textEditor,
  canvasEditor,
  search
});
