export const UPDATE_EDITOR_STATE = 'textEditor/UPDATE_EDITOR_STATE';
export const CLOSE_EDITOR = 'textEditor/CLOSE_EDITOR';
export const SET_HIGHLIGHT_COLOR = 'textEditor/SET_HIGHLIGHT_COLOR';
export const HIDE_COLOR_PICKER = 'textEditor/HIDE_COLOR_PICKER';
export const TOGGLE_COLOR_PICKER = 'textEditor/TOGGLE_COLOR_PICKER';

const initialState = {
  editorStates: {},
  highlightColors: {},
  displayColorPickers: {},
  loading: false,
  errored: false
};

export default function(state = initialState, action) {
  switch (action.type) {
    case UPDATE_EDITOR_STATE:
      let updatedStates = Object.assign({}, state.editorStates);
      updatedStates[action.editorKey] = action.editorState;
      return {
        ...state,
        editorStates: updatedStates
      };

    case CLOSE_EDITOR:
      let cleanedStates = Object.assign({}, state.editorStates);
      delete cleanedStates[action.editorKey];
      return {
        ...state,
        editorStates: cleanedStates
      };

    case SET_HIGHLIGHT_COLOR:
      let updatedHighlightColors = Object.assign({}, state.highlightColors);
      updatedHighlightColors[action.editorKey] = action.highlightColor;
      return {
        ...state,
        highlightColors: updatedHighlightColors
      };

    case HIDE_COLOR_PICKER:
      let updatedDisplayColorPickers = Object.assign({}, state.displayColorPickers);
      updatedDisplayColorPickers[action.editorKey] = false;
      return {
        ...state,
        displayColorPickers: updatedDisplayColorPickers
      };

    case TOGGLE_COLOR_PICKER:
      let updatedToggleDisplayColorPickers = Object.assign({}, state.displayColorPickers);
      updatedToggleDisplayColorPickers[action.editorKey] = !updatedToggleDisplayColorPickers[action.editorKey];
      return {
        ...state,
        displayColorPickers: updatedToggleDisplayColorPickers
      };

    default:
      return state;
  }
}

export function updateEditorState(editorKey, editorState) {
  return function(dispatch) {
    dispatch({
      type: UPDATE_EDITOR_STATE,
      editorKey,
      editorState
    });
  }
}

export function closeEditor(editorKey) {
  return function(dispatch) {
    dispatch({
      type: CLOSE_EDITOR,
      editorKey
    });
  }
}

export function setTextHighlightColor(editorKey, highlightColor) {
  return function(dispatch) {
    dispatch({
      type: SET_HIGHLIGHT_COLOR,
      editorKey,
      highlightColor
    });
    dispatch({
      type: HIDE_COLOR_PICKER,
      editorKey
    });
  }
}

export function toggleTextColorPicker(editorKey) {
  return function(dispatch) {
    dispatch({
      type: TOGGLE_COLOR_PICKER,
      editorKey
    });
  }
}
