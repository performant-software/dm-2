export const UPDATE_EDITOR_STATE = 'textEditor/UPDATE_EDITOR_STATE';
export const CLOSE_EDITOR = 'textEditor/CLOSE_EDITOR';

const initialState = {
  editorStates: {}
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
      } ;

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
