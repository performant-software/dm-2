
export const START_SEARCH = 'search/START_SEARCH';
export const SEARCH_SUCCESS = 'search/SEARCH_SUCCESS';
export const SEARCH_ERRORED = 'search/SEARCH_ERRORED';
export const UPDATE_SEARCH_PHRASE_BUFFER = 'search/UPDATE_SEARCH_PHRASE_BUFFER';
export const CLOSE_SEARCH_POPUP = 'search/CLOSE_SEARCH_POPUP';

const initialState = {
  loading: false,
  searchPhrase: '',
  searchPhraseBuffer: '',
  searchResults: [],
  popupOpen: false,
  errored: false
};

export default function(state = initialState, action) {
  switch (action.type) {
    case START_SEARCH:
      return {
        ...state,
        searchPhrase: action.searchPhrase,
        searchResults: [],
        loading: true,
        errored: false
      }

    case SEARCH_SUCCESS:
      return {
        ...state,
        searchResults: action.searchResults,
        popupOpen: true,
        loading: false,
        errored: false
      }

    case SEARCH_ERRORED:
      return {
        ...state,
        popupOpen: false,
        loading: false,
        errored: true
      }

    case CLOSE_SEARCH_POPUP:
      return {
        ...initialState
      }

    case UPDATE_SEARCH_PHRASE_BUFFER:
      return {
        ...state,
        searchPhraseBuffer: action.searchPhraseBuffer
      }

    default:
      return state;
    }
}

export function startSearch(projectID, searchPhrase) {
    return function(dispatch) {
      dispatch({
        type: START_SEARCH,
        searchPhrase
      });
  
      fetch(`/projects/${projectID}/search?q=${encodeURI(searchPhrase)}`, {
        headers: {
          'access-token': localStorage.getItem('access-token'),
          'token-type': localStorage.getItem('token-type'),
          'client': localStorage.getItem('client'),
          'expiry': localStorage.getItem('expiry'),
          'uid': localStorage.getItem('uid')
        }
      })
      .then(response => {
        if (!response.ok) {
          throw Error(response.statusText);
        }
        return response;
      })
      .then(response => response.json())
      .then(searchResults => {
        return searchResults;
      })
      .then(searchResults => dispatch({
        type: SEARCH_SUCCESS,
        searchResults
      }))
      .catch(() => dispatch({
        type: SEARCH_ERRORED
      }));
    };
  }

  export function closeSearchPopup() {
    return function(dispatch) {
      dispatch({
        type: CLOSE_SEARCH_POPUP
      });
    }
  }

  export function updateSearchPhraseBuffer(searchPhraseBuffer) {
    return function(dispatch) {
      dispatch({
        type: UPDATE_SEARCH_PHRASE_BUFFER,
        searchPhraseBuffer
      });
    }
  }
