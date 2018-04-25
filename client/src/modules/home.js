export const LOADING = 'home/LOADING';
export const ERRORED = 'home/ERRORED';
export const FETCH_SUCCESS = 'home/FETCH_SUCCESS';

const initialState = {
  projects: [],
  loading: false,
  errored: false
};

export default function(state = initialState, action) {
  switch (action.type) {
    case LOADING:
      return {
        ...state,
        loading: true
      };

    case ERRORED:
      return {
        ...state,
        errored: true
      };

    case FETCH_SUCCESS:
      return {
        ...state,
        loading: false,
        projects: action.projects
      };

    default:
      return state;
  }
}

export function load() {
  return function(dispatch) {
    dispatch({
      type: LOADING
    });

    fetch('/projects')
    .then(response => {
      if (!response.ok) {
        throw Error(response.statusText);
      }
      return response;
    })
    .then(response => response.json())
    .then(projects => dispatch({
      type: FETCH_SUCCESS,
      projects
    }))
    .catch(() => dispatch({
      type: ERRORED
    }));
  };
}
