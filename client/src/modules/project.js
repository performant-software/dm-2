import { push, replace } from 'react-router-redux';

export const TEXT_RESOURCE_TYPE = 'text';
export const CANVAS_RESOURCE_TYPE = 'canvas';
export const READ_PERMISSION = 'read';
export const WRITE_PERMISSION = 'write';
export const ADMIN_PERMISSION = 'admin';

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
export const DELETE_PROJECT = 'project/DELETE_PROJECT';
export const DELETE_SUCCESS = 'project/DELETE_SUCCESS';
export const DELETE_ERRORED = 'project/DELETE_ERRORED';
export const OPEN_DOCUMENT_POPOVER = 'project/OPEN_DOCUMENT_POPOVER';
export const CLOSE_DOCUMENT_POPOVER = 'project/CLOSE_DOCUMENT_POPOVER';
export const SETTINGS_SHOWN = 'project/SETTINGS_SHOWN';
export const SETTINGS_HIDDEN = 'project/SETTINGS_HIDDEN';
export const NEW_PERMISSION_LEVEL_CHANGE = 'project/NEW_PERMISSION_LEVEL_CHANGE';
export const NEW_PERMISSION_USER_CHANGE = 'project/NEW_PERMISSION_USER_CHANGE';
export const CREATE_PERMISSION_LOADING = 'project/CREATE_PERMISSION_LOADING';
export const CREATE_PERMISSION_ERRORED = 'project/CREATE_PERMISSION_ERRORED';
export const CREATE_PERMISSION_SUCCESS = 'project/CREATE_PERMISSION_SUCCESS';
export const TOGGLE_DELETE_CONFIRMATION = 'project/TOGGLE_DELETE_CONFIRMATION';
export const SET_SIDEBAR_WIDTH = 'project/SET_SIDEBAR_WIDTH';
export const SET_SIDEBAR_IS_DRAGGING = 'project/SET_SIDEBAR_IS_DRAGGING';

const initialState = {
  id: null,
  title: 'No project selected',
  description: '',
  contentsChildren: [],
  userProjectPermissions: [],
  public: false,
  currentUserPermissions: {},
  loading: false,
  errored: false,
  documentPopoverOpenFor: null,
  settingsShown: false,
  newPermissionLoading: false,
  newPermissionUser: null,
  newPermissionLevel: READ_PERMISSION,
  newPermissionError: null,
  deleteConfirmed: false,
  sidebarWidth: 490,
  sidebarIsDragging: false
};

export default function(state = initialState, action) {
  switch (action.type) {
    case LOAD_PROJECT:
      return {
        ...state,
        title: action.title || state.title,
        loading: true
      };

    case DELETE_SUCCESS:
    case CLEAR_PROJECT:
      return initialState;

    case NEW_PROJECT:
      return {
        ...state,
        loading: true,
        title: 'Untitled Project'
      };

    case UPDATE_PROJECT:
    case DELETE_PROJECT:
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
        description: action.projectDescription,
        userProjectPermissions: action.userProjectPermissions || [],
        contentsChildren: action.contentsChildren || [],
        public: action.public,
        currentUserPermissions: action.currentUserPermissions
      };

    case GET_ERRORED:
    case POST_ERRORED:
    case PATCH_ERRORED:
    case DELETE_ERRORED:
      console.log('project error');
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

    case SETTINGS_SHOWN:
      return {
        ...state,
        settingsShown: true
      };

    case SETTINGS_HIDDEN:
      return {
        ...state,
        settingsShown: false
      };

    case CREATE_PERMISSION_LOADING:
      return {
        ...state,
        newPermissionLoading: true,
      };

    case CREATE_PERMISSION_SUCCESS:
      return {
        ...state,
        newPermissionLoading: false,
        newPermissionError: null,
        newPermissionUser: null
      };

    case CREATE_PERMISSION_ERRORED:
      return {
        ...state,
        newPermissionLoading: false,
        newPermissionError: 'Unable to add user.',
      }

    case NEW_PERMISSION_USER_CHANGE:
      return {
        ...state,
        newPermissionUser: action.user
      };

    case NEW_PERMISSION_LEVEL_CHANGE:
      return {
        ...state,
        newPermissionLevel: action.level
      };

    case TOGGLE_DELETE_CONFIRMATION:
      return {
        ...state,
        deleteConfirmed: !state.deleteConfirmed
      };

    case SET_SIDEBAR_WIDTH:
      return {
        ...state,
        sidebarWidth: action.width
      };

    case SET_SIDEBAR_IS_DRAGGING:
      return {
        ...state,
        sidebarIsDragging: action.isDragging
      }

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

    fetch(`projects/${projectId}`, {
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
    .then(project => {
      if( project.forbidden ) {
        dispatch(push('/'))
      } else {
        dispatch({
          type: GET_SUCCESS,
          projectId: project.id,
          projectTitle: project.title,
          projectDescription: project.description,
          contentsChildren: project['contents_children'],
          userProjectPermissions: project['user_project_permissions'],
          public: project.public,
          currentUserPermissions: project['current_user_permissions']
        })      
      }
    })
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
        'access-token': localStorage.getItem('access-token'),
        'token-type': localStorage.getItem('token-type'),
        'client': localStorage.getItem('client'),
        'expiry': localStorage.getItem('expiry'),
        'uid': localStorage.getItem('uid'),
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
        projectTitle: project.title,
        userProjectPermissions: project['user_project_permissions'],
        public: project.public,
        currentUserPermissions: project['current_user_permissions']
      });
      dispatch(replace(`/${project.id}`));
      dispatch(showSettings());
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
        'Content-Type': 'application/json',
        'access-token': localStorage.getItem('access-token'),
        'token-type': localStorage.getItem('token-type'),
        'client': localStorage.getItem('client'),
        'expiry': localStorage.getItem('expiry'),
        'uid': localStorage.getItem('uid')
      },
      method: 'PATCH',
      body: JSON.stringify(attributes)
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
        type: PATCH_SUCCESS,
        projectId: project.id,
        projectTitle: project.title,
        projectDescription: project.description,
        contentsChildren: project['contents_children'],
        userProjectPermissions: project['user_project_permissions'],
        public: project.public,
        currentUserPermissions: project['current_user_permissions']
      });
    })
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
  };
}

