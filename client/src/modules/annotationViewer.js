export const SELECT_TARGET = 'annotationViewer/SELECT_TARGET';
export const CLEAR_SELECTION = 'annotationViewer/CLEAR_SELECTION';

const initialState = {
  selectedTarget: null
};

export default function(state = initialState, action) {
  switch (action.type) {
    case SELECT_TARGET:
      return {
        ...state,
        selectedTarget: action.target
      };

    case CLEAR_SELECTION:
      return {
        ...state,
        selectedTarget: null
      };

    default:
      return state;
  }
}

export function selectTarget(target) {
  return function(dispatch) {
    dispatch({
      type: SELECT_TARGET,
      target
    });
  }
}

export function clearSelection() {
  return function(dispatch) {
    dispatch({
      type: CLEAR_SELECTION
    });
  }
}
