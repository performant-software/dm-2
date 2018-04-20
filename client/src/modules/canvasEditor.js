export const SET_HIGHLIGHT_COLOR = 'canvasEditor/SET_HIGHLIGHT_COLOR';
export const HIDE_COLOR_PICKER = 'canvasEditor/HIDE_COLOR_PICKER';
export const TOGGLE_COLOR_PICKER = 'canvasEditor/TOGGLE_COLOR_PICKER';

const initialState = {
  highlightColors: {},
  displayColorPickers: {}
};

export default function(state = initialState, action) {
  switch (action.type) {
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

export function setCanvasHighlightColor(editorKey, highlightColor) {
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

export function toggleCanvasColorPicker(editorKey) {
  return function(dispatch) {
    dispatch({
      type: TOGGLE_COLOR_PICKER,
      editorKey
    });
  }
}