export function closeDocumentPopover() {
  return function(dispatch) {
    dispatch({
      type: CLOSE_DOCUMENT_POPOVER
    });
  };
}

export function showSettings() {
  return function(dispatch) {
    dispatch({
      type: SETTINGS_SHOWN
    });
  };
}

export function hideSettings() {
  return function(dispatch) {
    dispatch({
      type: SETTINGS_HIDDEN
    });
  };
}

export function setNewPermissionUser(user) {
  return function(dispatch) {
    dispatch({
      type: NEW_PERMISSION_USER_CHANGE,
      user
    });
  };
}

export function setNewPermissionLevel(level) {
  return function(dispatch) {
    dispatch({
      type: NEW_PERMISSION_LEVEL_CHANGE,
      level
    });
  };
}

export function createNewPermission() {
  return function(dispatch, getState) {
    const { id, newPermissionUser, newPermissionLevel } = getState().project;

    if (newPermissionUser !== null) {
      dispatch({
        type: CREATE_PERMISSION_LOADING
      });

      fetch('/user_project_permissions', {
        headers: {
          'access-token': localStorage.getItem('access-token'),
          'token-type': localStorage.getItem('token-type'),
          'client': localStorage.getItem('client'),
          'expiry': localStorage.getItem('expiry'),
          'uid': localStorage.getItem('uid'),
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        method: 'POST',
        body: JSON.stringify({
          project_id: id,
          email: newPermissionUser,
          permission: newPermissionLevel
        })
      })
      .then(response => {
        if (!response.ok) {
          throw Error(response.statusText);
        }
      })
      .then(() => {
        dispatch({
          type: CREATE_PERMISSION_SUCCESS
        });
        dispatch(loadProject(id));
      })
      .catch(() => dispatch({
        type: CREATE_PERMISSION_ERRORED
      }));
    }
  }
}

export function deletePermission(id) {
  return function(dispatch, getState) {
    dispatch({
      type: CREATE_PERMISSION_LOADING
    });

    fetch(`/user_project_permissions/${id}`, {
      headers: {
        'access-token': localStorage.getItem('access-token'),
        'token-type': localStorage.getItem('token-type'),
        'client': localStorage.getItem('client'),
        'expiry': localStorage.getItem('expiry'),
        'uid': localStorage.getItem('uid'),
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      method: 'DELETE'
    })
    .then(response => {
      if (!response.ok) {
        throw Error(response.statusText);
      }
    })
    .then(() => {
      dispatch({
        type: CREATE_PERMISSION_SUCCESS
      });
      dispatch(loadProject(getState().project.id));
    })
    .catch(() => dispatch({
      type: CREATE_PERMISSION_ERRORED
    }));
  }
}

export function updatePermission(id, permissionLevel) {
  return function(dispatch, getState) {
    dispatch({
      type: CREATE_PERMISSION_LOADING
    });

    fetch(`/user_project_permissions/${id}`, {
      headers: {
        'access-token': localStorage.getItem('access-token'),
        'token-type': localStorage.getItem('token-type'),
        'client': localStorage.getItem('client'),
        'expiry': localStorage.getItem('expiry'),
        'uid': localStorage.getItem('uid'),
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      method: 'PATCH',
      body: JSON.stringify({
        permission: permissionLevel
      })
    })
    .then(response => {
      if (!response.ok) {
        throw Error(response.statusText);
      }
    })
    .then(() => {
      dispatch({
        type: CREATE_PERMISSION_SUCCESS
      });
      dispatch(loadProject(getState().project.id));
    })
    .catch(() => dispatch({
      type: CREATE_PERMISSION_ERRORED
    }));
  }
}

export function toggleDeleteConfirmation() {
  return function(dispatch) {
    dispatch({
      type: TOGGLE_DELETE_CONFIRMATION
    });
  }
}

export function deleteProject(projectId) {
  return function(dispatch) {
    dispatch({
      type: DELETE_PROJECT
    });

    fetch(`/projects/${projectId}`, {
      headers: {
        'access-token': localStorage.getItem('access-token'),
        'token-type': localStorage.getItem('token-type'),
        'client': localStorage.getItem('client'),
        'expiry': localStorage.getItem('expiry'),
        'uid': localStorage.getItem('uid'),
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      method: 'DELETE'
    })
    .then(response => {
      if (!response.ok) {
        throw Error(response.statusText);
      }
    })
    .then(() => {
      dispatch({
        type: DELETE_SUCCESS
      });
      dispatch(push('/'));
    })
    .catch(() => dispatch({
      type: DELETE_ERRORED
    }));
  }
}

export function setSidebarWidth(width) {
  return function(dispatch) {
    dispatch({
      type: SET_SIDEBAR_WIDTH,
      width
    });
  };
}

export function setSidebarIsDragging(isDragging) {
  return function(dispatch) {
    dispatch({
      type: SET_SIDEBAR_IS_DRAGGING,
      isDragging
    });
  };
}
