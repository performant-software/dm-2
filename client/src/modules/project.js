import { push, replace } from 'react-router-redux';

export const TEXT_RESOURCE_TYPE = 'text';
export const CANVAS_RESOURCE_TYPE = 'canvas';
export const LOAD_PROJECT = 'project/LOAD_PROJECT';
export const GET_SUCCESS = 'project/GET_SUCCESS';
export const GET_ERRORED = 'project/GET_ERRORED';
export const CLEAR_PROJECT = 'project/CLEAR_PROJECT';
export const NEW_PROJECT = 'project/NEW_PROJECT';
export const POST_SUCCESS = 'project/POST_SUCCESS';
export const POST_ERRORED = 'project/POST_ERRORED';
export const UPDATE_PROJECT = 'project/UPDATE_PROJECT';
export const PATCH_SUCCESS = 'project/PATCH_SUCCESS';
export const PATCH_ERRORED = 'project/PATCH_ERRORED';
export const OPEN_DOCUMENT_POPOVER = 'project/OPEN_DOCUMENT_POPOVER';
export const CLOSE_DOCUMENT_POPOVER = 'project/CLOSE_DOCUMENT_POPOVER';

const initialState = {
  id: null,
  title: 'No project selected',
  contentsChildren: [],
  loading: false,
  errored: false,
  documentPopoverOpenFor: null
};

export default function(state = initialState, action) {
  switch (action.type) {
    case LOAD_PROJECT:
      return {
        ...state,
        title: action.title || state.title,
        loading: true
      };

    case CLEAR_PROJECT:
      return initialState;

    case NEW_PROJECT:
      return {
        ...state,
        loading: true,
        title: 'Untitled Project'
      };

    case UPDATE_PROJECT:
      return {
        ...state,
        loading: true
      }

    case GET_SUCCESS:
    case POST_SUCCESS:
    case PATCH_SUCCESS:
      return {
        ...state,
        loading: false,
        id: action.projectId,
        title: action.projectTitle,
        contentsChildren: action.contentsChildren || []
      };

    case GET_ERRORED:
    case POST_ERRORED:
    case PATCH_ERRORED:
      return {
        ...state,
        loading: false,
        errored: true
      };

    case OPEN_DOCUMENT_POPOVER:
      return {
        ...state,
        documentPopoverOpenFor: action.target
      };

    case CLOSE_DOCUMENT_POPOVER:
      return {
        ...state,
        documentPopoverOpenFor: null
      };

    default:
      return state;
  }
}

export function clearProject() {
  return function(dispatch) {
    dispatch({
      type: CLEAR_PROJECT
    });
  };
}

export function loadProject(projectId, title) {
  return function(dispatch) {
    dispatch({
      type: LOAD_PROJECT
    });

    fetch(`projects/${projectId}`)
    .then(response => {
      if (!response.ok) {
        throw Error(response.statusText);
      }
      return response;
    })
    .then(response => response.json())
    .then(project => dispatch({
      type: GET_SUCCESS,
      projectId: project.id,
      projectTitle: project.title,
      contentsChildren: project['contents_children']
    }))
    .catch(() => dispatch({
      type: GET_ERRORED
    }));
  };
}

export function newProject() {
  return function(dispatch) {
    dispatch({
      type: NEW_PROJECT
    });
    dispatch(push('/new'));

    fetch('/projects', {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      method: 'POST',
      body: JSON.stringify({
        title: 'Untitled Project'
      })
    })
    .then(response => {
      if (!response.ok) {
        throw Error(response.statusText);
      }
      return response;
    })
    .then(response => response.json())
    .then(project => {
      dispatch({
        type: POST_SUCCESS,
        projectId: project.id,
        projectTitle: project.title
      });
      dispatch(replace(`/${project.id}`));
    })
    .catch(() => dispatch({
      type: POST_ERRORED
    }));
  };
}

export function updateProject(projectId, attributes) {
  return function(dispatch) {
    dispatch({
      type: UPDATE_PROJECT
    });

    fetch(`/projects/${projectId}`, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      method: 'PATCH',
      body: JSON.stringify(attributes)
    })
    .then(response => {
      if (!response.ok) {
        throw Error(response.statusText);
      }
    })
    .then(response => response.json())
    .then(project => dispatch({
      type: PATCH_SUCCESS,
      projectId: project.id,
      projectTitle: project.title
    }))
    .catch(() => dispatch({
      type: PATCH_ERRORED
    }));
  };
}

export function openDocumentPopover(target) {
  return function(dispatch) {
    dispatch({
      type: OPEN_DOCUMENT_POPOVER,
      target
    });
  }
}

export function closeDocumentPopover() {
  return function(dispatch) {
    dispatch({
      type:CLOSE_DOCUMENT_POPOVER
    });
  }
}
