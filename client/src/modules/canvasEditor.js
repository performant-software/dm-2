export const SET_HIGHLIGHT_COLOR = 'canvasEditor/SET_HIGHLIGHT_COLOR';
export const HIDE_COLOR_PICKER = 'canvasEditor/HIDE_COLOR_PICKER';
export const TOGGLE_COLOR_PICKER = 'canvasEditor/TOGGLE_COLOR_PICKER';
export const SET_ADD_TILE_SOURCE_MODE = 'canvasEditor/SET_ADD_TILE_SOURCE_MODE';
export const SET_IS_PENCIL_MODE = 'canvasEditor/SET_IS_PENCIL_MODE';
export const SET_ZOOM_CONTROL = 'canvasEditor/SET_ZOOM_CONTROL';
export const SET_GLOBAL_CANVAS_DISPLAY = 'canvasEditor/SET_GLOBAL_CANVAS_DISPLAY';
export const IIIF_TILE_SOURCE_TYPE = 'iiif';
export const IMAGE_URL_SOURCE_TYPE = 'image_url';
export const UPLOAD_SOURCE_TYPE = 'upload';

const initialState = {
  highlightColors: {},
  displayColorPickers: {},
  addTileSourceMode: {},
  isPencilMode: {},
  zoomControls: {},
  globalCanvasDisplay: true
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

    case SET_ADD_TILE_SOURCE_MODE:
      let updatedAddTileSourceMode = Object.assign({}, state.addTileSourceMode);
      updatedAddTileSourceMode[action.editorKey] = action.mode;
      return {
        ...state,
        addTileSourceMode: updatedAddTileSourceMode
      };

    case SET_IS_PENCIL_MODE:
      let updatedPencilMode = Object.assign({}, state.isPencilMode);
      updatedPencilMode[action.editorKey] = action.isPencilMode;
      return {
        ...state,
        isPencilMode: updatedPencilMode
      };

    case SET_ZOOM_CONTROL:
      let updatedZoomControls = Object.assign({}, state.zoomControls);
      updatedZoomControls[action.editorKey] = action.zoomValue;
      return {
        ...state,
        zoomControls: updatedZoomControls
      };

    case SET_GLOBAL_CANVAS_DISPLAY:
      return {
        ...state,
        globalCanvasDisplay: action.value
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

export function setAddTileSourceMode(editorKey, mode) {
  return function(dispatch) {
    dispatch({
      type: SET_ADD_TILE_SOURCE_MODE,
      editorKey,
      mode
    });
  }
}

export function setIsPencilMode(editorKey, isPencilMode) {
  return function(dispatch) {
    dispatch({
      type: SET_IS_PENCIL_MODE,
      editorKey,
      isPencilMode
    });
  }
}

export function setZoomControl(editorKey, zoomValue) {
  return function(dispatch) {
    dispatch({
      type: SET_ZOOM_CONTROL,
      editorKey,
      zoomValue
    });
  }
}

export function setGlobalCanvasDisplay(value) {
  return function(dispatch) {
    dispatch({
      type: SET_GLOBAL_CANVAS_DISPLAY,
      value
    });
  }
}
