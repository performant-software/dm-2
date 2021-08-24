export const SET_HIGHLIGHT_COLOR = 'canvasEditor/SET_HIGHLIGHT_COLOR';
export const HIDE_COLOR_PICKER = 'canvasEditor/HIDE_COLOR_PICKER';
export const TOGGLE_COLOR_PICKER = 'canvasEditor/TOGGLE_COLOR_PICKER';
export const SET_ADD_TILE_SOURCE_MODE = 'canvasEditor/SET_ADD_TILE_SOURCE_MODE';
export const SET_IS_PENCIL_MODE = 'canvasEditor/SET_IS_PENCIL_MODE';
export const SET_ZOOM_CONTROL = 'canvasEditor/SET_ZOOM_CONTROL';
export const SET_GLOBAL_CANVAS_DISPLAY = 'canvasEditor/SET_GLOBAL_CANVAS_DISPLAY';
export const SET_IMAGE_URL = 'canvasEditor/SET_IMAGE_URL';
export const TOGGLE_HIGHLIGHTS = 'canvasEditor/TOGGLE_HIGHLIGHTS';
export const IIIF_TILE_SOURCE_TYPE = 'iiif';
export const IMAGE_URL_SOURCE_TYPE = 'image_url';
export const UPLOAD_SOURCE_TYPE = 'upload';
export const PAGE_TO_CHANGE = 'canvasEditor/PAGE_TO_CHANGE';
export const RENAME_LAYER = 'canvasEditor/RENAME_LAYER';
export const RENAME_LAYER_SUCCESS = 'canvasEditor/RENAME_LAYER_SUCCESS';
export const TOGGLE_EDIT_LAYER_NAME = 'canvasEditor/TOGGLE_EDIT_LAYER_NAME';

const initialState = {
  highlightColors: {},
  displayColorPickers: {},
  addTileSourceMode: {},
  highlightsHidden: {},
  imageURLs: {},
  isPencilMode: {},
  zoomControls: {},
  globalCanvasDisplay: true,
  pageToChange: {},
  editingLayerName: {},
};

export default function (state = initialState, action) {
  switch (action.type) {
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

    case SET_ADD_TILE_SOURCE_MODE:
      const updatedAddTileSourceMode = { ...state.addTileSourceMode };
      updatedAddTileSourceMode[action.editorKey] = action.mode;
      return {
        ...state,
        addTileSourceMode: updatedAddTileSourceMode,
      };

    case SET_IMAGE_URL:
      const imageURLs = { ...state.imageURLs };
      imageURLs[action.editorKey] = action.url;
      return {
        ...state,
        imageURLs,
      };

    case SET_IS_PENCIL_MODE:
      const updatedPencilMode = { ...state.isPencilMode };
      updatedPencilMode[action.editorKey] = action.isPencilMode;
      return {
        ...state,
        isPencilMode: updatedPencilMode,
      };

    case SET_ZOOM_CONTROL:
      const updatedZoomControls = { ...state.zoomControls };
      updatedZoomControls[action.editorKey] = action.zoomValue;
      return {
        ...state,
        zoomControls: updatedZoomControls,
      };

    case SET_GLOBAL_CANVAS_DISPLAY:
      return {
        ...state,
        globalCanvasDisplay: action.value,
      };

    case TOGGLE_HIGHLIGHTS:
      const highlightsHidden = { ...state.highlightsHidden };
      highlightsHidden[action.editorKey] = action.value;
      return {
        ...state,
        highlightsHidden,
      };

    case PAGE_TO_CHANGE:
      const updatedPageToChange = { ...state.pageToChange };
      updatedPageToChange[action.editorKey] = action.pageToChange;
      return {
        ...state,
        pageToChange: updatedPageToChange,
      };

    case TOGGLE_EDIT_LAYER_NAME:
      const updatedEditingLayerName = { ...state.editingLayerName };
      updatedEditingLayerName[action.editorKey] = action.value;
      return {
        ...state,
        editingLayerName: updatedEditingLayerName,
      };

    case RENAME_LAYER_SUCCESS:
      return {
        ...state,
        loading: false,
      };

    default:
      return state;
  }
}

export function setCanvasHighlightColor(editorKey, highlightColor) {
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

export function toggleCanvasColorPicker(editorKey) {
  return function (dispatch) {
    dispatch({
      type: TOGGLE_COLOR_PICKER,
      editorKey,
    });
  };
}

export function setAddTileSourceMode(editorKey, mode) {
  return function (dispatch) {
    dispatch({
      type: SET_ADD_TILE_SOURCE_MODE,
      editorKey,
      mode,
    });
  };
}

export function setImageUrl(editorKey, url) {
  return function (dispatch) {
    dispatch({
      type: SET_IMAGE_URL,
      editorKey,
      url,
    });
  };
}

export function setIsPencilMode(editorKey, isPencilMode) {
  return function (dispatch) {
    dispatch({
      type: SET_IS_PENCIL_MODE,
      editorKey,
      isPencilMode,
    });
  };
}

export function toggleCanvasHighlights(editorKey, value) {
  return function (dispatch) {
    dispatch({
      type: TOGGLE_HIGHLIGHTS,
      editorKey,
      value,
    });
  };
}

export function setZoomControl(editorKey, zoomValue) {
  return function (dispatch) {
    dispatch({
      type: SET_ZOOM_CONTROL,
      editorKey,
      zoomValue,
    });
  };
}

export function setGlobalCanvasDisplay(value) {
  return function (dispatch) {
    dispatch({
      type: SET_GLOBAL_CANVAS_DISPLAY,
      value,
    });
  };
}

export function changePage({ editorKey, page }) {
  return function (dispatch) {
    dispatch({
      type: PAGE_TO_CHANGE,
      pageToChange: page,
      editorKey,
    });
  };
}

export function toggleEditLayerName({ editorKey, value }) {
  return function (dispatch) {
    dispatch({
      type: TOGGLE_EDIT_LAYER_NAME,
      editorKey,
      value,
    });
  };
}
