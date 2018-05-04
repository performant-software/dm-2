import { combineReducers } from 'redux';
import { routerReducer } from 'react-router-redux';
import home from './home';
import project from './project';
import documentGrid from './documentGrid';
import annotationViewer from './annotationViewer';
import textEditor from './textEditor';
import canvasEditor from './canvasEditor';

export default combineReducers({
  routing: routerReducer,
  home,
  project,
  documentGrid,
  annotationViewer,
  textEditor,
  canvasEditor
});
