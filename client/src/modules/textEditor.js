export const UPDATE_EDITOR_STATE = 'textEditor/UPDATE_EDITOR_STATE';
export const CLOSE_EDITOR = 'textEditor/CLOSE_EDITOR';
export const SET_HIGHLIGHT_COLOR = 'textEditor/SET_HIGHLIGHT_COLOR';
export const HIDE_COLOR_PICKER = 'textEditor/HIDE_COLOR_PICKER';
export const TOGGLE_COLOR_PICKER = 'textEditor/TOGGLE_COLOR_PICKER';
export const SET_HIGHLIGHT_SELECT_MODE = 'textEditor/SET_HIGHLIGHT_SELECT_MODE';
export const SELECT_HIGHLIGHT = 'textEditor/SELECT_HIGHLIGHT';
export const TOGGLE_HIGHLIGHTS = 'textEditor/TOGGLE_HIGHLIGHTS';

const initialState = {
  editorStates: {},
  highlightColors: {},
  displayColorPickers: {},
  errored: false,
  highlightSelectModes: {},
  selectedHighlights: {},
  highlightsHidden: {},
};

export default function (state = initialState, action) {
  switch (action.type) {
    case UPDATE_EDITOR_STATE:
      const updatedStates = { ...state.editorStates };
      updatedStates[action.editorKey] = action.editorState;
      return {
        ...state,
        editorStates: updatedStates,
      };

    case CLOSE_EDITOR:
      const cleanedStates = { ...state.editorStates };
      delete cleanedStates[action.editorKey];
      return {
        ...state,
        editorStates: cleanedStates,
      };

    case SET_HIGHLIGHT_COLOR:
      const updatedHighlightColors = { ...state.highlightColors };
      updatedHighlightColors[action.editorKey] = action.highlightColor;
      return {
        ...state,
        highlightColors: updatedHighlightColors,
      };

    case HIDE_COLOR_PICKER:
      const updatedDisplayColorPickers = { ...state.displayColorPickers };
      updatedDisplayColorPickers[action.editorKey] = false;
      return {
        ...state,
        displayColorPickers: updatedDisplayColorPickers,
      };

    case TOGGLE_COLOR_PICKER:
      const updatedToggleDisplayColorPickers = { ...state.displayColorPickers };
      updatedToggleDisplayColorPickers[action.editorKey] = !updatedToggleDisplayColorPickers[action.editorKey];
      return {
        ...state,
        displayColorPickers: updatedToggleDisplayColorPickers,
      };

    case SET_HIGHLIGHT_SELECT_MODE:
      const updatedHighlightSelectModes = { ...state.highlightSelectModes };
      updatedHighlightSelectModes[action.editorKey] = action.value;
      return {
        ...state,
        highlightSelectModes: updatedHighlightSelectModes,
      };

    case SELECT_HIGHLIGHT:
      const updatedSelectedHighlights = { ...state.selectedHighlights };
      updatedSelectedHighlights[action.editorKey] = action.highlightKey;
      return {
        ...state,
        selectedHighlights: updatedSelectedHighlights,
      };

    case TOGGLE_HIGHLIGHTS:
      const highlightsHidden = { ...state.highlightsHidden };
      highlightsHidden[action.editorKey] = action.value;
      return {
        ...state,
        highlightsHidden,
      };

    default:
      return state;
  }
}

export function updateEditorState(editorKey, editorState) {
  return function (dispatch) {
    dispatch({
      type: UPDATE_EDITOR_STATE,
      editorKey,
      editorState,
    });
  };
}

export function closeEditor(editorKey) {
  return function (dispatch) {
    return dispatch({
      type: CLOSE_EDITOR,
      editorKey,
    });
  };
}

export function setTextHighlightColor(editorKey, highlightColor) {
  return function (dispatch) {
    dispatch({
      type: SET_HIGHLIGHT_COLOR,
      editorKey,
      highlightColor,
    });
    dispatch({
      type: HIDE_COLOR_PICKER,
      editorKey,
    });
  };
}

export function toggleTextColorPicker(editorKey) {
  return function (dispatch) {
    dispatch({
      type: TOGGLE_COLOR_PICKER,
      editorKey,
    });
  };
}

export function setHighlightSelectMode(editorKey, value) {
  return function (dispatch, getState) {
    dispatch({
      type: SET_HIGHLIGHT_SELECT_MODE,
      editorKey,
      value,
    });
    // deselect when leaving highlight-select-mode
    if (!value) {
      dispatch({
        type: SELECT_HIGHLIGHT,
        editorKey,
        highlightKey: null,
      });
      window.setTimeout(() => {
        dispatch({
          type: UPDATE_EDITOR_STATE,
          editorKey,
          editorState: getState().textEditor.editorStates[editorKey],
        });
      }, 500);
    }
  };
}

export function selectHighlight(editorKey, highlightKey) {
  return function (dispatch) {
    dispatch({
      type: SELECT_HIGHLIGHT,
      editorKey,
      highlightKey, // pass null to this parameter to deselect
    });
  };
}

export function toggleTextHighlights(editorKey, value) {
  return function (dispatch) {
    dispatch({
      type: TOGGLE_HIGHLIGHTS,
      editorKey,
      value,
    });
  };
}
