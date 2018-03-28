import { combineReducers } from 'redux';
import { routerReducer } from 'react-router-redux';
import project from './project';
import resourceGrid from './resourceGrid';
import annotationViewer from './annotationViewer';
import textEditor from './textEditor';

export default combineReducers({
  routing: routerReducer,
  project,
  resourceGrid,
  annotationViewer,
  textEditor
});
